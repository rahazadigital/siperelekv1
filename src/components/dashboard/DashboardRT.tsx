import React, { useState, useMemo } from 'react';
import { 
  Wallet, Eye, EyeOff, RefreshCw, Edit3, ArrowUpRight, ArrowDownLeft,
  Search, Printer, PlusCircle, Edit2, Trash2, ArrowLeft, ChevronDown
} from 'lucide-react';
import { LaporanRT, Transaction, AuthSession, UnitRT, ReferensiItem } from '../../types';
import { formatRupiah, formatTanggal, NAMA_BULAN } from '../../services/api';
import { MainMenuGrid } from './MainMenuGrid';

interface DashboardRTProps {
  laporan: LaporanRT | null;
  activeRT: string;
  selectedMonth: number;
  selectedYear: number;
  onChangeMonth: (m: number) => void;
  onChangeYear: (y: number) => void;
  isPrivacy: boolean;
  onTogglePrivacy: () => void;
  session: AuthSession | null;
  onOpenCreateTx: () => void;
  onOpenEditTx: (tx: Transaction) => void;
  onOpenCancelTx: (tx: Transaction) => void;
  onOpenSaldoAwal: () => void;
  onOpenPinWarga: () => void;
  onLockRT: () => void;
  onPrint: () => void;
  referensi: ReferensiItem[];
  onOpenUsers?: () => void;
  onOpenReferensi?: () => void;
  onOpenLogs?: () => void;
  onOpenAccount?: () => void;
  onOpenMonitoringRW?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const DashboardRT: React.FC<DashboardRTProps> = ({
  laporan,
  activeRT,
  selectedMonth,
  selectedYear,
  onChangeMonth,
  onChangeYear,
  isPrivacy,
  onTogglePrivacy,
  session,
  onOpenCreateTx,
  onOpenEditTx,
  onOpenCancelTx,
  onOpenSaldoAwal,
  onOpenPinWarga,
  onLockRT,
  onPrint,
  referensi,
  onOpenUsers,
  onOpenReferensi,
  onOpenLogs,
  onOpenAccount,
  onOpenMonitoringRW,
  onSync,
  isSyncing
}) => {
  const [showDetailLaporan, setShowDetailLaporan] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');

  // Periksa apakah user memiliki hak tulis di RT ini
  const canWrite = useMemo(() => {
    if (!session) return false;
    if (session.peran === 'ADMIN') return true;
    if ((session.peran === 'BENDAHARA' || session.peran === 'RT') && session.rt_id === activeRT) {
      return true;
    }
    return false;
  }, [session, activeRT]);

  const displaySaldo = (val: number) => {
    if (isPrivacy) return 'Rp ••••••••';
    return formatRupiah(val);
  };

  // Filter transaksi
  const filteredRows = useMemo(() => {
    if (!laporan || !laporan.rows) return [];
    return laporan.rows.filter((t) => {
      const matchSearch =
        !searchTerm ||
        t.jk.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ket.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchKategori = !selectedKategori || t.jk === selectedKategori;
      return matchSearch && matchKategori;
    });
  }, [laporan, searchTerm, selectedKategori]);

  const yearOptions = useMemo(() => {
    const curYear = new Date().getFullYear();
    return [curYear - 2, curYear - 1, curYear, curYear + 1];
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Hero Card: Saldo Kas Utama RT (Sesuai image.png) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#065f46] via-[#047857] to-[#059669] text-white p-6 sm:p-7 shadow-xl shadow-emerald-950/20 border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-emerald-100/90">
                Saldo Kas Saat Ini
              </span>
              <button
                onClick={onTogglePrivacy}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition active:scale-95"
                title={isPrivacy ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
              >
                {isPrivacy ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-white">
              {displaySaldo(laporan ? laporan.saldoKas : 0)}
            </div>

            <div className="text-xs text-emerald-100/80 mt-2 font-medium">
              Periode: {NAMA_BULAN[selectedMonth - 1]} {selectedYear}
            </div>
          </div>

          {/* Action Pills di pojok kanan kartu */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {onSync && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-xs font-bold text-white flex items-center gap-1.5 transition active:scale-95 shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sinkron</span>
              </button>
            )}

            {canWrite && (
              <button
                onClick={onOpenSaldoAwal}
                className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-xs font-bold text-white flex items-center gap-1.5 transition active:scale-95 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Saldo Awal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Section: Ringkasan Kas Bulanan (Sesuai image.png) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ringkasan Kas Bulanan
          </h3>

          <button
            onClick={onTogglePrivacy}
            className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-50 transition active:scale-95 shadow-2xs"
          >
            {isPrivacy ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
            <span>Privasi</span>
          </button>
        </div>

        {/* 4 Cards Grid 2x2 */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Saldo Awal */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              SALDO AWAL
            </span>
            <div className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {displaySaldo(laporan ? laporan.saldoAwal : 0)}
            </div>
          </div>

          {/* Pemasukan */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-emerald-300 dark:border-emerald-800/80 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              PEMASUKAN
            </span>
            <div className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {displaySaldo(laporan ? laporan.masuk : 0)}
            </div>
          </div>

          {/* Pengeluaran */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-rose-300 dark:border-rose-800/80 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              PENGELUARAN
            </span>
            <div className="text-base sm:text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {displaySaldo(laporan ? laporan.keluar : 0)}
            </div>
          </div>

          {/* Saldo Akhir */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              SALDO AKHIR
            </span>
            <div className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {displaySaldo(laporan ? laporan.saldoAkhir : 0)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section: Menu Utama (Sesuai image.png) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Menu Utama
          </h3>
        </div>

        <MainMenuGrid
          session={session}
          activeRT={activeRT}
          onOpenLaporan={() => setShowDetailLaporan(true)}
          onOpenCatatTx={onOpenCreateTx}
          onOpenSaldoAwal={onOpenSaldoAwal}
          onOpenUsers={onOpenUsers || (() => {})}
          onOpenReferensi={onOpenReferensi || (() => {})}
          onOpenLogs={onOpenLogs || (() => {})}
          onOpenPrint={onPrint}
          onOpenAccount={onOpenAccount || (() => {})}
          onOpenMonitoringRW={onOpenMonitoringRW || (() => {})}
          onOpenPinWarga={onOpenPinWarga}
          onLockRT={onLockRT}
        />
      </div>

      {/* 4. Section: Laporan Transaksi Lengkap (Muncul saat tombol Laporan Kas diklik atau diaktifkan) */}
      {showDetailLaporan && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 sm:p-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDetailLaporan(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                title="Tutup Rincian"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Rincian Laporan Kas RT {activeRT}
                </h3>
                <p className="text-xs text-slate-500">
                  Periode {NAMA_BULAN[selectedMonth - 1]} {selectedYear} ({filteredRows.length} transaksi)
                </p>
              </div>
            </div>

            {/* Filter Periode & Action */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => onChangeMonth(Number(e.target.value))}
                className="bg-slate-100 dark:bg-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                {NAMA_BULAN.map((n, i) => (
                  <option key={i + 1} value={i + 1}>{n}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => onChangeYear(Number(e.target.value))}
                className="bg-slate-100 dark:bg-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <button
                onClick={onPrint}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 mb-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari kejadian atau catatan kas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {referensi.map((r, i) => (
                <option key={i} value={r.jenis_kejadian}>{r.jenis_kejadian}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          {filteredRows.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-semibold">
              Tidak ada transaksi ditemukan pada periode ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-2 text-center w-8">No</th>
                    <th className="py-2.5 px-2 w-24">Tanggal</th>
                    <th className="py-2.5 px-2 w-24">Jenis</th>
                    <th className="py-2.5 px-3">Kejadian</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                    <th className="py-2.5 px-3 text-right">Saldo Kas</th>
                    {canWrite && <th className="py-2.5 px-2 text-center w-24">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRows.map((t) => {
                    const isInc = t.jt === 'PEMASUKAN';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-2 text-center text-slate-400 font-mono text-[11px]">{t.no}</td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatTanggal(t.tgl)}</td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isInc ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {t.jt}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{t.jk}</div>
                          {t.ket && <div className="text-[11px] text-slate-400">{t.ket}</div>}
                        </td>
                        <td className="py-3 px-3 text-right font-bold tabular-nums whitespace-nowrap">
                          <span className={isInc ? 'text-emerald-600' : 'text-rose-600'}>
                            {isInc ? '+' : '-'} {formatRupiah(t.nom)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold tabular-nums whitespace-nowrap">
                          {formatRupiah(t.saldo || 0)}
                        </td>
                        {canWrite && (
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onOpenEditTx(t)}
                                className="p-1 text-slate-500 hover:text-emerald-600 rounded"
                                title="Ubah"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onOpenCancelTx(t)}
                                className="p-1 text-slate-500 hover:text-rose-600 rounded"
                                title="Batalkan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Printable Report View (Auto fired on window.print()) */}
      <div className="hidden print:block text-black p-6 bg-white">
        <div className="text-center pb-4 border-b-2 border-black mb-6">
          <h2 className="text-xl font-bold tracking-tight">LAPORAN KAS & IURAN WARGA</h2>
          <h3 className="text-base font-semibold">RUKUN TETANGGA {activeRT}</h3>
          <p className="text-sm">Periode: {NAMA_BULAN[selectedMonth - 1]} {selectedYear}</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6 border p-4">
          <div>
            <div className="text-xs uppercase font-bold text-gray-600">Saldo Awal</div>
            <div className="text-sm font-bold">{formatRupiah(laporan ? laporan.saldoAwal : 0)}</div>
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-gray-600">Pemasukan</div>
            <div className="text-sm font-bold text-emerald-700">{formatRupiah(laporan ? laporan.masuk : 0)}</div>
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-gray-600">Pengeluaran</div>
            <div className="text-sm font-bold text-rose-700">{formatRupiah(laporan ? laporan.keluar : 0)}</div>
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-gray-600">Saldo Akhir</div>
            <div className="text-sm font-bold">{formatRupiah(laporan ? laporan.saldoAkhir : 0)}</div>
          </div>
        </div>

        <table className="w-full text-left text-xs border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-400">
              <th className="p-2 border border-gray-400 text-center w-8">No</th>
              <th className="p-2 border border-gray-400 w-20">Tanggal</th>
              <th className="p-2 border border-gray-400 w-24">Jenis</th>
              <th className="p-2 border border-gray-400">Kejadian & Uraian</th>
              <th className="p-2 border border-gray-400 text-right w-28">Nominal</th>
              <th className="p-2 border border-gray-400 text-right w-28">Saldo Kas</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((t, idx) => (
              <tr key={t.id} className="border-b border-gray-300">
                <td className="p-2 border border-gray-400 text-center">{idx + 1}</td>
                <td className="p-2 border border-gray-400">{formatTanggal(t.tgl)}</td>
                <td className="p-2 border border-gray-400">{t.jt}</td>
                <td className="p-2 border border-gray-400">
                  <strong>{t.jk}</strong>
                  {t.ket && <div className="text-[10px] text-gray-600">{t.ket}</div>}
                </td>
                <td className="p-2 border border-gray-400 text-right font-bold">{formatRupiah(t.nom)}</td>
                <td className="p-2 border border-gray-400 text-right">{formatRupiah(t.saldo || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tanda Tangan */}
        <div className="flex justify-between items-center text-center mt-12 pt-6 text-xs">
          <div className="w-48">
            <p>Mengetahui,</p>
            <p className="font-bold">Ketua RT {activeRT}</p>
            <div className="h-16" />
            <p>( ........................................ )</p>
          </div>
          <div className="w-48">
            <p>Dibuat oleh,</p>
            <p className="font-bold">Bendahara RT {activeRT}</p>
            <div className="h-16" />
            <p>( ........................................ )</p>
          </div>
        </div>
      </div>
    </div>
  );
};
