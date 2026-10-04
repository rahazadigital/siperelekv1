import React from 'react';
import { 
  Building2, TrendingUp, TrendingDown, Users, ChevronRight, 
  ShieldCheck, BarChart3, AlertCircle, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';
import { LaporanRW, RTSummary } from '../../types';
import { formatRupiah, NAMA_BULAN } from '../../services/api';

interface MonitoringRWProps {
  laporanRW: LaporanRW | null;
  selectedMonth: number;
  selectedYear: number;
  onSelectRTForInspection: (rtId: string) => void;
  isPrivacy: boolean;
}

export const MonitoringRW: React.FC<MonitoringRWProps> = ({
  laporanRW,
  selectedMonth,
  selectedYear,
  onSelectRTForInspection,
  isPrivacy
}) => {
  const displaySaldo = (val: number) => {
    if (isPrivacy) return 'Rp ••••••••';
    return formatRupiah(val);
  };

  const totalKas = laporanRW ? laporanRW.totalKasRW : 0;
  const totalMasuk = laporanRW ? laporanRW.totalMasukRW : 0;
  const totalKeluar = laporanRW ? laporanRW.totalKeluarRW : 0;
  const jumlahRT = laporanRW ? laporanRW.jumlahRT : 0;
  const rtList = laporanRW ? laporanRW.rtList : [];

  return (
    <div className="space-y-6">
      {/* 1. Hero RW Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-blue-900 text-white p-6 sm:p-7 shadow-xl border border-white/20">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-400/30 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Panel Pengawasan Terpadu {laporanRW?.rw || 'RW 009'}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                {jumlahRT} Rukun Tetangga (RT)
              </span>
            </div>
            <div className="text-xs text-slate-300">
              Periode Evaluasi: <strong>{NAMA_BULAN[selectedMonth - 1]} {selectedYear}</strong>
            </div>
          </div>

          <div className="my-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-sky-200 block mb-1">
              Akumulasi Total Kas Gabungan Seluruh RT
            </span>
            <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums text-white drop-shadow-sm">
              {displaySaldo(totalKas)}
            </div>
          </div>

          <p className="text-xs text-slate-300 max-w-2xl mt-3 leading-relaxed">
            Data konsolidasi saldo kas, mutasi iuran warga, dan pengeluaran operasional seluruh RT di bawah naungan {laporanRW?.rw || 'RW 009'} secara transparan dan akuntabel.
          </p>
        </div>
      </div>

      {/* 2. Ringkasan Eksekutif Agregat RW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total RT Terdaftar</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {jumlahRT} <span className="text-xs font-normal text-slate-400">Unit RT</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Status database spreadsheet aktif</p>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pemasukan RW</span>
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {displaySaldo(totalMasuk)}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-1">Bulan {NAMA_BULAN[selectedMonth - 1]}</p>
        </div>

        <div className="bg-rose-50/70 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pengeluaran RW</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-700 dark:text-rose-400 tabular-nums">
            {displaySaldo(totalKeluar)}
          </div>
          <p className="text-[11px] text-rose-600/80 mt-1">Bulan {NAMA_BULAN[selectedMonth - 1]}</p>
        </div>
      </div>

      {/* 3. Komparasi Kas & Distribusi Saldo Antar-RT */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-600" />
              <span>Komparasi Saldo & Keaktifan Kas Masing-Masing RT</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik pada salah satu RT untuk menginspeksi rincian transaksi kas lengkap (Read-Only)
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {rtList.map((rt) => {
            const pct = totalKas > 0 ? Math.min(100, Math.max(0, Math.round((rt.saldoKas / totalKas) * 100))) : 0;
            return (
              <div
                key={rt.rt_id}
                onClick={() => onSelectRTForInspection(rt.rt_id)}
                className="py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-2xl px-3 transition cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-extrabold text-sm flex items-center justify-center shrink-0 border border-sky-200 dark:border-sky-800">
                      {rt.rt_id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-sky-600 transition">
                          {rt.nama_rt}
                        </h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {rt.totalTransaksi} Transaksi
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="text-emerald-600 font-medium">
                          Masuk: {displaySaldo(rt.masukBulanIni)}
                        </span>
                        <span>·</span>
                        <span className="text-rose-600 font-medium">
                          Keluar: {displaySaldo(rt.keluarBulanIni)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-xs uppercase font-semibold text-slate-400">
                        Saldo Kas
                      </div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                        {displaySaldo(rt.saldoKas)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {pct}% dari kas RW
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center transition shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Micro Progress Bar Kas */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
