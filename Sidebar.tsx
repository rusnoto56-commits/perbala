/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Operator, SystemConfig } from '../types';
import {
  LayoutDashboard,
  School,
  Users,
  Coins,
  CalendarRange,
  BookOpen,
  Wrench,
  ShoppingCart,
  BookMarked,
  Cpu,
  PackageOpen,
  ArrowDownToLine,
  CheckSquare,
  PieChart,
  ClipboardList,
  Scale,
  FileText,
  Settings,
  LogOut,
  Wallet
} from 'lucide-react';

interface SidebarProps {
  currentUser: Operator;
  currentTab: string;
  onTabChange: (tabId: string) => void;
  onLogout: () => void;
  onRoleSwitch: (role: 'Admin' | 'Anggota') => void;
  pendingTarikCount: number;
  systemConfig: SystemConfig;
}

export default function Sidebar({
  currentUser,
  currentTab,
  onTabChange,
  onLogout,
  onRoleSwitch,
  pendingTarikCount,
  systemConfig
}: SidebarProps) {
  const isSelected = (tabId: string) => currentTab === tabId;

  const btnClass = (tabId: string) => {
    const selected = isSelected(tabId);
    if (tabId === 'dashboard') {
      return `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-left font-bold ${
        selected
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
          : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
      }`;
    }
    return `w-full flex items-center justify-between px-4 py-2 rounded-lg text-xs transition text-left ${
      selected
        ? 'bg-purple-600 text-white font-extrabold shadow-md shadow-purple-500/25'
        : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
    }`;
  };

  return (
    <aside className="w-full md:w-64 bg-slate-950 border-r border-white/5 flex flex-col shrink-0 text-slate-300">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white shrink-0 overflow-hidden">
          {systemConfig.logo_preset === 'custom' && systemConfig.logo_url ? (
            <img src={systemConfig.logo_url} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : systemConfig.logo_preset === 'preset-school' ? (
            <School className="w-5 h-5" />
          ) : systemConfig.logo_preset === 'preset-coins' ? (
            <Coins className="w-5 h-5" />
          ) : systemConfig.logo_preset === 'preset-book' ? (
            <BookOpen className="w-5 h-5" />
          ) : (
            <Wallet className="w-5 h-5" />
          )}
        </div>
        <div>
          <h1 className="font-black text-xs tracking-wider text-white leading-tight uppercase line-clamp-2">
            {systemConfig.org_name || 'MONITORING PERBALA'}
          </h1>
          <span className="text-[9px] text-purple-300 font-bold uppercase tracking-widest block mt-0.5">SISTEM BOSP</span>
        </div>
      </div>

      {/* Nav Items Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div>
          <button onClick={() => onTabChange('dashboard')} className={btnClass('dashboard')}>
            <span className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>DASHBOARD</span>
            </span>
          </button>
        </div>

        {currentUser.role === 'Admin' && (
          <div>
            <span className="block px-4 text-[9px] font-black text-purple-300 uppercase tracking-widest mb-2">MASTER DATA</span>
            <div className="space-y-1">
              <button onClick={() => onTabChange('data-sekolah')} className={btnClass('data-sekolah')}>
                <span className="flex items-center gap-3">
                  <School className="w-4 h-4" />
                  <span>DATA SEKOLAH</span>
                </span>
              </button>
              <button onClick={() => onTabChange('data-anggota')} className={btnClass('data-anggota')}>
                <span className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>DATA OPERATOR</span>
                </span>
              </button>
            </div>
          </div>
        )}

        <div>
          <span className="block px-4 text-[9px] font-black text-purple-300 uppercase tracking-widest mb-2">PENGANGGARAN (RAB)</span>
          <div className="space-y-1">
            <button onClick={() => onTabChange('pagu-anggaran')} className={btnClass('pagu-anggaran')}>
              <span className="flex items-center gap-3">
                <Coins className="w-4 h-4" />
                <span>PAGU ANGGARAN</span>
              </span>
            </button>
            <button onClick={() => onTabChange('pagu-tiap-bulan')} className={btnClass('pagu-tiap-bulan')}>
              <span className="flex items-center gap-3">
                <CalendarRange className="w-4 h-4" />
                <span>PAGU TIAP BULAN</span>
              </span>
            </button>
            <button onClick={() => onTabChange('anggaran-modal-buku')} className={btnClass('anggaran-modal-buku')}>
              <span className="flex items-center gap-3">
                <BookOpen className="w-4 h-4" />
                <span>RAB - MODAL BUKU</span>
              </span>
            </button>
            <button onClick={() => onTabChange('anggaran-modal-alat')} className={btnClass('anggaran-modal-alat')}>
              <span className="flex items-center gap-3">
                <Wrench className="w-4 h-4" />
                <span>RAB - MODAL ALAT</span>
              </span>
            </button>
            <button onClick={() => onTabChange('anggaran-habis-pakai')} className={btnClass('anggaran-habis-pakai')}>
              <span className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4" />
                <span>RAB - HABIS PAKAI</span>
              </span>
            </button>
          </div>
        </div>

        <div>
          <span className="block px-4 text-[9px] font-black text-purple-300 uppercase tracking-widest mb-2">PENATAUSAHAAN</span>
          <div className="space-y-1">
            <button onClick={() => onTabChange('belanja-modal-buku')} className={btnClass('belanja-modal-buku')}>
              <span className="flex items-center gap-3">
                <BookMarked className="w-4 h-4" />
                <span>BELANJA - MODAL BUKU</span>
              </span>
            </button>
            <button onClick={() => onTabChange('belanja-modal-alat')} className={btnClass('belanja-modal-alat')}>
              <span className="flex items-center gap-3">
                <Cpu className="w-4 h-4" />
                <span>BELANJA - MODAL ALAT</span>
              </span>
            </button>
            <button onClick={() => onTabChange('belanja-habis-pakai')} className={btnClass('belanja-habis-pakai')}>
              <span className="flex items-center gap-3">
                <PackageOpen className="w-4 h-4" />
                <span>BELANJA - HABIS PAKAI</span>
              </span>
            </button>
            <button onClick={() => onTabChange('transaksi-tarik-tunai')} className={btnClass('transaksi-tarik-tunai')}>
              <span className="flex items-center gap-3">
                <ArrowDownToLine className="w-4 h-4" />
                <span>TRANSAKSI TARIK TUNAI</span>
              </span>
            </button>
            {currentUser.role === 'Admin' && (
              <button onClick={() => onTabChange('validasi-tarik-tunai')} className={btnClass('validasi-tarik-tunai')}>
                <span className="flex items-center gap-3">
                  <CheckSquare className="w-4 h-4 text-amber-500" />
                  <span>VALIDASI TARIK TUNAI</span>
                </span>
                {pendingTarikCount > 0 && (
                  <span className="bg-amber-500/20 text-amber-500 font-bold text-[10px] px-2 py-0.5 rounded-full">
                    {pendingTarikCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <div>
          <span className="block px-4 text-[9px] font-black text-purple-300 uppercase tracking-widest mb-2">REKAP LAPORAN</span>
          <div className="space-y-1">
            <button onClick={() => onTabChange('rekap-modal')} className={btnClass('rekap-modal')}>
              <span className="flex items-center gap-3">
                <PieChart className="w-4 h-4" />
                <span>REKAP MODAL BUKU & ALAT</span>
              </span>
            </button>
            <button onClick={() => onTabChange('rekap-habis-pakai')} className={btnClass('rekap-habis-pakai')}>
              <span className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4" />
                <span>REKAP HABIS PAKAI SIPLAH</span>
              </span>
            </button>

            <button onClick={() => onTabChange('laporan-tahunan')} className={btnClass('laporan-tahunan')}>
              <span className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>LAPORAN TAHUNAN</span>
              </span>
            </button>
          </div>
        </div>

        {/* Role Simulator button */}
        <div className="pt-4 border-t border-white/5">
          <span className="block px-4 text-[9px] font-black text-purple-300 uppercase tracking-widest mb-2">ROLE SIMULATOR</span>
          <div className="bg-black/25 p-1.5 rounded-xl flex gap-1 border border-white/5">
            <button
              onClick={() => onRoleSwitch('Admin')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center transition ${
                currentUser.role === 'Admin'
                  ? 'text-white bg-purple-600 shadow-inner'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => onRoleSwitch('Anggota')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center transition ${
                currentUser.role === 'Anggota'
                  ? 'text-white bg-teal-600 shadow-inner'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              Anggota
            </button>
          </div>
        </div>

        {/* System & Config Settings */}
        {currentUser.role === 'Admin' && (
          <div className="pt-4 border-t border-white/5 space-y-1">
            <span className="block px-4 text-[9px] font-black text-purple-300 uppercase tracking-widest mb-2">SISTEM & CONFIG</span>
            <button onClick={() => onTabChange('pengaturan')} className={btnClass('pengaturan')}>
              <span className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>PENGATURAN PROFILE</span>
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Footer User Info */}
      <div className="p-4 border-t border-white/5 bg-slate-900/50 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600/30 text-purple-200 flex items-center justify-center font-bold text-sm border border-purple-500/30">
            {currentUser.nama.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <span className="block text-xs font-bold text-white truncate">{currentUser.nama}</span>
            <span className="inline-block px-1.5 py-0.5 bg-purple-600/30 text-[9px] text-purple-200 font-extrabold rounded">
              {currentUser.role === 'Admin' ? 'AKSES PENUH' : 'OPERATOR'}
            </span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full py-2 bg-rose-500/10 hover:bg-rose-600 hover:text-white border border-rose-500/20 text-rose-300 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>KELUAR / LOGOUT</span>
        </button>
      </div>
    </aside>
  );
}
