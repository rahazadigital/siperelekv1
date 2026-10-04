import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

interface ModalPinWargaProps {
  isOpen: boolean;
  onClose: () => void;
  activeRT: string;
  onSuccess: (newPin: string) => void;
}

export const ModalPinWarga: React.FC<ModalPinWargaProps> = ({
  isOpen,
  onClose,
  activeRT,
  onSuccess
}) => {
  const [currentPin, setCurrentPin] = useState('••••••');
  const [newPin, setNewPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setNewPin('');
      loadPin();
    }
  }, [isOpen, activeRT]);

  const loadPin = async () => {
    setIsLoading(true);
    const res = await api.getPinWarga(activeRT);
    setIsLoading(false);
    if (res.ok && res.data) {
      setCurrentPin(res.data.pin);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPin)) {
      return setErrorMsg('PIN harus terdiri dari 6 digit angka');
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.setPinWarga(activeRT, newPin);
      setIsLoading(false);
      if (res.ok) {
        onSuccess(newPin);
        onClose();
      } else {
        setErrorMsg(res.error || 'Gagal mengubah PIN');
      }
    } catch (e: any) {
      setIsLoading(false);
      setErrorMsg(e.message || 'Gagal mengubah PIN');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">PIN Warga RT {activeRT}</h3>
              <p className="text-xs text-slate-500">Kunci akses keterbukaan kas warga</p>
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
              PIN Saat Ini
            </label>
            <div className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-center text-base tracking-widest font-bold text-slate-700 dark:text-slate-300">
              {currentPin}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wide">
              PIN Baru (6 Digit Angka)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Contoh: 123456"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center font-mono text-xl tracking-widest font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Bagikan PIN ini kepada warga RT {activeRT} agar dapat melihat laporan kas.
            </p>
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
              disabled={isLoading || newPin.length !== 6}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
