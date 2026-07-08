/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Transaction, School, Operator, RAB } from '../types';
import { PlusCircle, AlertTriangle, X } from 'lucide-react';
import { motion } from 'motion/react';

interface TransactionModalProps {
  isOpen: boolean;
  initialData?: Transaction | null;
  schools: School[];
  currentUser: Operator;
  rabList: RAB[];
  transactions: Transaction[];
  onSubmit: (transaction: Transaction) => void;
  onCancel: () => void;
}

export default function TransactionModal({
  isOpen,
  initialData,
  schools,
  currentUser,
  rabList,
  transactions,
  onSubmit,
  onCancel
}: TransactionModalProps) {
  const [sekolah, setSekolah] = useState('');
  const [kategori, setKategori] = useState<'BUKU' | 'ALAT' | 'SIPLAH'>('BUKU');
  const [rabId, setRabId] = useState('');
  const [namaBarang, setNamaBarang] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [totalBiaya, setTotalBiaya] = useState(0);
  const [tanggal, setTanggal] = useState('');

  // Determine available schools
  const userSchool = currentUser.role !== 'Admin' ? currentUser.instansi : sekolah;

  // Filter RAB items based on school and category
  const filteredRAB = rabList.filter(
    (rab) =>
      rab.sekolah.toLowerCase().trim() === userSchool.toLowerCase().trim() &&
      rab.kategori === kategori
  );

  // Selected RAB details and remaining balance calculation
  const selectedRAB = rabList.find((r) => r.id === rabId);
  const getRemainingRABBalance = (rabItem?: RAB) => {
    if (!rabItem) return 0;
    // Sum all transaction expenditures under this RAB (excluding current transaction if editing)
    const spent = transactions
      .filter((t) => t.rab_id === rabItem.id && t.status === 'Disetujui' && t.id !== initialData?.id)
      .reduce((sum, current) => sum + current.total_biaya, 0);
    return rabItem.alokasi - spent;
  };

  const remainingBalance = getRemainingRABBalance(selectedRAB);
  const isOverbudget = totalBiaya > remainingBalance;

  useEffect(() => {
    if (initialData) {
      setSekolah(initialData.sekolah);
      setKategori(initialData.kategori);
      setRabId(initialData.rab_id);
      setNamaBarang(initialData.nama_barang);
      setJumlah(initialData.jumlah);
      setTotalBiaya(initialData.total_biaya);
      setTanggal(initialData.tanggal);
    } else {
      const defaultSchool = currentUser.role !== 'Admin' ? currentUser.instansi : (schools[0]?.nama || '');
      setSekolah(defaultSchool);
      setKategori('BUKU');
      setRabId('');
      setNamaBarang('');
      setJumlah('');
      setTotalBiaya(0);
      setTanggal(new Date().toISOString().split('T')[0]);
    }
  }, [initialData, isOpen, currentUser, schools]);

  // Handle auto-update of RAB selection and defaulting item names
  useEffect(() => {
    if (!initialData && filteredRAB.length > 0) {
      // Pick first available RAB if empty or not matching
      if (!rabId || !filteredRAB.some((r) => r.id === rabId)) {
        setRabId(filteredRAB[0].id);
        setNamaBarang(`Realisasi ${filteredRAB[0].nama}`);
      }
    } else if (filteredRAB.length === 0) {
      setRabId('');
      setNamaBarang('');
    }
  }, [sekolah, kategori, rabId, filteredRAB, initialData]);

  if (!isOpen) return null;

  const handleRabChange = (id: string) => {
    setRabId(id);
    const selected = filteredRAB.find((r) => r.id === id);
    if (selected) {
      setNamaBarang(`Realisasi ${selected.nama}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const schInfo = schools.find((s) => s.nama === (currentUser.role !== 'Admin' ? currentUser.instansi : sekolah));
    const npsn = schInfo ? schInfo.npsn : '-';
    const finalId = initialData?.id || 'B' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    onSubmit({
      id: finalId,
      rab_id: rabId,
      nama_barang: namaBarang,
      sekolah: currentUser.role !== 'Admin' ? currentUser.instansi : sekolah,
      npsn,
      kategori,
      jumlah,
      total_biaya: totalBiaya,
      tanggal,
      status: 'Disetujui' // Auto-approve on save
    });
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
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
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-purple-600" />
            {initialData ? 'Edit Realisasi Belanja' : 'Realisasi Transaksi Baru'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Sekolah Pembayar</label>
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
                value={sekolah}
                onChange={(e) => setSekolah(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-semibold"
              >
                {schools.map((sch) => (
                  <option key={sch.npsn} value={sch.nama}>
                    {sch.nama}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Kategori Belanja</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as 'BUKU' | 'ALAT' | 'SIPLAH')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-bold"
              >
                <option value="BUKU">BUKU</option>
                <option value="ALAT">ALAT / BARANG</option>
                <option value="SIPLAH">SIPLAH / HABIS PAKAI</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Pilih Referensi RAB</label>
              <select
                required
                value={rabId}
                onChange={(e) => handleRabChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-bold"
              >
                {filteredRAB.length === 0 ? (
                  <option value="" disabled>-- Tidak Ada RAB --</option>
                ) : (
                  filteredRAB.map((rab) => (
                    <option key={rab.id} value={rab.id}>
                      [{rab.id}] {rab.nama}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {selectedRAB && (
            <div className="bg-slate-50 p-3 border border-slate-100 rounded-xl space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Alokasi Anggaran RAB:</span>
                <span className="text-slate-800 font-bold">{formatRupiah(selectedRAB.alokasi)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sisa Saldo Tersedia:</span>
                <span className="text-teal-700 font-black">{formatRupiah(remainingBalance)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Nama Belanja / Barang</label>
            <input
              type="text"
              required
              value={namaBarang}
              onChange={(e) => setNamaBarang(e.target.value)}
              placeholder="Contoh: Pembelian Buku Paket Kurmer Matematika"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Volume / Jumlah</label>
              <input
                type="text"
                required
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder="Contoh: 50 Pcs atau 2 Rim"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Total Biaya Realisasi (Rp)</label>
              <input
                type="number"
                required
                min="0"
                value={totalBiaya || ''}
                onChange={(e) => setTotalBiaya(parseFloat(e.target.value) || 0)}
                placeholder="Contoh: 2500000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-bold"
              />
            </div>
          </div>

          {isOverbudget && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 font-bold rounded-xl flex items-center gap-2 text-[10px]">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 animate-bounce" />
              <span>Peringatan: Total biaya melebihi sisa alokasi RAB untuk item ini!</span>
            </div>
          )}

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Tanggal Transaksi</label>
            <input
              type="date"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-700 transition shadow-md shadow-purple-500/20"
            >
              Simpan Transaksi
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
            >
              Batal
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
