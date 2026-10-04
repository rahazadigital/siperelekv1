import React, { useState, useEffect } from 'react';
import { User, Plus, Edit2, UserX, UserCheck, Shield } from 'lucide-react';
import { UserAccount, UnitRT, UserRole } from '../../types';
import { api } from '../../services/api';

interface PanelPenggunaProps {
  rtList: UnitRT[];
  currentUsername: string;
}

export const PanelPengguna: React.FC<PanelPenggunaProps> = ({ rtList, currentUsername }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formPeran, setFormPeran] = useState<UserRole>('BENDAHARA');
  const [formRT, setFormRT] = useState('001');
  const [formPassword, setFormPassword] = useState('');
  const [formAktif, setFormAktif] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const res = await api.getUsers();
    setIsLoading(false);
    if (res.ok && res.data) {
      setUsers(res.data);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormNama('');
    setFormPeran('BENDAHARA');
    setFormRT(rtList[0]?.id || '001');
    setFormPassword('');
    setFormAktif(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: UserAccount) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormNama(u.nama);
    setFormPeran(u.peran);
    setFormRT(u.rt_id || '001');
    setFormPassword('');
    setFormAktif(u.aktif);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (editingUser) {
        const res = await api.updateUser({
          username: editingUser.username,
          nama: formNama,
          peran: formPeran,
          rt_id: formPeran === 'ADMIN' || formPeran === 'RW' ? 'ALL' : formRT,
          password: formPassword || undefined,
          aktif: formAktif
        });
        if (!res.ok) throw new Error(res.error);
      } else {
        if (!formPassword || formPassword.length < 6) {
          throw new Error('Password baru minimal 6 karakter');
        }
        const res = await api.addUser({
          username: formUsername.trim(),
          nama: formNama.trim(),
          peran: formPeran,
          rt_id: formPeran === 'ADMIN' || formPeran === 'RW' ? 'ALL' : formRT,
          password: formPassword
        });
        if (!res.ok) throw new Error(res.error);
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan user');
    }
  };

  const handleToggleAktif = async (u: UserAccount) => {
    if (u.username === currentUsername) {
      alert('Tidak bisa menonaktifkan akun sendiri');
      return;
    }
    const newStatus = !u.aktif;
    if (confirm(`${newStatus ? 'Aktifkan' : 'Nonaktifkan'} user ${u.nama} (@${u.username})?`)) {
      if (newStatus) {
        await api.updateUser({ username: u.username, aktif: true });
      } else {
        await api.deleteUser(u.username);
      }
      loadUsers();
    }
  };

  const getRoleBadge = (peran: UserRole) => {
    switch (peran) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300';
      case 'RW':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300';
      case 'RT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300';
      case 'BENDAHARA':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <span>Kelola Pengguna Sistem</span>
          </h3>
          <p className="text-xs text-slate-500">
            Daftar pengurus RW, bendahara RT, dan ketua RT dengan akses login
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah User Baru</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Memuat daftar pengguna...</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((u) => {
            const isSelf = u.username === currentUsername;
            return (
              <div key={u.username} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {u.nama}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getRoleBadge(u.peran)}`}>
                        {u.peran}
                      </span>
                      {!u.aktif && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span>@{u.username}</span>
                      <span> · </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {u.rt_id === 'ALL' ? 'Semua RT se-RW' : `Unit RT ${u.rt_id}`}
                      </span>
                      {isSelf && <span className="text-purple-600 font-bold ml-1">(Akun Anda)</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                    title="Ubah User"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!isSelf && (
                    <button
                      onClick={() => handleToggleAktif(u)}
                      className={`p-1.5 rounded-lg transition ${
                        u.aktif
                          ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                          : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                      title={u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {u.aktif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {editingUser ? `Ubah User: ${editingUser.username}` : 'Tambah User Pengurus Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Konfigurasikan peran dan hak unit RT pengguna
            </p>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Username
                </label>
                <input
                  type="text"
                  disabled={!!editingUser}
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Contoh: bendahara03"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Nama pengurus"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Peran (Role)
                  </label>
                  <select
                    value={formPeran}
                    onChange={(e) => setFormPeran(e.target.value as UserRole)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    <option value="BENDAHARA">BENDAHARA</option>
                    <option value="RT">RT</option>
                    <option value="RW">RW</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Unit RT Ditugaskan
                  </label>
                  <select
                    value={formRT}
                    onChange={(e) => setFormRT(e.target.value)}
                    disabled={formPeran === 'ADMIN' || formPeran === 'RW'}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer disabled:opacity-60"
                  >
                    {formPeran === 'ADMIN' || formPeran === 'RW' ? (
                      <option value="ALL">Semua RT (ALL)</option>
                    ) : (
                      rtList.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          {rt.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Password {editingUser ? '(Kosongkan jika tidak diganti)' : ''}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? '••••••' : 'Min. 6 karakter'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  required={!editingUser}
                />
              </div>

              {editingUser && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="userAktifToggle"
                    checked={formAktif}
                    onChange={(e) => setFormAktif(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                  />
                  <label htmlFor="userAktifToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Akun Aktif (Dapat Login)
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
