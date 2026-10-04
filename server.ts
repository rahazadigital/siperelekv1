import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;
const GAS_URL = process.env.GAS_WEB_APP_URL || 'https://script.google.com/macros/s/AKfycbyuqCOkwnYHAtcTvLkCG90MojoP9_-YqH7WWobnDEtYkFoaXoi46xQSEs8JNu5Ef9qv/exec';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ========================================================================= */
/* SIMULATED IN-MEMORY DATABASE FALLBACK FOR MULTI-RT & RW                   */
/* (Digunakan otomatis bila Google Apps Script belum dideploy / offline)     */
/* ========================================================================= */
interface Transaction {
  id: string;
  tgl: string;
  jt: 'PEMASUKAN' | 'PENGELUARAN';
  jk: string;
  nom: number;
  ket: string;
  st: 'AKTIF' | 'DIBATALKAN';
}

const mockDb = {
  rw: 'RW 009',
  rtList: ['001', '002', '003', '004', '005'],
  pins: {
    '001': '123456',
    '002': '123456',
    '003': '123456',
    '004': '123456',
    '005': '123456'
  } as Record<string, string>,
  saldoAwal: {
    '001': 5000000,
    '002': 3500000,
    '003': 4200000,
    '004': 2800000,
    '005': 6100000
  } as Record<string, number>,
  users: [
    { username: 'admin', nama: 'Super Administrator', peran: 'ADMIN', rt_id: 'ALL', password: 'admin123', aktif: true },
    { username: 'ketua_rw', nama: 'Bpk. H. Supriadi (Ketua RW 009)', peran: 'RW', rt_id: 'ALL', password: 'rw123456', aktif: true },
    { username: 'rt001', nama: 'Bpk. Bambang (Ketua RT 001)', peran: 'RT', rt_id: '001', password: 'rt001pass', aktif: true },
    { username: 'rt002', nama: 'Bpk. Mulyadi (Ketua RT 002)', peran: 'RT', rt_id: '002', password: 'rt002pass', aktif: true },
    { username: 'bendahara01', nama: 'Ibu Ratna (Bendahara RT 001)', peran: 'BENDAHARA', rt_id: '001', password: 'ganti123', aktif: true },
    { username: 'bendahara02', nama: 'Ibu Siti (Bendahara RT 002)', peran: 'BENDAHARA', rt_id: '002', password: 'ganti123', aktif: true }
  ],
  referensi: [
    { jenis_kejadian: 'IURAN PERELEK', jenis_transaksi_diizinkan: 'PEMASUKAN', aktif: true },
    { jenis_kejadian: 'IURAN SAMPAH & KEBERSIHAN', jenis_transaksi_diizinkan: 'PEMASUKAN', aktif: true },
    { jenis_kejadian: 'SANTUNAN SAKIT', jenis_transaksi_diizinkan: 'PENGELUARAN', aktif: true },
    { jenis_kejadian: 'SANTUNAN KEMATIAN', jenis_transaksi_diizinkan: 'PENGELUARAN', aktif: true },
    { jenis_kejadian: 'PERBAIKAN FASUM & POS RONDA', jenis_transaksi_diizinkan: 'PENGELUARAN', aktif: true },
    { jenis_kejadian: 'DANA SOSIAL / LAINNYA', jenis_transaksi_diizinkan: 'KEDUANYA', aktif: true }
  ],
  transactions: {
    '001': [
      { id: 'TX001-001', tgl: '2026-10-01', jt: 'PEMASUKAN', jk: 'IURAN PERELEK', nom: 1750000, ket: 'Iuran Warga Gang Mawar RT 001', st: 'AKTIF' },
      { id: 'TX001-002', tgl: '2026-10-02', jt: 'PEMASUKAN', jk: 'IURAN SAMPAH & KEBERSIHAN', nom: 850000, ket: 'Retribusi Kebersihan Lingkungan RT 001', st: 'AKTIF' },
      { id: 'TX001-003', tgl: '2026-10-03', jt: 'PENGELUARAN', jk: 'SANTUNAN SAKIT', nom: 500000, ket: 'Santunan Kas untuk Bpk. Ahmad (Rawat Inap RS)', st: 'AKTIF' },
      { id: 'TX001-004', tgl: '2026-10-04', jt: 'PENGELUARAN', jk: 'PERBAIKAN FASUM & POS RONDA', nom: 350000, ket: 'Beli Lampu Sorot LED & Kabel Pos Ronda', st: 'AKTIF' }
    ] as Transaction[],
    '002': [
      { id: 'TX002-001', tgl: '2026-10-01', jt: 'PEMASUKAN', jk: 'IURAN PERELEK', nom: 2100000, ket: 'Iuran Perelek Warga RT 002', st: 'AKTIF' },
      { id: 'TX002-002', tgl: '2026-10-03', jt: 'PENGELUARAN', jk: 'SANTUNAN KEMATIAN', nom: 750000, ket: 'Santunan Duka Cita Warga Blok B', st: 'AKTIF' }
    ] as Transaction[],
    '003': [
      { id: 'TX003-001', tgl: '2026-10-02', jt: 'PEMASUKAN', jk: 'IURAN PERELEK', nom: 1450000, ket: 'Iuran Kas RT 003', st: 'AKTIF' }
    ] as Transaction[],
    '004': [
      { id: 'TX004-001', tgl: '2026-10-01', jt: 'PEMASUKAN', jk: 'IURAN PERELEK', nom: 900000, ket: 'Iuran RT 004', st: 'AKTIF' }
    ] as Transaction[],
    '005': [
      { id: 'TX005-001', tgl: '2026-10-02', jt: 'PEMASUKAN', jk: 'IURAN PERELEK', nom: 2300000, ket: 'Iuran Perelek Kas RT 005', st: 'AKTIF' }
    ] as Transaction[]
  } as Record<string, Transaction[]>,
  sessions: {} as Record<string, { u: string; p: string; rt: string; n: string }>,
  logs: [
    { waktu: '2026-10-03 20:15:00', username: 'admin', rt_id: 'ALL', aksi: 'SETUP', id: '', detail: 'Inisialisasi sistem database Multi-RT' },
    { waktu: '2026-10-04 07:30:12', username: 'bendahara01', rt_id: '001', aksi: 'TAMBAH', id: 'TX001-004', detail: 'Pengeluaran Rp 350.000 untuk Perbaikan Pos Ronda' }
  ]
};

function handleSimulatedApi(action: string, token: string, data: any) {
  let u = token && mockDb.sessions[token] ? mockDb.sessions[token] : null;

  switch (action) {
    case 'getUnitList': {
      const list = mockDb.rtList.map((rt) => ({
        id: rt,
        name: `RT ${rt}`,
        code: rt
      }));
      return { ok: true, data: { rw: mockDb.rw, list } };
    }

    case 'login': {
      const user = mockDb.users.find(
        (x) => x.username === data.username && x.password === String(data.password) && x.aktif
      );
      if (!user) throw new Error('Username atau password salah');
      const tok = 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      mockDb.sessions[tok] = { u: user.username, p: user.peran, rt: user.rt_id, n: user.nama };
      mockDb.logs.unshift({
        waktu: new Date().toISOString().replace('T', ' ').substring(0, 19),
        username: user.username,
        rt_id: user.rt_id,
        aksi: 'LOGIN',
        id: '',
        detail: 'Berhasil login ke sistem'
      });
      return {
        ok: true,
        data: { token: tok, peran: user.peran, nama: user.nama, username: user.username, rt_id: user.rt_id }
      };
    }

    case 'logout': {
      if (token) delete mockDb.sessions[token];
      return { ok: true, data: true };
    }

    case 'verifyPinWarga': {
      const rt = data.rt_id || '001';
      const expected = mockDb.pins[rt] || '123456';
      if (String(data.pin || '').trim() !== expected) {
        throw new Error(`PIN Akses Warga RT ${rt} tidak sesuai`);
      }
      return { ok: true, data: { valid: true, rt_id: rt } };
    }

    case 'getLaporan': {
      const rt = data.rt_id || (u && u.rt !== 'ALL' ? u.rt : '001');
      if (!u) {
        const expected = mockDb.pins[rt] || '123456';
        if (String(data.pin_warga || '').trim() !== expected) {
          const err: any = new Error(`PIN Akses Warga RT ${rt} diperlukan atau salah`);
          err.pinRequired = true;
          throw err;
        }
      } else {
        if (u.p !== 'ADMIN' && u.p !== 'RW' && u.rt !== 'ALL' && u.rt !== rt) {
          throw new Error(`Anda tidak memiliki izin membuka data RT ${rt}`);
        }
      }

      const b = Number(data.bulan) || (new Date().getMonth() + 1);
      const y = Number(data.tahun) || new Date().getFullYear();
      const padB = ('0' + b).slice(-2);
      const awal = `${y}-${padB}-01`;
      const akhir = `${y}-${padB}-31`;

      let saldoAwal = mockDb.saldoAwal[rt] || 0;
      let masuk = 0;
      let keluar = 0;
      let kas = saldoAwal;
      const list: any[] = [];
      const txs = mockDb.transactions[rt] || [];

      txs.filter((t) => t.st === 'AKTIF').sort((a, c) => (a.tgl + a.id).localeCompare(c.tgl + c.id)).forEach((t) => {
        const s = t.jt === 'PEMASUKAN' ? t.nom : -t.nom;
        kas += s;
        if (t.tgl < awal) {
          saldoAwal += s;
        } else if (t.tgl <= akhir) {
          list.push({ ...t });
          if (s > 0) masuk += t.nom;
          else keluar += t.nom;
        }
      });

      let running = saldoAwal;
      list.forEach((t, i) => {
        running += t.jt === 'PEMASUKAN' ? t.nom : -t.nom;
        t.no = i + 1;
        t.saldo = running;
      });

      return {
        ok: true,
        data: {
          rt_id: rt,
          saldoAwal,
          masuk,
          keluar,
          saldoAkhir: saldoAwal + masuk - keluar,
          saldoKas: kas,
          rows: list
        }
      };
    }

    case 'getLaporanRW': {
      if (!u || !['ADMIN', 'RW'].includes(u.p)) {
        throw new Error('Akses khusus Pengurus RW atau Administrator');
      }
      const b = Number(data.bulan) || (new Date().getMonth() + 1);
      const y = Number(data.tahun) || new Date().getFullYear();
      const padB = ('0' + b).slice(-2);
      const awal = `${y}-${padB}-01`;
      const akhir = `${y}-${padB}-31`;

      let totalKasRW = 0;
      let totalMasukRW = 0;
      let totalKeluarRW = 0;
      const rtSummaries: any[] = [];

      mockDb.rtList.forEach((rt) => {
        let saldoAwal = mockDb.saldoAwal[rt] || 0;
        let masuk = 0;
        let keluar = 0;
        let kas = saldoAwal;
        const txs = mockDb.transactions[rt] || [];

        txs.filter((t) => t.st === 'AKTIF').forEach((t) => {
          const s = t.jt === 'PEMASUKAN' ? t.nom : -t.nom;
          kas += s;
          if (t.tgl >= awal && t.tgl <= akhir) {
            if (s > 0) masuk += t.nom;
            else keluar += t.nom;
          }
        });

        totalKasRW += kas;
        totalMasukRW += masuk;
        totalKeluarRW += keluar;
        rtSummaries.push({
          rt_id: rt,
          nama_rt: `RT ${rt}`,
          saldoKas: kas,
          masukBulanIni: masuk,
          keluarBulanIni: keluar,
          totalTransaksi: txs.length
        });
      });

      return {
        ok: true,
        data: {
          rw: mockDb.rw,
          bulan: b,
          tahun: y,
          totalKasRW,
          totalMasukRW,
          totalKeluarRW,
          jumlahRT: mockDb.rtList.length,
          rtList: rtSummaries
        }
      };
    }

    case 'getReferensi': {
      return { ok: true, data: mockDb.referensi.filter((r) => r.aktif) };
    }

    case 'addTransaksi': {
      if (!u || !['ADMIN', 'BENDAHARA', 'RT'].includes(u.p)) {
        throw new Error('Anda tidak memiliki izin mencatat transaksi');
      }
      const rt = data.rt_id || (u.rt !== 'ALL' ? u.rt : '001');
      if (u.p !== 'ADMIN' && u.rt !== 'ALL' && u.rt !== rt) {
        throw new Error(`Anda tidak memiliki izin mengubah data RT ${rt}`);
      }

      if (!mockDb.transactions[rt]) mockDb.transactions[rt] = [];
      const list = mockDb.transactions[rt];
      const maxNum = list.reduce((max, t) => {
        const n = parseInt(t.id.replace(/\D/g, ''), 10) || 0;
        return Math.max(max, n);
      }, 0);
      const newId = `TX${rt}-${('00' + (maxNum + 1)).slice(-3)}`;

      const newTx: Transaction = {
        id: newId,
        tgl: data.tanggal,
        jt: data.jenis_transaksi,
        jk: data.jenis_kejadian,
        nom: Number(data.nominal),
        ket: data.keterangan || '',
        st: 'AKTIF'
      };

      list.push(newTx);
      mockDb.logs.unshift({
        waktu: new Date().toISOString().replace('T', ' ').substring(0, 19),
        username: u.u,
        rt_id: rt,
        aksi: 'TAMBAH',
        id: newId,
        detail: `${data.jenis_transaksi} Rp ${data.nominal}`
      });

      return { ok: true, data: { id: newId, rt_id: rt } };
    }

    case 'updateTransaksi': {
      if (!u || !['ADMIN', 'BENDAHARA', 'RT'].includes(u.p)) {
        throw new Error('Anda tidak memiliki izin mengubah transaksi');
      }
      const rt = data.rt_id || (u.rt !== 'ALL' ? u.rt : '001');
      if (u.p !== 'ADMIN' && u.rt !== 'ALL' && u.rt !== rt) {
        throw new Error(`Anda tidak memiliki izin mengubah data RT ${rt}`);
      }
      const list = mockDb.transactions[rt] || [];
      const item = list.find((t) => t.id === data.id);
      if (!item) throw new Error(`Transaksi ${data.id} tidak ditemukan`);

      item.tgl = data.tanggal;
      item.jt = data.jenis_transaksi;
      item.jk = data.jenis_kejadian;
      item.nom = Number(data.nominal);
      item.ket = data.keterangan || '';

      mockDb.logs.unshift({
        waktu: new Date().toISOString().replace('T', ' ').substring(0, 19),
        username: u.u,
        rt_id: rt,
        aksi: 'UBAH',
        id: data.id,
        detail: `${data.jenis_transaksi} Rp ${data.nominal}`
      });

      return { ok: true, data: { id: data.id, rt_id: rt } };
    }

    case 'batalkanTransaksi': {
      if (!u || !['ADMIN', 'BENDAHARA', 'RT'].includes(u.p)) {
        throw new Error('Anda tidak memiliki izin membatalkan transaksi');
      }
      const rt = data.rt_id || (u.rt !== 'ALL' ? u.rt : '001');
      if (u.p !== 'ADMIN' && u.rt !== 'ALL' && u.rt !== rt) {
        throw new Error(`Anda tidak memiliki izin mengubah data RT ${rt}`);
      }
      if (!data.alasan) throw new Error('Alasan pembatalan wajib diisi');
      const list = mockDb.transactions[rt] || [];
      const item = list.find((t) => t.id === data.id);
      if (!item) throw new Error(`Transaksi tidak ditemukan`);

      item.st = 'DIBATALKAN';
      mockDb.logs.unshift({
        waktu: new Date().toISOString().replace('T', ' ').substring(0, 19),
        username: u.u,
        rt_id: rt,
        aksi: 'BATAL',
        id: data.id,
        detail: `Alasan: ${data.alasan}`
      });

      return { ok: true, data: { id: data.id, rt_id: rt } };
    }

    case 'getPinWarga': {
      if (!u || !['ADMIN', 'RT', 'BENDAHARA'].includes(u.p)) throw new Error('Akses ditolak');
      const rt = data.rt_id || (u.rt !== 'ALL' ? u.rt : '001');
      return { ok: true, data: { rt_id: rt, pin: mockDb.pins[rt] || '123456' } };
    }

    case 'setPinWarga': {
      if (!u || !['ADMIN', 'RT'].includes(u.p)) throw new Error('Hanya Admin atau Ketua RT yang dapat mengubah PIN');
      const rt = data.rt_id || (u.rt !== 'ALL' ? u.rt : '001');
      if (u.p !== 'ADMIN' && u.rt !== 'ALL' && u.rt !== rt) {
        throw new Error(`Anda tidak memiliki hak mengubah PIN RT ${rt}`);
      }
      const newPin = String(data.pin || '').trim();
      if (!/^\d{6}$/.test(newPin)) throw new Error('PIN Warga harus terdiri dari 6 angka');
      mockDb.pins[rt] = newPin;
      mockDb.logs.unshift({
        waktu: new Date().toISOString().replace('T', ' ').substring(0, 19),
        username: u.u,
        rt_id: rt,
        aksi: 'UBAH_PIN',
        id: '',
        detail: `PIN Warga RT ${rt} diperbarui`
      });
      return { ok: true, data: { ok: true, rt_id: rt, pin: newPin } };
    }

    case 'getSaldoAwal': {
      if (!u || !['ADMIN', 'BENDAHARA', 'RT'].includes(u.p)) throw new Error('Akses ditolak');
      const rt = data.rt_id || (u.rt !== 'ALL' ? u.rt : '001');
      return { ok: true, data: { rt_id: rt, saldo_awal: mockDb.saldoAwal[rt] || 0 } };
    }

    case 'setSaldoAwal': {
      if (!u || !['ADMIN', 'BENDAHARA'].includes(u.p)) throw new Error('Hanya Admin atau Bendahara yang dapat mengubah saldo awal');
      const rt = data.rt_id || (u.rt !== 'ALL' ? u.rt : '001');
      if (u.p !== 'ADMIN' && u.rt !== 'ALL' && u.rt !== rt) {
        throw new Error(`Anda tidak memiliki hak mengatur saldo awal RT ${rt}`);
      }
      const nominal = parseInt(String(data.nominal).replace(/\D/g, ''), 10);
      if (isNaN(nominal) || nominal < 0) throw new Error('Nominal saldo awal tidak valid');
      mockDb.saldoAwal[rt] = nominal;
      mockDb.logs.unshift({
        waktu: new Date().toISOString().replace('T', ' ').substring(0, 19),
        username: u.u,
        rt_id: rt,
        aksi: 'UBAH_SALDO_AWAL',
        id: '',
        detail: `Rp ${nominal}`
      });
      return { ok: true, data: { rt_id: rt, nominal } };
    }

    case 'getUsers': {
      if (!u || u.p !== 'ADMIN') throw new Error('Akses khusus Administrator');
      return {
        ok: true,
        data: mockDb.users.map((x) => ({
          username: x.username,
          nama: x.nama,
          peran: x.peran,
          rt_id: x.rt_id,
          aktif: x.aktif
        }))
      };
    }

    case 'addUser': {
      if (!u || u.p !== 'ADMIN') throw new Error('Akses khusus Administrator');
      if (!data.username || !data.nama || !data.peran || !data.password) throw new Error('Semua field wajib diisi');
      const existing = mockDb.users.find((x) => x.username === data.username);
      if (existing) throw new Error(`Username "${data.username}" sudah digunakan`);
      mockDb.users.push({
        username: data.username,
        nama: data.nama,
        peran: data.peran,
        rt_id: data.rt_id || 'ALL',
        password: data.password,
        aktif: true
      });
      mockDb.logs.unshift({
        waktu: new Date().toISOString().replace('T', ' ').substring(0, 19),
        username: u.u,
        rt_id: data.rt_id || 'ALL',
        aksi: 'TAMBAH_USER',
        id: '',
        detail: `${data.username} (${data.peran})`
      });
      return { ok: true, data: { username: data.username } };
    }

    case 'updateUser': {
      if (!u || u.p !== 'ADMIN') throw new Error('Akses khusus Administrator');
      const target = mockDb.users.find((x) => x.username === data.username);
      if (!target) throw new Error('User tidak ditemukan');
      if (data.nama) target.nama = data.nama;
      if (data.peran) target.peran = data.peran;
      if (data.rt_id !== undefined) target.rt_id = data.rt_id;
      if (data.password && data.password.length >= 6) target.password = data.password;
      if (data.aktif !== undefined) target.aktif = Boolean(data.aktif);

      mockDb.logs.unshift({
        waktu: new Date().toISOString().replace('T', ' ').substring(0, 19),
        username: u.u,
        rt_id: target.rt_id,
        aksi: 'UBAH_USER',
        id: '',
        detail: target.username
      });
      return { ok: true, data: { username: data.username, nama: target.nama } };
    }

    case 'deleteUser': {
      if (!u || u.p !== 'ADMIN') throw new Error('Akses khusus Administrator');
      if (data.username === u.u) throw new Error('Tidak bisa menonaktifkan akun sendiri');
      const target = mockDb.users.find((x) => x.username === data.username);
      if (!target) throw new Error('User tidak ditemukan');
      target.aktif = false;
      mockDb.logs.unshift({
        waktu: new Date().toISOString().replace('T', ' ').substring(0, 19),
        username: u.u,
        rt_id: target.rt_id,
        aksi: 'NONAKTIF_USER',
        id: '',
        detail: target.username
      });
      return { ok: true, data: { username: data.username } };
    }

    case 'getAllReferensi': {
      if (!u || u.p !== 'ADMIN') throw new Error('Akses khusus Administrator');
      return { ok: true, data: mockDb.referensi };
    }

    case 'addReferensi': {
      if (!u || u.p !== 'ADMIN') throw new Error('Akses khusus Administrator');
      const jk = String(data.jenis_kejadian || '').trim().toUpperCase();
      const jt = String(data.jenis_transaksi_diizinkan || '').trim().toUpperCase();
      if (!jk) throw new Error('Nama kategori wajib diisi');
      mockDb.referensi.push({ jenis_kejadian: jk, jenis_transaksi_diizinkan: jt, aktif: true });
      return { ok: true, data: { jenis_kejadian: jk } };
    }

    case 'updateReferensi': {
      if (!u || u.p !== 'ADMIN') throw new Error('Akses khusus Administrator');
      const oldJk = String(data.original_jk || data.jenis_kejadian || '').trim().toUpperCase();
      const target = mockDb.referensi.find((x) => x.jenis_kejadian === oldJk);
      if (!target) throw new Error('Kategori tidak ditemukan');
      target.jenis_kejadian = String(data.jenis_kejadian || target.jenis_kejadian).trim().toUpperCase();
      target.jenis_transaksi_diizinkan = String(data.jenis_transaksi_diizinkan || target.jenis_transaksi_diizinkan).trim().toUpperCase();
      if (data.aktif !== undefined) target.aktif = Boolean(data.aktif);
      return { ok: true, data: { jenis_kejadian: target.jenis_kejadian } };
    }

    case 'deleteReferensi': {
      if (!u || u.p !== 'ADMIN') throw new Error('Akses khusus Administrator');
      const jk = String(data.jenis_kejadian || '').trim().toUpperCase();
      const target = mockDb.referensi.find((x) => x.jenis_kejadian === jk);
      if (!target) throw new Error('Kategori tidak ditemukan');
      target.aktif = false;
      return { ok: true, data: { jenis_kejadian: jk } };
    }

    case 'getLogs': {
      if (!u || u.p !== 'ADMIN') throw new Error('Akses khusus Administrator');
      return { ok: true, data: mockDb.logs };
    }

    case 'clearLogs': {
      if (!u || u.p !== 'ADMIN') throw new Error('Akses khusus Administrator');
      if (String(data.pin || '').trim() !== '228822') throw new Error('PIN Keamanan salah');
      mockDb.logs = [];
      return { ok: true, data: { message: 'Log berhasil dibersihkan' } };
    }

    default:
      throw new Error(`Aksi "${action}" tidak dikenali`);
  }
}

/* ========================================================================= */
/* EXPRESS API ENDPOINTS                                                     */
/* ========================================================================= */

// 1. Endpoint Proxy ke Google Apps Script Web App (dengan Simulated Fallback)
app.post('/api/gas', async (req: Request, res: Response) => {
  const { action, token, data } = req.body;

  // Coba teruskan ke Google Apps Script live jika terkonfigurasi
  if (GAS_URL && !GAS_URL.includes('PLACEHOLDER')) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, token, data }),
        redirect: 'follow',
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          if (json && typeof json === 'object' && json.ok !== undefined) {
            // Berhasil mendapatkan respon valid dari GAS live
            return res.json(json);
          }
        } catch (jsonErr) {
          console.warn('GAS did not return JSON, using simulated database.');
        }
      }
    } catch (err: any) {
      // Jika GAS timeout / error, jangan buat klien crash; gunakan simulated db
      // console.log('GAS live unreachable, falling back to simulated db:', err.message);
    }
  }

  // Fallback ke Simulated Multi-RT Engine
  try {
    const result = handleSimulatedApi(action, token, data || {});
    return res.json(result);
  } catch (err: any) {
    return res.json({
      ok: false,
      error: err.message || String(err),
      pinRequired: !!err.pinRequired
    });
  }
});

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mode: 'multi-rt-rw',
    timestamp: new Date().toISOString()
  });
});

/* ========================================================================= */
/* DEV / PROD SERVER BOOTSTRAP                                               */
/* ========================================================================= */
async function start() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve('dist'))) {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    // Mount Vite middleware in development mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[SiPerelek Multi-RT/RW] Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(console.error);
