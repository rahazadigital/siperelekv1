import React from 'react';
import { Eye, EyeOff, RefreshCw, Printer, User, LogOut, ArrowLeft, Home } from 'lucide-react';
import { AuthSession, UnitRT } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  session: AuthSession | null;
  activeRT: string;
  rtList: UnitRT[];
  rwName: string;
  onSelectRT: (rtId: string) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  isPrivacy: boolean;
  onTogglePrivacy: () => void;
  onSync: () => void;
  isSyncing: boolean;
  onPrint: () => void;
  currentTab: 'dashboard' | 'monitoring_rw' | 'users' | 'referensi' | 'logs';
  onNavigateTab: (tab: 'dashboard' | 'monitoring_rw' | 'users' | 'referensi' | 'logs') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  activeRT,
  rtList,
  rwName,
  onSelectRT,
  onOpenLogin,
  onLogout,
  isPrivacy,
  onTogglePrivacy,
  onSync,
  isSyncing,
  onPrint,
  currentTab,
  onNavigateTab
}) => {
  const isOfficer = !!session;
  const isRW = session?.peran === 'RW' || session?.peran === 'ADMIN';
  const isAdmin = session?.peran === 'ADMIN';

  // Sapaan dinamis sesuai waktu dan user (seperti di image.png)
  const getGreeting = () => {
    const h = new Date().getHours();
    let timeStr = 'Selamat Malam';
    if (h >= 4 && h < 11) timeStr = 'Selamat Pagi';
    else if (h >= 11 && h < 15) timeStr = 'Selamat Siang';
    else if (h >= 15 && h < 18) timeStr = 'Selamat Sore';

    if (session) {
      return `${timeStr}, ${session.nama}`;
    }
    return `${timeStr}, Warga RT ${activeRT}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#065f46] via-[#047857] to-[#059669] text-white shadow-md border-b border-emerald-600/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
        {/* Row 1: Sapaan Pill Badge & Refresh Button (Sesuai image.png) */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Greeting Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold border border-white/30 shadow-xs max-w-[80%] truncate">
            <span>{getGreeting()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePrivacy}
              title={isPrivacy ? 'Tampilkan Nominal Kas' : 'Sembunyikan Nominal Kas (Mode Privasi)'}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition active:scale-95 border border-white/25"
            >
              {isPrivacy ? <EyeOff className="w-4 h-4 text-amber-300" /> : <Eye className="w-4 h-4 text-white" />}
            </button>

            {/* Refresh / Sync Button (Sesuai icon circular di kanan atas image.png) */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              title="Segarkan data kas"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition active:scale-95 border border-white/30 shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Row 2: Brand Lockup & RT Selector */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {currentTab !== 'dashboard' ? (
              <button
                onClick={() => onNavigateTab('dashboard')}
                className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition active:scale-95"
                title="Kembali ke Beranda"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/20 p-1 flex items-center justify-center shrink-0 shadow-xs border border-white/30">
                <img
                  src="/icon.svg"
                  alt="Logo SiPerelek"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">
                SiPerelek
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-medium">
                <span>Kas Perelek</span>
                <span>·</span>
                <select
                  value={activeRT}
                  onChange={(e) => onSelectRT(e.target.value)}
                  disabled={session?.peran === 'RT' || session?.peran === 'BENDAHARA'}
                  className="bg-emerald-900/60 text-white font-bold text-xs py-0.5 px-2 rounded-md border border-white/30 cursor-pointer focus:outline-none"
                >
                  {rtList.map((rt) => (
                    <option key={rt.id} value={rt.id} className="bg-slate-900 text-white">
                      RT {rt.id}
                    </option>
                  ))}
                </select>
                <span>/ {rwName || 'RW 009'}</span>
              </div>
            </div>
          </div>

          {/* Quick Right Action */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <PWAInstallButton compact />
            </div>

            {isOfficer ? (
              <button
                onClick={onLogout}
                title="Keluar Akun"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-600/70 hover:bg-rose-600 text-white border border-white/20 transition active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/30 transition active:scale-95"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
