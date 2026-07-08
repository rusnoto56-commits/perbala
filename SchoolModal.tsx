/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { School } from '../types';
import { School as SchoolIcon, X } from 'lucide-react';
import { motion } from 'motion/react';

interface SchoolModalProps {
  isOpen: boolean;
  initialData?: School | null;
  onSubmit: (school: School) => void;
  onCancel: () => void;
}

export default function SchoolModal({ isOpen, initialData, onSubmit, onCancel }: SchoolModalProps) {
  const [npsn, setNpsn] = useState('');
  const [nama, setNama] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [jumlahSiswa, setJumlahSiswa] = useState(0);
  const [paguPerSiswa, setPaguPerSiswa] = useState(0);

  useEffect(() => {
    if (initialData) {
      setNpsn(initialData.npsn);
      setNama(initialData.nama);
      setKecamatan(initialData.kecamatan);
      setJumlahSiswa(initialData.jumlah_siswa);
      setPaguPerSiswa(initialData.pagu_per_siswa);
    } else {
      setNpsn('');
      setNama('');
      setKecamatan('');
      setJumlahSiswa(0);
      setPaguPerSiswa(0);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const totalPagu = jumlahSiswa * paguPerSiswa;
  const paguT1 = totalPagu / 2;
  const paguT2 = totalPagu / 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      npsn,
      nama,
      kecamatan,
      jumlah_siswa: jumlahSiswa,
      pagu_per_siswa: paguPerSiswa,
      pagu_t1: paguT1,
      pagu_t2: paguT2,
      status: 'Aktif'
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
            <SchoolIcon className="w-5 h-5 text-purple-600" />
            {initialData ? 'Edit Data Sekolah' : 'Hubungkan Sekolah Baru'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">NPSN</label>
            <input
              type="text"
              required
              value={npsn}
              onChange={(e) => setNpsn(e.target.value)}
              placeholder="Masukkan 8 digit NPSN"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Nama Sekolah</label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: SD NEGERI SEKARDOJA"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Kecamatan</label>
            <input
              type="text"
              required
              value={kecamatan}
              onChange={(e) => setKecamatan(e.target.value)}
              placeholder="Contoh: LARANGAN"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Jumlah Siswa</label>
              <input
                type="number"
                required
                min="0"
                value={jumlahSiswa || ''}
                onChange={(e) => setJumlahSiswa(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Pagu per Siswa (Rp)</label>
              <input
                type="number"
                required
                min="0"
                value={paguPerSiswa || ''}
                onChange={(e) => setPaguPerSiswa(parseFloat(e.target.value) || 0)}
                placeholder="Contoh: 1050000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-bold"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
            <div className="flex justify-between font-semibold text-slate-600">
              <span>Pagu Tahap 1 (50%):</span>
              <span className="text-amber-700 font-bold">{formatRupiah(paguT1)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-600">
              <span>Pagu Tahap 2 (50%):</span>
              <span className="text-blue-600 font-bold">{formatRupiah(paguT2)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-slate-700 border-t border-slate-200/60 pt-1.5">
              <span>Total Pagu Tahunan:</span>
              <span className="text-emerald-700">{formatRupiah(totalPagu)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-700 transition shadow-md shadow-purple-500/20"
            >
              Simpan Data
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
