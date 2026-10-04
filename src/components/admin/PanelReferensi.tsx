import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { ReferensiItem } from '../../types';
import { api } from '../../services/api';

export const PanelReferensi: React.FC = () => {
  const [items, setItems] = useState<ReferensiItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferensiItem | null>(null);

  const [formKejadian, setFormKejadian] = useState('');
  const [formJenis, setFormJenis] = useState('PEMASUKAN');
  const [formAktif, setFormAktif] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadReferensi();
  }, []);

  const loadReferensi = async () => {
    setIsLoading(true);
    const res = await api.getAllReferensi();
    setIsLoading(false);
    if (res.ok && res.data) {
      setItems(res.data);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormKejadian('');
    setFormJenis('PEMASUKAN');
    setFormAktif(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ReferensiItem) => {
    setEditingItem(item);
    setFormKejadian(item.jenis_kejadian);
    setFormJenis(item.jenis_transaksi_diizinkan);
    setFormAktif(item.aktif);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (editingItem) {
        const res = await api.updateReferensi(
          editingItem.jenis_kejadian,
          formKejadian.trim().toUpperCase(),
          formJenis,
          formAktif
        );
        if (!res.ok) throw new Error(res.error);
      } else {
        const res = await api.addReferensi(formKejadian.trim().toUpperCase(), formJenis);
        if (!res.ok) throw new Error(res.error);
      }
      setIsModalOpen(false);
      loadReferensi();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan kategori');
    }
  };

  const handleToggleAktif = async (item: ReferensiItem) => {
    const newStatus = !item.aktif;
    if (confirm(`${newStatus ? 'Aktifkan' : 'Nonaktifkan'} kategori "${item.jenis_kejadian}"?`)) {
      if (newStatus) {
        await api.updateReferensi(item.jenis_kejadian, item.jenis_kejadian, item.jenis_transaksi_diizinkan, true);
      } else {
        await api.deleteReferensi(item.jenis_kejadian);
      }
      loadReferensi();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-purple-600" />
            <span>Kategori & Referensi Kas</span>
          </h3>
          <p className="text-xs text-slate-500">
            Daftar jenis kejadian pemasukan dan pengeluaran yang diizinkan dalam sistem
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Memuat referensi...</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((r, i) => (
            <div key={i} className="py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    r.jenis_transaksi_diizinkan === 'PEMASUKAN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : r.jenis_transaksi_diizinkan === 'PENGELUARAN'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {r.jenis_transaksi_diizinkan[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {r.jenis_kejadian}
                    </h4>
                    {!r.aktif && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Jenis: <span className="font-semibold">{r.jenis_transaksi_diizinkan}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(r)}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleAktif(r)}
                  className={`p-1.5 rounded-lg transition ${
                    r.aktif ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title={r.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {r.aktif ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Kategori */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {editingItem ? 'Ubah Kategori Kas' : 'Tambah Kategori Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Tentukan nama kejadian dan peruntukan jenis kas
            </p>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Nama Kejadian / Kategori
                </label>
                <input
                  type="text"
                  value={formKejadian}
                  onChange={(e) => setFormKejadian(e.target.value)}
                  placeholder="Contoh: BANTUAN BENCANA"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Jenis Transaksi Diizinkan
                </label>
                <select
                  value={formJenis}
                  onChange={(e) => setFormJenis(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <option value="PEMASUKAN">Hanya PEMASUKAN</option>
                  <option value="PENGELUARAN">Hanya PENGELUARAN</option>
                  <option value="KEDUANYA">KEDUANYA (Pemasukan & Pengeluaran)</option>
                </select>
              </div>

              {editingItem && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="katAktifToggle"
                    checked={formAktif}
                    onChange={(e) => setFormAktif(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                  />
                  <label htmlFor="katAktifToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Kategori Aktif
                  </label>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
