/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Operator, School } from '../types';
import { User, Eye, EyeOff, X } from 'lucide-react';
import { motion } from 'motion/react';

interface UserModalProps {
  isOpen: boolean;
  initialData?: Operator | null;
  schools: School[];
  onSubmit: (operator: Operator) => void;
  onCancel: () => void;
}

export default function UserModal({ isOpen, initialData, schools, onSubmit, onCancel }: UserModalProps) {
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Anggota'>('Anggota');
  const [instansi, setInstansi] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNama(initialData.nama);
      setUsername(initialData.username);
      setPassword(initialData.password || '');
      setRole(initialData.role);
      setInstansi(initialData.instansi);
    } else {
      setNama('');
      setUsername('');
      setPassword('');
      setRole('Anggota');
      setInstansi('');
    }
    setShowPassword(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nama,
      username,
      password,
      role,
      instansi,
      status: 'Offline'
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
            <User className="w-5 h-5 text-purple-600" />
            {initialData ? 'Edit Operator / Pengguna' : 'Tambah Operator Baru'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Nama Lengkap</label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Username / Email</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: budi123 atau email@domain.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Peran (Role)</label>
              <select
                value={role}
                onChange={(e) => {
                  const val = e.target.value as 'Admin' | 'Anggota';
                  setRole(val);
                  if (val === 'Admin') {
                    if (!instansi || instansi.trim() === '') {
                      setInstansi('Dinas Pendidikan Kab. Sejahtera');
                    }
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-bold"
              >
                <option value="Anggota">Anggota / Sekolah</option>
                <option value="Admin">Admin Dinas</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Instansi / Sekolah</label>
              {role === 'Admin' ? (
                <input
                  type="text"
                  required
                  value={instansi}
                  onChange={(e) => setInstansi(e.target.value)}
                  placeholder="Contoh: Dinas Pendidikan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-semibold"
                />
              ) : (
                <select
                  required
                  value={instansi}
                  onChange={(e) => setInstansi(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-semibold"
                >
                  <option value="" disabled>-- Pilih Sekolah --</option>
                  {schools.map((sch) => (
                    <option key={sch.npsn} value={sch.nama}>
                      {sch.nama}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-700 transition shadow-md shadow-purple-500/20"
            >
              Simpan Operator
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
