/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { School, Operator, MonthlyPagu, RAB, Transaction, TarikTunai, SystemConfig } from '../types';

export const initialSchools: School[] = [
  { npsn: "20310912", nama: "SDN 1 Sejahtera Utama", kecamatan: "Kec. Sejahtera Barat", jumlah_siswa: 100, pagu_per_siswa: 900000, pagu_t1: 45000000, pagu_t2: 45000000, status: "Aktif" },
  { npsn: "20310913", nama: "SDN 2 Sejahtera Utama", kecamatan: "Kec. Sejahtera Timur", jumlah_siswa: 100, pagu_per_siswa: 900000, pagu_t1: 45000000, pagu_t2: 45000000, status: "Aktif" },
  { npsn: "20310914", nama: "SDN 3 Berkarya", kecamatan: "Kec. Sejahtera Utara", jumlah_siswa: 100, pagu_per_siswa: 900000, pagu_t1: 45000000, pagu_t2: 45000000, status: "Aktif" },
  { npsn: "20326648", nama: "SD NEGERI SEKARDOJA", kecamatan: "LARANGAN", jumlah_siswa: 200, pagu_per_siswa: 1050000, pagu_t1: 105000000, pagu_t2: 105000000, status: "Aktif" }
];

export const initialOperators: Operator[] = [
  { nama: "Administrator Utama", username: "admin", password: "admin123", role: "Admin", instansi: "Dinas Pendidikan Kab. Sejahtera", status: "Offline" },
  { nama: "Anggota Sekolah 1", username: "sekolah", password: "school123", role: "Anggota", instansi: "SDN 1 Sejahtera Utama", status: "Offline" },
  { nama: "RUSNOTO", username: "rusnoto.prasasti@gmail.com", password: "Sekardoja123", role: "Anggota", instansi: "SD NEGERI SEKARDOJA", status: "Offline" }
];

export const initialMonthlyPagu: MonthlyPagu[] = [
  { sekolah: "SD NEGERI SEKARDOJA", bulan: "Januari", pagu: 10000000 },
  { sekolah: "SD NEGERI SEKARDOJA", bulan: "Februari", pagu: 15000000 },
  { sekolah: "SD NEGERI SEKARDOJA", bulan: "Maret", pagu: 15000000 },
  { sekolah: "SD NEGERI SEKARDOJA", bulan: "April", pagu: 20000000 },
  { sekolah: "SD NEGERI SEKARDOJA", bulan: "Mei", pagu: 15000000 },
  { sekolah: "SD NEGERI SEKARDOJA", bulan: "Juni", pagu: 15000000 },
  { sekolah: "SD NEGERI SEKARDOJA", bulan: "Juli", pagu: 15000000 },
  { sekolah: "SD NEGERI SEKARDOJA", bulan: "Agustus", pagu: 15000000 },
  { sekolah: "SD NEGERI SEKARDOJA", bulan: "September", pagu: 10000000 },
  { sekolah: "SD NEGERI SEKARDOJA", bulan: "Oktober", pagu: 15000000 },
  { sekolah: "SD NEGERI SEKARDOJA", bulan: "November", pagu: 8000000 },
  { sekolah: "SD NEGERI SEKARDOJA", bulan: "Desember", pagu: 12000000 },
  
  { sekolah: "SDN 1 Sejahtera Utama", bulan: "Januari", pagu: 5000000 },
  { sekolah: "SDN 1 Sejahtera Utama", bulan: "Februari", pagu: 8000000 },
  { sekolah: "SDN 1 Sejahtera Utama", bulan: "Maret", pagu: 8000000 },
  { sekolah: "SDN 1 Sejahtera Utama", bulan: "April", pagu: 10000000 },
  { sekolah: "SDN 1 Sejahtera Utama", bulan: "Mei", pagu: 7000000 },
  { sekolah: "SDN 1 Sejahtera Utama", bulan: "Juni", pagu: 7000000 },
  { sekolah: "SDN 1 Sejahtera Utama", bulan: "Juli", pagu: 7000000 },
  { sekolah: "SDN 1 Sejahtera Utama", bulan: "Agustus", pagu: 8000000 },
  { sekolah: "SDN 1 Sejahtera Utama", bulan: "September", pagu: 5000000 },
  { sekolah: "SDN 1 Sejahtera Utama", bulan: "Oktober", pagu: 8000000 },
  { sekolah: "SDN 1 Sejahtera Utama", bulan: "November", pagu: 5000000 },
  { sekolah: "SDN 1 Sejahtera Utama", bulan: "Desember", pagu: 12000000 }
];

export const initialRAB: RAB[] = [
  { id: "RAB-B01", nama: "Pengadaan Buku Paket Matematika Kls IV", sekolah: "SD NEGERI SEKARDOJA", kategori: "BUKU", alokasi: 20000000 },
  { id: "RAB-B02", nama: "Pengadaan Buku Cerita Novel Utama", sekolah: "SDN 1 Sejahtera Utama", kategori: "BUKU", alokasi: 5000000 },
  { id: "RAB-A01", nama: "Pengadaan Laptop Chromebook Guru", sekolah: "SD NEGERI SEKARDOJA", kategori: "ALAT", alokasi: 25000000 },
  { id: "RAB-A02", nama: "Pengadaan Proyektor Kelas", sekolah: "SDN 2 Sejahtera Utama", kategori: "ALAT", alokasi: 8000000 },
  { id: "RAB-S01", nama: "Pembelian Kertas HVS A4 & ATK Sekolah", sekolah: "SD NEGERI SEKARDOJA", kategori: "SIPLAH", alokasi: 5000000 }
];

export const initialTransactions: Transaction[] = [
  { id: "B01", rab_id: "RAB-B01", nama_barang: "Buku Paket Matematika Kls IV", sekolah: "SD NEGERI SEKARDOJA", npsn: "20326648", kategori: "BUKU", jumlah: "50 pcs", total_biaya: 15000000, tanggal: "2026-02-15", status: "Disetujui" },
  { id: "B02", rab_id: "RAB-B02", nama_barang: "Buku Cerita Novel Utama", sekolah: "SDN 1 Sejahtera Utama", npsn: "20310912", kategori: "BUKU", jumlah: "30 pcs", total_biaya: 4500000, tanggal: "2026-03-10", status: "Pending" },
  { id: "B03", rab_id: "RAB-A01", nama_barang: "Laptop Chromebook Asus", sekolah: "SD NEGERI SEKARDOJA", npsn: "20326648", kategori: "ALAT", jumlah: "2 pcs", total_biaya: 16000000, tanggal: "2026-04-05", status: "Disetujui" },
  { id: "B04", rab_id: "RAB-S01", nama_barang: "Pembelian Kertas HVS A4 & ATK Sekolah", sekolah: "SD NEGERI SEKARDOJA", npsn: "20326648", kategori: "SIPLAH", jumlah: "10 Rim", total_biaya: 3500000, tanggal: "2026-02-28", status: "Disetujui" }
];

export const initialTarikTunai: TarikTunai[] = [
  { id: "TRK-01", sekolah: "SD NEGERI SEKARDOJA", bulan: "Januari", pagu_bulanan: 10000000, nilai: 10000000, status: "Selesai", verifikator: "Administrator Utama" }
];

export const defaultSystemConfig: SystemConfig = {
  org_name: "Dinas Pendidikan & Kebudayaan Kabupaten Sejahtera",
  logo_preset: "preset-wallet",
  logo_url: "",
  deadline_t1: "2026-07-31",
  deadline_t2: "2027-01-31"
};
