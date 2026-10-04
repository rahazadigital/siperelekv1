export type UserRole = 'ADMIN' | 'RW' | 'BENDAHARA' | 'RT' | 'WARGA';

export interface UnitRT {
  id: string;
  name: string;
  code: string;
}

export interface Transaction {
  id: string;
  tgl: string; // YYYY-MM-DD
  jt: 'PEMASUKAN' | 'PENGELUARAN';
  jk: string;
  nom: number;
  ket: string;
  st: 'AKTIF' | 'DIBATALKAN';
  no?: number;
  saldo?: number;
}

export interface LaporanRT {
  rt_id: string;
  saldoAwal: number;
  masuk: number;
  keluar: number;
  saldoAkhir: number;
  saldoKas: number;
  rows: Transaction[];
}

export interface RTSummary {
  rt_id: string;
  nama_rt: string;
  saldoKas: number;
  masukBulanIni: number;
  keluarBulanIni: number;
  totalTransaksi: number;
}

export interface LaporanRW {
  rw: string;
  bulan: number;
  tahun: number;
  totalKasRW: number;
  totalMasukRW: number;
  totalKeluarRW: number;
  jumlahRT: number;
  rtList: RTSummary[];
}

export interface UserAccount {
  username: string;
  nama: string;
  peran: UserRole;
  rt_id: string;
  aktif: boolean;
}

export interface ReferensiItem {
  jenis_kejadian: string;
  jenis_transaksi_diizinkan: string;
  aktif: boolean;
}

export interface ActivityLog {
  waktu: string;
  username: string;
  rt_id: string;
  aksi: string;
  id: string;
  detail: string;
}

export interface AuthSession {
  token: string;
  peran: UserRole;
  nama: string;
  username: string;
  rt_id: string;
}
