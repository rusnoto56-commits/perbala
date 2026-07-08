/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface School {
  npsn: string;
  nama: string;
  kecamatan: string;
  jumlah_siswa: number;
  pagu_per_siswa: number;
  pagu_t1: number;
  pagu_t2: number;
  status: string;
}

export interface Operator {
  nama: string;
  username: string;
  password?: string;
  role: 'Admin' | 'Anggota';
  instansi: string;
  status: string;
}

export interface MonthlyPagu {
  sekolah: string;
  bulan: string;
  pagu: number;
}

export interface RAB {
  id: string;
  nama: string;
  sekolah: string;
  kategori: 'BUKU' | 'ALAT' | 'SIPLAH';
  alokasi: number;
}

export interface Transaction {
  id: string;
  rab_id: string;
  nama_barang: string;
  sekolah: string;
  npsn: string;
  kategori: 'BUKU' | 'ALAT' | 'SIPLAH';
  jumlah: string;
  total_biaya: number;
  tanggal: string;
  status: 'Disetujui' | 'Pending' | 'Ditolak';
}

export interface TarikTunai {
  id: string;
  sekolah: string;
  bulan: string;
  pagu_bulanan: number;
  nilai: number;
  status: 'Pending' | 'Selesai' | 'Ditolak';
  verifikator: string;
}

export interface SystemConfig {
  org_name: string;
  logo_preset: string;
  logo_url: string;
  deadline_t1: string;
  deadline_t2: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

