/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TarikTunai, School, Operator, MonthlyPagu, Transaction } from '../types';
import { ArrowDownToLine, AlertTriangle, X, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface TarikTunaiModalProps {
  isOpen: boolean;
  initialData?: TarikTunai | null;
  schools: School[];
  currentUser: Operator;
  monthlyPagu: MonthlyPagu[];
  tarikTunaiList: TarikTunai[];
  transactions: Transaction[];
  onSubmit: (tarik: TarikTunai) => void;
  onCancel: () => void;
}

export default function TarikTunaiModal({
  isOpen,
  initialData,
  schools,
  currentUser,
  monthlyPagu,
  tarikTunaiList,
  transactions,
  onSubmit,
  onCancel
}: TarikTunaiModalProps) {
  const [sekolah, setSekolah] = useState('');
  const [bulan, setBulan] = useState('');
  const [nilai, setNilai] = useState(0);

  const activeSchool = currentUser.role !== 'Admin' ? currentUser.instansi : sekolah;

  const monthsList = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const isReadOnly = initialData?.status === 'Selesai' && currentUser.role !== 'Admin';
  const isMonthSelectLocked = !!initialData && initialData.status === 'Selesai';

  // Helper to extract the month index (0-11) of a transaction
  const getTxMonthIndex = (t: Transaction): number => {
    if (!t.tanggal) return -1;
    const parts = t.tanggal.split('-');
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      if (m >= 1 && m <= 12) return m - 1;
    }
    return new Date(t.tanggal).getMonth();
  };

  // Helper to get the Indonesian month name of a transaction
  const getTxMonthName = (t: Transaction): string => {
    const idx = getTxMonthIndex(t);
    const months = [...monthsList];
    if (idx >= 0 && idx < 12) return months[idx];
    return '-';
  };

  // Calculate monthly available pagu
  const getMonthlyPaguLimit = (bln: string) => {
    const found = monthlyPagu.find(
      (p) =>
        p.sekolah.toLowerCase().trim() === activeSchool.toLowerCase().trim() &&
        p.bulan.toLowerCase().trim() === bln.toLowerCase().trim()
    );
    return found ? found.pagu : 0;
  };

  // Helper to calculate the cumulative Sisa Kuota Pencairan for a given month
  const getSisaKuotaPencairanForMonth = (targetBulan: string, excludeTarikId?: string): number => {
    const targetIdx = monthsList.indexOf(targetBulan);
    if (targetIdx < 0) return 0;

    let runningQuota = 0;

    for (let i = 0; i <= targetIdx; i++) {
      const m = monthsList[i];

      // 1. Get monthly pagu
      const pagu = getMonthlyPaguLimit(m);

      // 2. Get total belanja in this month (BUKU + ALAT + SIPLAH)
      const belanja = transactions
        .filter(
          (t) =>
            t.sekolah.toLowerCase().trim() === activeSchool.toLowerCase().trim() &&
            getTxMonthName(t).toLowerCase().trim() === m.toLowerCase().trim() &&
            t.status === 'Disetujui'
        )
        .reduce((sum, curr) => sum + curr.total_biaya, 0);

      // 3. Get total approved withdrawals in this month
      const tarik = tarikTunaiList
        .filter(
          (t) =>
            t.sekolah.toLowerCase().trim() === activeSchool.toLowerCase().trim() &&
            t.bulan.toLowerCase().trim() === m.toLowerCase().trim() &&
            t.status === 'Selesai' &&
            t.id !== excludeTarikId
        )
        .reduce((sum, curr) => sum + curr.nilai, 0);

      // Calculate running quota for month i:
      // runningQuota = runningQuota_prev + pagu_i - belanja_i - tarik_i
      runningQuota = runningQuota + pagu - belanja - tarik;
    }

    return runningQuota;
  };

  const getSisaKuotaSebelumnya = (bln: string): number => {
    const idx = monthsList.indexOf(bln);
    if (idx <= 0) return 0;
    return getSisaKuotaPencairanForMonth(monthsList[idx - 1], initialData?.id);
  };

  // Helper to get approved expenses in the current month
  const getBelanjaBulanIni = (targetBulan: string) => {
    if (!targetBulan) return 0;
    return transactions
      .filter(
        (t) =>
          t.sekolah.toLowerCase().trim() === activeSchool.toLowerCase().trim() &&
          getTxMonthName(t).toLowerCase().trim() === targetBulan.toLowerCase().trim() &&
          t.status === 'Disetujui'
      )
      .reduce((sum, curr) => sum + curr.total_biaya, 0);
  };

  const paguLimit = getMonthlyPaguLimit(bulan);
  const sisaKuotaSebelumnya = getSisaKuotaSebelumnya(bulan);
  const belanjaBulanIni = getBelanjaBulanIni(bulan);

  // Sum up already approved/selesai withdrawals for that specific school & month (excluding currently editing one)
  const totalTarikBulanIni = tarikTunaiList
    .filter(
      (t) =>
        t.sekolah.toLowerCase().trim() === activeSchool.toLowerCase().trim() &&
        t.bulan.toLowerCase().trim() === bulan.toLowerCase().trim() &&
        t.status === 'Selesai' &&
        t.id !== initialData?.id
    )
    .reduce((sum, curr) => sum + curr.nilai, 0);

  // Formula: pagu bulanan + sisa kuota pencairan bulan sebelumnya - belanja bulan ini - total tarik bulan ini
  const availableLimit = paguLimit + sisaKuotaSebelumnya - belanjaBulanIni - totalTarikBulanIni;
  const isOverbudget = nilai > availableLimit;

  useEffect(() => {
    if (initialData) {
      setSekolah(initialData.sekolah);
      setBulan(initialData.bulan);
      setNilai(initialData.nilai);
    } else {
      const defaultSch = currentUser.role !== 'Admin' ? currentUser.instansi : (schools[0]?.nama || '');
      setSekolah(defaultSch);
      setBulan('');
      setNilai(0);
    }
  }, [initialData, isOpen, currentUser, schools]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!bulan) return;
    const finalId = initialData?.id || 'TRK-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    onSubmit({
      id: finalId,
      sekolah: activeSchool,
      bulan,
      pagu_bulanan: paguLimit,
      nilai,
      status: initialData?.status || 'Pending', // Retain status if editing
      verifikator: initialData?.verifikator || '-'
    });
  };

  const formatRupiah = (num: number) => {
    const isNegative = num < 0;
    const absVal = Math.round(Math.abs(num));
    return (isNegative ? '-' : '') + 'Rp ' + absVal.toLocaleString('id-ID');
  };

  // Determine if a month is locked (already has a fully approved withdrawal covering the pagu limit)
  const isMonthLocked = (bln: string) => {
    const limit = getMonthlyPaguLimit(bln);
    if (limit === 0) return false;
    const approved = tarikTunaiList
      .filter(
        (t) =>
          t.sekolah.toLowerCase().trim() === activeSchool.toLowerCase().trim() &&
          t.bulan.toLowerCase().trim() === bln.toLowerCase().trim() &&
          t.status === 'Selesai'
      )
      .reduce((sum, curr) => sum + curr.nilai, 0);
    return approved >= limit;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
      >
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-sm md:text-base font-extrabold text-slate-800 flex items-center gap-2">
            {isReadOnly ? (
              <>
                <Eye className="w-5 h-5 text-purple-600" />
                Detail Pengajuan Tarik Tunai
              </>
            ) : (
              <>
                <ArrowDownToLine className="w-5 h-5 text-amber-600" />
                {initialData ? 'Edit Pengajuan Tarik Tunai' : 'Pengajuan Tarik Tunai Baru'}
              </>
            )}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isReadOnly && (
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-800 text-[11px] font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span>Pengajuan ini telah disetujui Admin Utama dan terkunci (Hanya Lihat).</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Sekolah Pemohon</label>
            {currentUser.role !== 'Admin' ? (
              <input
                type="text"
                disabled
                value={currentUser.instansi}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-slate-500 cursor-not-allowed font-semibold"
              />
            ) : (
              <select
                required
                disabled={isReadOnly}
                value={sekolah}
                onChange={(e) => setSekolah(e.target.value)}
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-semibold ${
                  isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                }`}
              >
                {schools.map((sch) => (
                  <option key={sch.npsn} value={sch.nama}>
                    {sch.nama}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">
              Bulan Penyerapan {isMonthSelectLocked && <span className="text-[10px] text-amber-600 font-bold">(Terkunci - Disetujui Admin)</span>}
            </label>
            <select
              required
              disabled={isMonthSelectLocked || isReadOnly}
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-bold ${
                (isMonthSelectLocked || isReadOnly) ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
              }`}
            >
              <option value="" disabled>-- Pilih Bulan --</option>
              {monthsList.map((m) => {
                const locked = isMonthLocked(m);
                return (
                  <option key={m} value={m} disabled={locked}>
                    {m} {locked ? ' (Lunas - Terkunci)' : ` (Limit: ${formatRupiah(getMonthlyPaguLimit(m))})`}
                  </option>
                );
              })}
            </select>
          </div>

          {bulan && (
            <div className="bg-slate-50 p-3 border border-slate-100 rounded-xl space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Pagu Bulanan Bulan {bulan}:</span>
                <span className="text-slate-800 font-bold">{formatRupiah(paguLimit)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sisa Kuota Pencairan Bulan Sebelumnya:</span>
                <span className={`${sisaKuotaSebelumnya >= 0 ? 'text-emerald-700' : 'text-rose-700'} font-bold`}>
                  {sisaKuotaSebelumnya >= 0 ? '+' : ''}{formatRupiah(sisaKuotaSebelumnya)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Belanja Bulan {bulan}:</span>
                <span className="text-rose-700 font-bold">-{formatRupiah(belanjaBulanIni)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tarik Tunai Bulan Ini Lainnya:</span>
                <span className="text-amber-700 font-bold">-{formatRupiah(totalTarikBulanIni)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-1.5 text-slate-600 font-extrabold">
                <span>Sisa Kuota Pencairan:</span>
                <span className={availableLimit >= 0 ? 'text-teal-700' : 'text-rose-700'}>{formatRupiah(availableLimit)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Jumlah Yang Ingin Ditarik (Rp)</label>
            <input
              type="number"
              required
              min="1"
              disabled={isReadOnly}
              value={nilai || ''}
              onChange={(e) => setNilai(parseFloat(e.target.value) || 0)}
              placeholder="Masukkan nominal"
              className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-bold ${
                isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {nilai > 0 && bulan && !isReadOnly && (
            <div
              className={`p-3 rounded-xl border border-dashed flex flex-col gap-1 ${
                isOverbudget
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider">
                {isOverbudget ? 'Kelebihan Penarikan (Overbudget!)' : 'Sesuai Pagu (Aman)'}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                {isOverbudget
                  ? `Nominal pencairan melebihi sisa kuota pagu bulanan tersedia sebesar ${formatRupiah(nilai - availableLimit)}.`
                  : `Sisa kuota pagu bulanan setelah penarikan ini adalah ${formatRupiah(availableLimit - nilai)}.`}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            {!isReadOnly && (
              <button
                type="submit"
                className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 transition shadow-md shadow-amber-500/20"
              >
                Kirim Pengajuan
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className={`py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition ${isReadOnly ? 'w-full' : 'px-5'}`}
            >
              {isReadOnly ? 'Tutup Rincian' : 'Batal'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
