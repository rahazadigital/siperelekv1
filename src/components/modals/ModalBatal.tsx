import React, { useState } from 'react';
import { AlertCircle, X, Trash2 } from 'lucide-react';
import { Transaction } from '../../types';
import { formatRupiah, formatTanggal } from '../../services/api';

interface ModalBatalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  activeRT: string;
  onConfirmCancel: (txId: string, rtId: string, alasan: string) => Promise<void>;
}

export const ModalBatal: React.FC<ModalBatalProps> = ({
  isOpen,
  onClose,
  transaction,
  activeRT,
  onConfirmCancel
}) => {
  const [alasan, setAlasan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alasan.trim()) {
      return setErrorMsg('Alasan pembatalan transaksi wajib diisi');
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onConfirmCancel(transaction.id, activeRT, alasan.trim());
      setIsSubmitting(false);
      setAlasan('');
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Gagal membatalkan transaksi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Batalkan Transaksi ({transaction.id})
            </h3>
            <p className="text-xs text-slate-500">Unit: Rukun Tetangga {activeRT}</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1 mb-4">
          <div className="flex justify-between">
            <span className="text-slate-400">Tanggal:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{formatTanggal(transaction.tgl)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Kejadian:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{transaction.jk}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Nominal:</span>
            <span className="font-extrabold text-rose-600">{formatRupiah(transaction.nom)}</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
          Transaksi yang dibatalkan akan ditandai nonaktif dan tidak lagi dihitung dalam total kas. Tindakan ini tercatat pada log audit sistem.
        </p>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Alasan Pembatalan <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Salah memasukkan nominal / dobel catat iuran warga"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? 'Membatalkan...' : 'Batalkan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
