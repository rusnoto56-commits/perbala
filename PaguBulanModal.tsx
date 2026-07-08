/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { School, Operator, MonthlyPagu } from '../types';
import { Calendar, X } from 'lucide-react';
import { motion } from 'motion/react';

interface PaguBulanModalProps {
  isOpen: boolean;
  initialBulan?: string | null;
  schools: School[];
  currentUser: Operator;
  monthlyPagu: MonthlyPagu[];
  onSubmit: (data: MonthlyPagu) => void;
  onCancel: () => void;
}

export default function PaguBulanModal({
  isOpen,
  initialBulan,
  schools,
  currentUser,
  monthlyPagu,
  onSubmit,
  onCancel
}: PaguBulanModalProps) {
  const [sekolah, setSekolah] = useState('');
  const [bulan, setBulan] = useState('Januari');
  const [pagu, setPagu] = useState(0);

  const monthsList = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  useEffect(() => {
    const activeSch = currentUser.role !== 'Admin' ? currentUser.instansi : (schools[0]?.nama || '');
    setSekolah(activeSch);

    if (initialBulan) {
      setBulan(initialBulan);
      const existing = monthlyPagu.find(
        (p) =>
          p.sekolah.toLowerCase().trim() === activeSch.toLowerCase().trim() &&
          p.bulan.toLowerCase().trim() === initialBulan.toLowerCase().trim()
      );
      setPagu(existing ? existing.pagu : 0);
    } else {
      setBulan('Januari');
      setPagu(0);
    }
  }, [initialBulan, isOpen, currentUser, schools, monthlyPagu]);

  // When school changes, update the prefilled pagu for the selected month
  const handleSchoolOrMonthChange = (schName: string, blnName: string) => {
    setSekolah(schName);
    setBulan(blnName);
    const existing = monthlyPagu.find(
      (p) =>
        p.sekolah.toLowerCase().trim() === schName.toLowerCase().trim() &&
        p.bulan.toLowerCase().trim() === blnName.toLowerCase().trim()
    );
    setPagu(existing ? existing.pagu : 0);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      sekolah,
      bulan,
      pagu
    });
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
            <Calendar className="w-5 h-5 text-purple-600" />
            Atur Pagu Bulanan Sekolah
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Sekolah</label>
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
                onChange={(e) => handleSchoolOrMonthChange(e.target.value, bulan)}
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

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Bulan</label>
            <select
              required
              value={bulan}
              onChange={(e) => handleSchoolOrMonthChange(sekolah, e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-bold"
            >
              {monthsList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Nominal Pagu (Rp)</label>
            <input
              type="number"
              required
              min="0"
              value={pagu || ''}
              onChange={(e) => setPagu(parseFloat(e.target.value) || 0)}
              placeholder="Contoh: 15000000"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-bold text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-700 transition shadow-md shadow-purple-500/20"
            >
              Simpan Pagu
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
