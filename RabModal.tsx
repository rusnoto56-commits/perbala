/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RAB, School, Operator } from '../types';
import { ClipboardList, X } from 'lucide-react';
import { motion } from 'motion/react';

interface RabModalProps {
  isOpen: boolean;
  initialData?: RAB | null;
  schools: School[];
  currentUser: Operator;
  onSubmit: (rab: RAB) => void;
  onCancel: () => void;
}

export default function RabModal({ isOpen, initialData, schools, currentUser, onSubmit, onCancel }: RabModalProps) {
  const [nama, setNama] = useState('');
  const [sekolah, setSekolah] = useState('');
  const [kategori, setKategori] = useState<'BUKU' | 'ALAT' | 'SIPLAH'>('BUKU');
  const [alokasi, setAlokasi] = useState(0);

  useEffect(() => {
    if (initialData) {
      setNama(initialData.nama);
      setSekolah(initialData.sekolah);
      setKategori(initialData.kategori);
      setAlokasi(initialData.alokasi);
    } else {
      setNama('');
      // If user is not Admin, restrict them to their school instansi
      if (currentUser.role !== 'Admin') {
        setSekolah(currentUser.instansi);
      } else {
        setSekolah(schools[0]?.nama || '');
      }
      setKategori('BUKU');
      setAlokasi(0);
    }
  }, [initialData, isOpen, currentUser, schools]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = initialData?.id || 'RAB-' + kategori.charAt(0) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    onSubmit({
      id,
      nama,
      sekolah,
      kategori,
      alokasi
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
            <ClipboardList className="w-5 h-5 text-purple-600" />
            {initialData ? 'Edit Item Anggaran (RAB)' : 'Tambah Rencana Anggaran (RAB)'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Sekolah Pemilik Anggaran</label>
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

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Kategori Belanja</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value as 'BUKU' | 'ALAT' | 'SIPLAH')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-bold"
            >
              <option value="BUKU">BUKU (Modal Buku Paket)</option>
              <option value="ALAT">ALAT (Modal Komputer, Proyektor, Aset)</option>
              <option value="SIPLAH">SIPLAH (Habis Pakai, Kertas, ATK)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Nama Item Anggaran</label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Pengadaan Laptop Chromebook Pembelajaran"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Nominal Alokasi Anggaran (Rp)</label>
            <input
              type="number"
              required
              min="0"
              value={alokasi || ''}
              onChange={(e) => setAlokasi(parseFloat(e.target.value) || 0)}
              placeholder="Contoh: 15000000"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-bold"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-700 transition shadow-md shadow-purple-500/20"
            >
              Simpan RAB
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
