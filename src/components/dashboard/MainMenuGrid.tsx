import React from 'react';
import { 
  BarChart3, Plus, Wallet, Users, FolderTree, History, 
  Printer, User, Building2, Lock, KeyRound
} from 'lucide-react';
import { AuthSession } from '../../types';

interface MainMenuGridProps {
  session: AuthSession | null;
  activeRT: string;
  onOpenLaporan: () => void;
  onOpenCatatTx: () => void;
  onOpenSaldoAwal: () => void;
  onOpenUsers: () => void;
  onOpenReferensi: () => void;
  onOpenLogs: () => void;
  onOpenPrint: () => void;
  onOpenAccount: () => void;
  onOpenMonitoringRW: () => void;
  onOpenPinWarga: () => void;
  onLockRT: () => void;
}

export const MainMenuGrid: React.FC<MainMenuGridProps> = ({
  session,
  activeRT,
  onOpenLaporan,
  onOpenCatatTx,
  onOpenSaldoAwal,
  onOpenUsers,
  onOpenReferensi,
  onOpenLogs,
  onOpenPrint,
  onOpenAccount,
  onOpenMonitoringRW,
  onOpenPinWarga,
  onLockRT
}) => {
  const isAdmin = session?.peran === 'ADMIN';
  const isRW = session?.peran === 'RW' || session?.peran === 'ADMIN';
  const canWrite = session?.peran === 'ADMIN' || ((session?.peran === 'BENDAHARA' || session?.peran === 'RT') && session?.rt_id === activeRT);
  const canManagePin = session?.peran === 'ADMIN' || (session?.peran === 'RT' && session?.rt_id === activeRT);

  const menuItems = [
    {
      id: 'laporan',
      label: 'Laporan Kas',
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-100 hover:bg-blue-200/80',
      action: onOpenLaporan
    },
    {
      id: 'catat',
      label: 'Catat Transaksi',
      icon: <Plus className="w-6 h-6 text-white" />,
      bg: 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/30',
      action: onOpenCatatTx
    },
    {
      id: 'saldo_awal',
      label: 'Atur Saldo Awal',
      icon: <Wallet className="w-5 h-5 text-amber-700" />,
      bg: 'bg-amber-100 hover:bg-amber-200/80',
      action: onOpenSaldoAwal
    },
    {
      id: 'users',
      label: 'Kelola Pengguna',
      icon: <Users className="w-5 h-5 text-purple-700" />,
      bg: 'bg-purple-100 hover:bg-purple-200/80',
      action: onOpenUsers
    },
    {
      id: 'referensi',
      label: 'Kelola Referensi',
      icon: <FolderTree className="w-5 h-5 text-sky-700" />,
      bg: 'bg-sky-100 hover:bg-sky-200/80',
      action: onOpenReferensi
    },
    {
      id: 'logs',
      label: 'Log Aktivitas',
      icon: <History className="w-5 h-5 text-violet-700" />,
      bg: 'bg-violet-100 hover:bg-violet-200/80',
      action: onOpenLogs
    },
    {
      id: 'cetak',
      label: 'Cetak Laporan',
      icon: <Printer className="w-5 h-5 text-slate-700" />,
      bg: 'bg-slate-100 hover:bg-slate-200/80',
      action: onOpenPrint
    },
    {
      id: 'akun',
      label: session ? 'Akun Saya' : 'Login Pengurus',
      icon: <User className="w-5 h-5 text-emerald-700" />,
      bg: 'bg-emerald-100 hover:bg-emerald-200/80',
      action: onOpenAccount
    }
  ];

  // Tambahan item jika RW atau pengurus
  const extraItems = [];
  if (isRW) {
    extraItems.push({
      id: 'monitoring_rw',
      label: 'Monitoring RW',
      icon: <Building2 className="w-5 h-5 text-sky-600" />,
      bg: 'bg-sky-100 hover:bg-sky-200/80',
      action: onOpenMonitoringRW
    });
  }

  if (canManagePin) {
    extraItems.push({
      id: 'pin_warga',
      label: 'PIN Warga RT',
      icon: <KeyRound className="w-5 h-5 text-amber-700" />,
      bg: 'bg-amber-100 hover:bg-amber-200/80',
      action: onOpenPinWarga
    });
  }

  if (!session) {
    extraItems.push({
      id: 'kunci_rt',
      label: 'Kunci Akses',
      icon: <Lock className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-100 hover:bg-rose-200/80',
      action: onLockRT
    });
  }

  const allItems = [...menuItems, ...extraItems];

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800">
      <div className="grid grid-cols-4 gap-y-6 gap-x-2 sm:gap-x-4">
        {allItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className="flex flex-col items-center text-center group cursor-pointer focus:outline-none transition active:scale-95"
          >
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-105 ${item.bg}`}
            >
              {item.icon}
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight line-clamp-2 max-w-[80px] sm:max-w-[100px]">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
