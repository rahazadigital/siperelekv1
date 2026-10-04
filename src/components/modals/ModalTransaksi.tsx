import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, PlusCircle, Check } from 'lucide-react';
import { Transaction, ReferensiItem } from '../../types';
import { formatRupiah } from '../../services/api';

interface ModalTransaksiProps {
  isOpen: boolean;
  onClose: () => void;
  activeRT: string;
  transactionToEdit: Transaction | null;
  onSave: (data: {
    id?: string;
    rt_id: string;
    tanggal: string;
    jenis_transaksi: 'PEMASUKAN' | 'PENGELUARAN';
    jenis_kejadian: string;
    nominal: number;
    keterangan?: string;
  }) => Promise<void>;
  referensi: ReferensiItem[];
  currentKas: number;
}

export const ModalTransaksi: React.FC<ModalTransaksiProps> = ({
  isOpen,
  onClose,
  activeRT,
  transactionToEdit,
  onSave,
  referensi,
  currentKas
}) => {
  const [tanggal, setTanggal] = useState('');
  const [jenisTransaksi, setJenisTransaksi] = useState<'PEMASUKAN' | 'PENGELUARAN'>('PEMASUKAN');
  const [jenisKejadian, setJenisKejadian] = useState('');
  const [nominalStr, setNominalStr] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [warnNegative, setWarnNegative] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setTanggal(transactionToEdit.tgl);
        setJenisTransaksi(transactionToEdit.jt);
        setJenisKejadian(transactionToEdit.jk);
        setNominalStr(new Intl.NumberFormat('id-ID').format(transactionToEdit.nom));
        setKeterangan(transactionToEdit.ket || '');
      } else {
        const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
        setTanggal(today);
        setJenisTransaksi('PEMASUKAN');
        setNominalStr('');
        setKeterangan('');
      }
      setErrorMessage('');
      setWarnNegative(false);
    }
  }, [isOpen, transactionToEdit]);

  // Filter pilihan jenis kejadian berdasarkan jenis transaksi
  const availableKejadian = referensi.filter(
    (r) => r.jenis_transaksi_diizinkan === jenisTransaksi || r.jenis_transaksi_diizinkan === 'KEDUANYA'
  );

  useEffect(() => {
    if (availableKejadian.length > 0 && !availableKejadian.some((k) => k.jenis_kejadian === jenisKejadian)) {
      setJenisKejadian(availableKejadian[0].jenis_kejadian);
    }
  }, [jenisTransaksi, availableKejadian]);

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

    // Cek saldo negatif
    if (jenisTransaksi === 'PENGELUARAN' && !transactionToEdit && currentKas - val < 0) {
      setWarnNegative(true);
    } else {
      setWarnNegative(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal) return setErrorMessage('Tanggal wajib diisi');
    if (!jenisKejadian) return setErrorMessage('Jenis kejadian wajib dipilih');
    if (rawNominal <= 0) return setErrorMessage('Nominal harus lebih dari 0 rupiah');

    setErrorMessage('');
    setIsSaving(true);
    try {
      await onSave({
        id: transactionToEdit ? transactionToEdit.id : undefined,
        rt_id: activeRT,
        tanggal,
        jenis_transaksi: jenisTransaksi,
        jenis_kejadian: jenisKejadian,
        nominal: rawNominal,
        keterangan: keterangan.trim()
      });
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err.message || 'Gagal menyimpan transaksi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
        {/* Grab Handle for Mobile */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {transactionToEdit ? `Ubah Transaksi (${transactionToEdit.id})` : `Catat Transaksi RT ${activeRT}`}
            </h3>
            <p className="text-xs text-slate-500">
              {transactionToEdit ? 'Perbarui data catatan kas' : `Input kas baru untuk unit RT ${activeRT}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            {errorMessage}
          </div>
        )}

        {warnNegative && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Peringatan: Pengeluaran ini akan membuat saldo kas RT {activeRT} menjadi negatif ({formatRupiah(currentKas - rawNominal)}).
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Tanggal */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Jenis Transaksi */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Jenis Kas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setJenisTransaksi('PEMASUKAN')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                  jenisTransaksi === 'PEMASUKAN'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>PEMASUKAN (IURAN)</span>
              </button>
              <button
                type="button"
                onClick={() => setJenisTransaksi('PENGELUARAN')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                  jenisTransaksi === 'PENGELUARAN'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>PENGELUARAN</span>
              </button>
            </div>
          </div>

          {/* Jenis Kejadian */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Jenis Kejadian / Kategori
            </label>
            <select
              value={jenisKejadian}
              onChange={(e) => setJenisKejadian(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              required
            >
              {availableKejadian.map((r, i) => (
                <option key={i} value={r.jenis_kejadian}>
                  {r.jenis_kejadian}
                </option>
              ))}
            </select>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Nominal (Rp)
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

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Keterangan / Uraian (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Iuran warga Blok C / Beli lampu penerangan pos"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
