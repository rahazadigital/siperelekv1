import React, { useState, useEffect } from 'react';
import { X, Clock, Check } from 'lucide-react';
import { api, formatRupiah } from '../../services/api';

interface ModalSaldoAwalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRT: string;
  onSuccess: () => void;
}

export const ModalSaldoAwal: React.FC<ModalSaldoAwalProps> = ({
  isOpen,
  onClose,
  activeRT,
  onSuccess
}) => {
  const [nominalStr, setNominalStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      loadCurrentSaldoAwal();
    }
  }, [isOpen, activeRT]);

  const loadCurrentSaldoAwal = async () => {
    setIsLoading(true);
    const res = await api.getSaldoAwal(activeRT);
    setIsLoading(false);
    if (res.ok && res.data) {
      setNominalStr(new Intl.NumberFormat('id-ID').format(res.data.saldo_awal));
    }
  };

  if (!isOpen) return null;

  const rawNominal = parseInt(nominalStr.replace(/\D/g, ''), 10) || 0;

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setNominalStr('');
      return;
    }
    const val = parseInt(raw, 10);
    setNominalStr(new Intl.NumberFormat('id-ID').format(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.setSaldoAwal(activeRT, rawNominal);
      setIsLoading(false);
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan saldo awal');
      }
    } catch (e: any) {
      setIsLoading(false);
      setErrorMsg(e.message || 'Gagal menyimpan saldo awal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Saldo Awal Kas RT {activeRT}</h3>
              <p className="text-xs text-slate-500">Saldo sebelum pembukuan kas dimulai</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Nominal Saldo Awal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={nominalStr}
                onChange={handleNominalChange}
                className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-base font-extrabold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
