/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileSpreadsheet, X } from 'lucide-react';
import { motion } from 'motion/react';

interface ImportModalProps {
  isOpen: boolean;
  type: 'schools' | 'operators';
  onImportSchools: (data: any[]) => void;
  onImportOperators: (data: any[]) => void;
  onCancel: () => void;
}

export default function ImportModal({ isOpen, type, onImportSchools, onImportOperators, onCancel }: ImportModalProps) {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawText = inputText.trim();
    if (!rawText) return;

    const lines = rawText.split('\n');
    const parsed: any[] = [];

    lines.forEach((line) => {
      const parts = line.trim().split('\t');
      if (type === 'schools') {
        if (parts.length >= 5) {
          const npsn = parts[0].trim();
          const nama = parts[1].trim();
          const kecamatan = parts[2].trim();
          const siswa = parseInt(parts[3]) || 0;
          const paguPerSiswa = parseFloat(parts[4]) || 0;
          const totalPagu = siswa * paguPerSiswa;
          parsed.push({
            npsn,
            nama,
            kecamatan,
            jumlah_siswa: siswa,
            pagu_per_siswa: paguPerSiswa,
            pagu_t1: totalPagu / 2,
            pagu_t2: totalPagu / 2,
            status: 'Aktif'
          });
        }
      } else {
        if (parts.length >= 5) {
          parsed.push({
            nama: parts[0].trim(),
            username: parts[1].trim(),
            password: parts[2].trim(),
            role: (parts[3].trim().toLowerCase() === 'admin' ? 'Admin' : 'Anggota') as 'Admin' | 'Anggota',
            instansi: parts[4].trim(),
            status: 'Offline'
          });
        }
      }
    });

    if (parsed.length === 0) {
      alert('Format spreadsheet tidak sesuai!');
      return;
    }

    if (type === 'schools') {
      onImportSchools(parsed);
    } else {
      onImportOperators(parsed);
    }
    setInputText('');
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
            <FileSpreadsheet className="w-5 h-5 text-teal-600" />
            {type === 'schools' ? 'Impor Data Sekolah (.tsv)' : 'Impor Operator & Anggota (.tsv)'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Salin tabel dari Excel/Spreadsheet (termasuk kolom) dan tempel ke area bawah dengan susunan kolom:{' '}
          {type === 'schools' ? (
            <b className="text-teal-700 block mt-1">NPSN | Nama Sekolah | Kecamatan | Jumlah Siswa | Pagu per Siswa</b>
          ) : (
            <b className="text-teal-700 block mt-1">Nama Lengkap | Username | Password | Role | Instansi/Sekolah</b>
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            rows={8}
            required
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              type === 'schools'
                ? '20310912\tSDN 1 Sejahtera\tKec. Barat\t100\t900000'
                : 'Budi Santoso\tbudi123\tpass123\tAnggota\tSDN 1 Sejahtera Utama'
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono text-xs focus:outline-none focus:border-teal-500"
          />

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl text-xs hover:bg-teal-700 transition shadow-md shadow-teal-500/20"
            >
              Impor Sekarang
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
