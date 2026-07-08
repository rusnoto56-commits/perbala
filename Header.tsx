/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Operator, School } from '../types';
import { Filter, Power, HelpCircle, RefreshCw, Cloud, CloudOff } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  currentUser: Operator;
  schools: School[];
  selectedSchoolFilter: string;
  onSchoolFilterChange: (schoolName: string) => void;
  onLogout: () => void;
  systemName: string;
  apiUrl?: string;
  syncStatus?: 'active' | 'simulator' | 'error' | 'syncing';
  lastSyncTime?: Date | null;
  onManualSync?: () => void;
  syncErrorReason?: string | null;
}

export default function Header({
  currentTab,
  currentUser,
  schools,
  selectedSchoolFilter,
  onSchoolFilterChange,
  onLogout,
  systemName,
  apiUrl,
  syncStatus = 'simulator',
  lastSyncTime = null,
  onManualSync,
  syncErrorReason = null
}: HeaderProps) {
  // Format tab ID to beautiful human-readable titles
  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'DASHBOARD UTAMA';
      case 'data-sekolah': return 'DATA LEMBAGA SEKOLAH';
      case 'data-anggota': return 'DATA OPERATOR & ANGGOTA';
      case 'pagu-anggaran': return 'PAGU ANGGARAN UTAMA';
      case 'pagu-tiap-bulan': return 'PAGU BULANAN SEKOLAH';
      case 'anggaran-modal-buku': return 'RAB - MODAL BUKU';
      case 'anggaran-modal-alat': return 'RAB - MODAL ALAT';
      case 'anggaran-habis-pakai': return 'RAB - HABIS PAKAI (SIPLAH)';
      case 'belanja-modal-buku': return 'REALISASI BELANJA - BUKU';
      case 'belanja-modal-alat': return 'REALISASI BELANJA - ALAT';
      case 'belanja-habis-pakai': return 'REALISASI BELANJA - HABIS PAKAI';
      case 'transaksi-tarik-tunai': return 'TRANSAKSI TARIK TUNAI';
      case 'validasi-tarik-tunai': return 'VALIDASI TARIK TUNAI';
      case 'rekap-modal': return 'REKAP PRESENTASE MODAL';
      case 'rekap-habis-pakai': return 'REKAP BELANJA HABIS PAKAI (SIPLAH)';
      case 'validasi-pagu': return 'VALIDASI LIMIT PAGU';
      case 'laporan-tahunan': return 'LAPORAN TAHUNAN';
      case 'pengaturan': return 'PENGATURAN PROFIL DINAS';
      default: return 'MONITORING PERBALA';
    }
  };

  const showFilter = currentUser.role === 'Admin';
  const userInitials = currentUser.nama.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  const renderSyncIndicator = () => {
    const timeString = lastSyncTime
      ? lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '';

    switch (syncStatus) {
      case 'syncing':
        return (
          <div className="hidden lg:flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-xl text-purple-700 font-bold text-[11px] h-9 shadow-sm">
            <RefreshCw className="w-3.5 h-3.5 text-purple-500 animate-spin" />
            <span>Sinkronisasi Awan...</span>
          </div>
        );
      case 'error':
        return (
          <div className="hidden lg:flex items-center gap-2">
            <div 
              className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl text-rose-700 font-bold text-[11px] h-9 shadow-sm cursor-help"
              title={syncErrorReason || 'Koneksi terputus ke server database'}
            >
              <CloudOff className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>Awan Terputus</span>
              <button
                onClick={onManualSync}
                type="button"
                title="Coba hubungkan kembali sekarang"
                className="p-1 hover:bg-rose-100 rounded-lg text-rose-600 transition"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            {syncErrorReason && (
              <span className="max-w-[220px] text-[10px] text-rose-500 font-semibold bg-rose-50 border border-rose-100/50 px-2 py-1 rounded-lg truncate" title={syncErrorReason}>
                Penyebab: {syncErrorReason}
              </span>
            )}
          </div>
        );
      case 'active':
      default:
        return (
          <div className="hidden lg:flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-emerald-700 font-bold text-[11px] h-9 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sinkronisasi Awan Aktif {timeString && `(${timeString})`}</span>
            <button
              onClick={onManualSync}
              type="button"
              title="Sinkronisasi sekarang"
              className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600 transition"
            >
              <RefreshCw className="w-3 h-3 hover:rotate-180 duration-500 transition-transform" />
            </button>
          </div>
        );
    }
  };

  return (
    <header className="h-20 px-6 md:px-8 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm shrink-0">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-wider">{getTabTitle()}</h2>
          <p className="text-[11px] text-slate-500 font-medium">{systemName}</p>
        </div>

        {showFilter && (
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl ml-4">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-purple-600" /> Filter Instansi:
            </span>
            <select
              value={selectedSchoolFilter}
              onChange={(e) => onSchoolFilterChange(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-slate-800 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="SEMUA">Semua Sekolah (Kolektif)</option>
              {schools.map((sch) => (
                <option key={sch.npsn} value={sch.nama}>
                  {sch.nama}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {renderSyncIndicator()}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-bold text-slate-800">{currentUser.nama}</span>
          <span className="text-[9px] text-purple-600 font-bold tracking-wider uppercase">
            {currentUser.role === 'Admin' ? 'AKSES PENUH' : 'OPERATOR'}
          </span>
        </div>

        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-700 text-xs font-black border border-purple-500/20 shadow-sm">
          {userInitials}
        </div>

        <button
          onClick={onLogout}
          title="Keluar dari sistem"
          className="flex items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-rose-500/15 border border-slate-200 hover:border-rose-500/30 text-slate-600 hover:text-rose-600 transition duration-200"
        >
          <Power className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
