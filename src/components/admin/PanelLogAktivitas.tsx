import React, { useState, useEffect } from 'react';
import { History, Trash2, RefreshCw, KeyRound } from 'lucide-react';
import { ActivityLog } from '../../types';
import { api } from '../../services/api';

export const PanelLogAktivitas: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalClearOpen, setIsModalClearOpen] = useState(false);
  const [pinClear, setPinClear] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    const res = await api.getLogs();
    setIsLoading(false);
    if (res.ok && res.data) {
      setLogs(res.data);
    }
  };

  const handleClearLogs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinClear) return setErrorMsg('Masukkan PIN Keamanan');

    try {
      const res = await api.clearLogs(pinClear);
      if (res.ok) {
        setIsModalClearOpen(false);
        setPinClear('');
        loadLogs();
      } else {
        setErrorMsg(res.error || 'PIN Keamanan salah');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal menghapus log');
    }
  };

  const getAksiColor = (aksi: string) => {
    if (/LOGIN/i.test(aksi)) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
    if (/TAMBAH/i.test(aksi)) return 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300';
    if (/UBAH/i.test(aksi)) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    if (/BATAL|HAPUS/i.test(aksi)) return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            <span>Audit Trail & Log Aktivitas Sistem</span>
          </h3>
          <p className="text-xs text-slate-500">
            Riwayat lengkap aksi transaksi, login, dan konfigurasi data kas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
          <button
            onClick={() => {
              setErrorMsg('');
              setPinClear('');
              setIsModalClearOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Log</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Memuat log aktivitas...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">Belum ada catatan aktivitas.</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {logs.map((lg, i) => (
            <div key={i} className="py-3.5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                <History className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {lg.username}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getAksiColor(lg.aksi)}`}>
                      {lg.aksi}
                    </span>
                    {lg.rt_id && lg.rt_id !== 'ALL' && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        RT {lg.rt_id}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {lg.waktu}
                  </span>
                </div>
                {lg.detail && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60 font-mono text-[11px]">
                    {lg.id ? `[${lg.id}] ` : ''}{lg.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Hapus Log */}
      {isModalClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Hapus Seluruh Log</h3>
                <p className="text-xs text-slate-500">Tindakan administratif khusus Super Admin</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Catatan audit log sistem akan dihapus permanen. Masukkan <strong>PIN Keamanan (default: 228822)</strong> untuk melanjutkan.
            </p>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleClearLogs} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-center">
                  PIN Keamanan
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinClear}
                  onChange={(e) => setPinClear(e.target.value)}
                  placeholder="6 Digit PIN"
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center font-mono text-xl tracking-widest font-extrabold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalClearOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Hapus Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
