import { LaporanRT, LaporanRW, UnitRT, ReferensiItem, UserAccount, ActivityLog, AuthSession } from '../types';

const API_BASE = '/api/gas';

// Helper Format Rupiah
export const formatRupiah = (num: number, withPrefix = true): string => {
  if (isNaN(num)) return withPrefix ? 'Rp 0' : '0';
  const isNeg = num < 0;
  const abs = Math.abs(num);
  const formatted = new Intl.NumberFormat('id-ID').format(abs);
  const sign = isNeg ? '-' : '';
  return withPrefix ? `${sign}Rp ${formatted}` : `${sign}${formatted}`;
};

// Helper Format Tanggal
export const formatTanggal = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

class ApiService {
  private token: string = '';

  constructor() {
    this.token = sessionStorage.getItem('siperelek_token') || '';
  }

  setToken(tok: string) {
    this.token = tok;
    if (tok) sessionStorage.setItem('siperelek_token', tok);
    else sessionStorage.removeItem('siperelek_token');
  }

  getToken(): string {
    return this.token || sessionStorage.getItem('siperelek_token') || '';
  }

  async call<T>(action: string, data: any = {}): Promise<{ ok: boolean; data?: T; error?: string; pinRequired?: boolean }> {
    const payload = {
      action,
      token: this.getToken(),
      data
    };

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();

      // Jika berhasil, simpan cache untuk aksi penting
      if (json && json.ok && json.data) {
        if (action === 'getUnitList') {
          localStorage.setItem('cache_unit_list', JSON.stringify(json.data));
        } else if (action === 'getLaporan') {
          const key = `cache_lap_${data.rt_id}_${data.bulan}_${data.tahun}`;
          localStorage.setItem(key, JSON.stringify(json.data));
        } else if (action === 'getLaporanRW') {
          const key = `cache_lap_rw_${data.bulan}_${data.tahun}`;
          localStorage.setItem(key, JSON.stringify(json.data));
        } else if (action === 'getReferensi') {
          localStorage.setItem('cache_referensi', JSON.stringify(json.data));
        }
      }

      return json;
    } catch (err: any) {
      console.warn(`[API] ${action} request failed, attempting local cache fallback:`, err.message);

      // Coba pulihkan dari cache lokal
      if (action === 'getUnitList') {
        const cached = localStorage.getItem('cache_unit_list');
        if (cached) {
          try { return { ok: true, data: JSON.parse(cached) }; } catch (e) {}
        }
      } else if (action === 'getLaporan') {
        const key = `cache_lap_${data.rt_id}_${data.bulan}_${data.tahun}`;
        const cached = localStorage.getItem(key);
        if (cached) {
          try { return { ok: true, data: JSON.parse(cached) }; } catch (e) {}
        }
      } else if (action === 'getLaporanRW') {
        const key = `cache_lap_rw_${data.bulan}_${data.tahun}`;
        const cached = localStorage.getItem(key);
        if (cached) {
          try { return { ok: true, data: JSON.parse(cached) }; } catch (e) {}
        }
      } else if (action === 'getReferensi') {
        const cached = localStorage.getItem('cache_referensi');
        if (cached) {
          try { return { ok: true, data: JSON.parse(cached) }; } catch (e) {}
        }
      }

      return {
        ok: false,
        error: err.message || 'Koneksi ke server terputus. Menggunakan data tersimpan jika tersedia.'
      };
    }
  }

  // Auth & Units
  async getUnitList() {
    return this.call<{ rw: string; list: UnitRT[] }>('getUnitList');
  }

  async login(username: string, password: string) {
    const res = await this.call<AuthSession>('login', { username, password });
    if (res.ok && res.data) {
      this.setToken(res.data.token);
    }
    return res;
  }

  async logout() {
    const res = await this.call('logout');
    this.setToken('');
    return res;
  }

  // Warga PIN
  async verifyPinWarga(rt_id: string, pin: string) {
    return this.call<{ valid: boolean; rt_id: string }>('verifyPinWarga', { rt_id, pin });
  }

  // Laporan RT & RW
  async getLaporan(rt_id: string, bulan: number, tahun: number, pin_warga?: string) {
    return this.call<LaporanRT>('getLaporan', { rt_id, bulan, tahun, pin_warga });
  }

  async getLaporanRW(bulan: number, tahun: number) {
    return this.call<LaporanRW>('getLaporanRW', { bulan, tahun });
  }

  // Transaksi
  async addTransaksi(data: {
    rt_id: string;
    tanggal: string;
    jenis_transaksi: 'PEMASUKAN' | 'PENGELUARAN';
    jenis_kejadian: string;
    nominal: number;
    keterangan?: string;
  }) {
    return this.call<{ id: string; rt_id: string }>('addTransaksi', data);
  }

  async updateTransaksi(data: {
    id: string;
    rt_id: string;
    tanggal: string;
    jenis_transaksi: 'PEMASUKAN' | 'PENGELUARAN';
    jenis_kejadian: string;
    nominal: number;
    keterangan?: string;
  }) {
    return this.call<{ id: string; rt_id: string }>('updateTransaksi', data);
  }

  async batalkanTransaksi(id: string, rt_id: string, alasan: string) {
    return this.call<{ id: string; rt_id: string }>('batalkanTransaksi', { id, rt_id, alasan });
  }

  // Referensi
  async getReferensi() {
    return this.call<ReferensiItem[]>('getReferensi');
  }

  async getAllReferensi() {
    return this.call<ReferensiItem[]>('getAllReferensi');
  }

  async addReferensi(jenis_kejadian: string, jenis_transaksi_diizinkan: string) {
    return this.call('addReferensi', { jenis_kejadian, jenis_transaksi_diizinkan });
  }

  async updateReferensi(original_jk: string, jenis_kejadian: string, jenis_transaksi_diizinkan: string, aktif?: boolean) {
    return this.call('updateReferensi', { original_jk, jenis_kejadian, jenis_transaksi_diizinkan, aktif });
  }

  async deleteReferensi(jenis_kejadian: string) {
    return this.call('deleteReferensi', { jenis_kejadian });
  }

  // Saldo Awal & PIN Warga per RT
  async getSaldoAwal(rt_id: string) {
    return this.call<{ rt_id: string; saldo_awal: number }>('getSaldoAwal', { rt_id });
  }

  async setSaldoAwal(rt_id: string, nominal: number) {
    return this.call<{ rt_id: string; nominal: number }>('setSaldoAwal', { rt_id, nominal });
  }

  async getPinWarga(rt_id: string) {
    return this.call<{ rt_id: string; pin: string }>('getPinWarga', { rt_id });
  }

  async setPinWarga(rt_id: string, pin: string) {
    return this.call<{ rt_id: string; pin: string }>('setPinWarga', { rt_id, pin });
  }

  // Users (Admin)
  async getUsers() {
    return this.call<UserAccount[]>('getUsers');
  }

  async addUser(data: { username: string; nama: string; peran: string; rt_id: string; password: string }) {
    return this.call('addUser', data);
  }

  async updateUser(data: { username: string; nama?: string; peran?: string; rt_id?: string; password?: string; aktif?: boolean }) {
    return this.call('updateUser', data);
  }

  async deleteUser(username: string) {
    return this.call('deleteUser', { username });
  }

  // Logs (Admin)
  async getLogs() {
    return this.call<ActivityLog[]>('getLogs');
  }

  async clearLogs(pin: string) {
    return this.call('clearLogs', { pin });
  }
}

export const api = new ApiService();
