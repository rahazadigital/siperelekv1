import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/common/Navbar';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { WargaLockScreen } from './components/warga/WargaLockScreen';
import { DashboardRT } from './components/dashboard/DashboardRT';
import { MonitoringRW } from './components/rw/MonitoringRW';
import { PanelPengguna } from './components/admin/PanelPengguna';
import { PanelReferensi } from './components/admin/PanelReferensi';
import { PanelLogAktivitas } from './components/admin/PanelLogAktivitas';
import { ModalTransaksi } from './components/modals/ModalTransaksi';
import { ModalBatal } from './components/modals/ModalBatal';
import { ModalLogin } from './components/modals/ModalLogin';
import { ModalSaldoAwal } from './components/modals/ModalSaldoAwal';
import { ModalPinWarga } from './components/modals/ModalPinWarga';
import { api } from './services/api';
import { 
  AuthSession, UnitRT, LaporanRT, LaporanRW, Transaction, ReferensiItem 
} from './types';

export default function App() {
  // Session & Authentication
  const [session, setSession] = useState<AuthSession | null>(() => {
    const raw = sessionStorage.getItem('siperelek_session');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return null;
  });

  // RT Unit Management
  const [rtList, setRtList] = useState<UnitRT[]>([
    { id: '001', name: 'RT 001', code: '001' },
    { id: '002', name: 'RT 002', code: '002' },
    { id: '003', name: 'RT 003', code: '003' },
    { id: '004', name: 'RT 004', code: '004' },
    { id: '005', name: 'RT 005', code: '005' }
  ]);
  const [activeRT, setActiveRT] = useState<string>('001');
  const [rwName, setRwName] = useState<string>('RW 009');

  // Warga PIN Access
  const [unlockedRTs, setUnlockedRTs] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    ['001', '002', '003', '004', '005'].forEach((rt) => {
      const saved = localStorage.getItem(`pin_warga_RT${rt}`) || sessionStorage.getItem(`pin_warga_RT${rt}`);
      if (saved && saved.length === 6) init[rt] = true;
    });
    return init;
  });

  // Data State
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [laporanRT, setLaporanRT] = useState<LaporanRT | null>(null);
  const [laporanRW, setLaporanRW] = useState<LaporanRW | null>(null);
  const [referensi, setReferensi] = useState<ReferensiItem[]>([]);

  // Navigation & View State
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'monitoring_rw' | 'users' | 'referensi' | 'logs'>('dashboard');
  const [isPrivacy, setIsPrivacy] = useState<boolean>(() => localStorage.getItem('siperelek_privacy') === '1');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Modals
  const [isCreateTxOpen, setIsCreateTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [cancelingTx, setCancelingTx] = useState<Transaction | null>(null);
  const [isSaldoAwalOpen, setIsSaldoAwalOpen] = useState(false);
  const [isPinWargaOpen, setIsPinWargaOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  // Toggle Privacy
  const togglePrivacy = () => {
    const next = !isPrivacy;
    setIsPrivacy(next);
    localStorage.setItem('siperelek_privacy', next ? '1' : '0');
    showToast(next ? 'Nominal kas disembunyikan (Mode Privasi)' : 'Nominal kas ditampilkan');
  };

  // 1. Initial Load: Units & Referensi
  useEffect(() => {
    async function init() {
      const [uRes, rRes] = await Promise.all([
        api.getUnitList(),
        api.getReferensi()
      ]);
      if (uRes.ok && uRes.data) {
        setRtList(uRes.data.list);
        setRwName(uRes.data.rw);
      }
      if (rRes.ok && rRes.data) {
        setReferensi(rRes.data);
      }
    }
    init();
  }, []);

  // 2. Load Laporan RT saat activeRT atau periode berubah
  const loadLaporanRT = useCallback(async () => {
    setIsSyncing(true);
    const pin = localStorage.getItem(`pin_warga_RT${activeRT}`) || sessionStorage.getItem(`pin_warga_RT${activeRT}`) || undefined;
    const res = await api.getLaporan(activeRT, selectedMonth, selectedYear, pin);
    setIsSyncing(false);

    if (res.ok && res.data) {
      setLaporanRT(res.data);
    } else {
      if (res.pinRequired && !session) {
        setUnlockedRTs((prev) => ({ ...prev, [activeRT]: false }));
      }
    }
  }, [activeRT, selectedMonth, selectedYear, session]);

  // 3. Load Laporan RW saat tab monitoring_rw aktif
  const loadLaporanRW = useCallback(async () => {
    if (!session || (session.peran !== 'ADMIN' && session.peran !== 'RW')) return;
    setIsSyncing(true);
    const res = await api.getLaporanRW(selectedMonth, selectedYear);
    setIsSyncing(false);
    if (res.ok && res.data) {
      setLaporanRW(res.data);
    }
  }, [session, selectedMonth, selectedYear]);

  useEffect(() => {
    if (currentTab === 'dashboard') {
      loadLaporanRT();
    } else if (currentTab === 'monitoring_rw') {
      loadLaporanRW();
    }
  }, [currentTab, activeRT, selectedMonth, selectedYear, loadLaporanRT, loadLaporanRW]);

  // Sync Data
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([loadLaporanRT(), loadLaporanRW(), api.getReferensi()]);
      showToast('Data kas berhasil disinkronkan');
    } catch (e: any) {
      showToast('Gagal menyinkronkan data: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Login handler
  const handleLoginSuccess = (sess: AuthSession) => {
    setSession(sess);
    sessionStorage.setItem('siperelek_session', JSON.stringify(sess));
    if (sess.rt_id && sess.rt_id !== 'ALL') {
      setActiveRT(sess.rt_id);
    }
    showToast(`Selamat datang, ${sess.nama} (${sess.peran})`);
  };

  // Logout handler
  const handleLogout = async () => {
    await api.logout();
    setSession(null);
    sessionStorage.removeItem('siperelek_session');
    setCurrentTab('dashboard');
    showToast('Berhasil keluar');
  };

  // Lock Citizen RT Access
  const handleLockRT = () => {
    localStorage.removeItem(`pin_warga_RT${activeRT}`);
    sessionStorage.removeItem(`pin_warga_RT${activeRT}`);
    setUnlockedRTs((prev) => ({ ...prev, [activeRT]: false }));
    showToast(`Akses kas RT ${activeRT} telah dikunci`);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Apakah warga perlu memasukkan PIN untuk RT ini?
  const isCitizenLocked = !session && !unlockedRTs[activeRT];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 text-white text-xs sm:text-sm font-semibold rounded-full shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-3">
          {toastMessage}
        </div>
      )}

      {/* Offline Connectivity Banner */}
      <OfflineIndicator />

      {/* Top Navbar (Sesuai image.png) */}
      <Navbar
        session={session}
        activeRT={activeRT}
        rtList={rtList}
        rwName={rwName}
        onSelectRT={(rt) => setActiveRT(rt)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        isPrivacy={isPrivacy}
        onTogglePrivacy={togglePrivacy}
        onSync={handleSync}
        isSyncing={isSyncing}
        onPrint={handlePrint}
        currentTab={currentTab}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {/* PWA In-App Banner on top of Dashboard */}
        <div className="hidden sm:block">
          <PWAInstallButton />
        </div>

        {/* View Switching */}
        {currentTab === 'dashboard' && (
          <DashboardRT
            laporan={laporanRT}
            activeRT={activeRT}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onChangeMonth={setSelectedMonth}
            onChangeYear={setSelectedYear}
            isPrivacy={isPrivacy}
            onTogglePrivacy={togglePrivacy}
            session={session}
            onOpenCreateTx={() => setIsCreateTxOpen(true)}
            onOpenEditTx={(tx) => setEditingTx(tx)}
            onOpenCancelTx={(tx) => setCancelingTx(tx)}
            onOpenSaldoAwal={() => setIsSaldoAwalOpen(true)}
            onOpenPinWarga={() => setIsPinWargaOpen(true)}
            onLockRT={handleLockRT}
            onPrint={handlePrint}
            referensi={referensi}
            onOpenUsers={() => setCurrentTab('users')}
            onOpenReferensi={() => setCurrentTab('referensi')}
            onOpenLogs={() => setCurrentTab('logs')}
            onOpenAccount={() => {
              if (session) {
                showToast(`Akun aktif: ${session.nama} (${session.peran})`);
              } else {
                setIsLoginOpen(true);
              }
            }}
            onOpenMonitoringRW={() => setCurrentTab('monitoring_rw')}
            onSync={handleSync}
            isSyncing={isSyncing}
          />
        )}

        {currentTab === 'monitoring_rw' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 mb-2"
            >
              ← Kembali ke Dashboard Kas RT
            </button>
            <MonitoringRW
              laporanRW={laporanRW}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onSelectRTForInspection={(rtId) => {
                setActiveRT(rtId);
                setCurrentTab('dashboard');
                showToast(`Melihat rincian kas RT ${rtId}`);
              }}
              isPrivacy={isPrivacy}
            />
          </div>
        )}

        {currentTab === 'users' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1 mb-2"
            >
              ← Kembali ke Menu Utama
            </button>
            <PanelPengguna rtList={rtList} currentUsername={session?.username || ''} />
          </div>
        )}

        {currentTab === 'referensi' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1 mb-2"
            >
              ← Kembali ke Menu Utama
            </button>
            <PanelReferensi />
          </div>
        )}

        {currentTab === 'logs' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1 mb-2"
            >
              ← Kembali ke Menu Utama
            </button>
            <PanelLogAktivitas />
          </div>
        )}
      </main>

      {/* Warga 6-Digit PIN Lock Screen */}
      {isCitizenLocked && (
        <WargaLockScreen
          rtList={rtList}
          selectedRT={activeRT}
          onSelectRT={(rt) => setActiveRT(rt)}
          onSuccess={(rt) => {
            setUnlockedRTs((prev) => ({ ...prev, [rt]: true }));
            loadLaporanRT();
            showToast(`Akses kas RT ${rt} dibuka!`);
          }}
          onOpenLogin={() => setIsLoginOpen(true)}
        />
      )}

      {/* Modals */}
      <ModalTransaksi
        isOpen={isCreateTxOpen || !!editingTx}
        onClose={() => {
          setIsCreateTxOpen(false);
          setEditingTx(null);
        }}
        activeRT={activeRT}
        transactionToEdit={editingTx}
        onSave={async (d) => {
          if (d.id) {
            const res = await api.updateTransaksi(d as any);
            if (!res.ok) throw new Error(res.error);
            showToast('Transaksi berhasil diperbarui');
          } else {
            const res = await api.addTransaksi(d);
            if (!res.ok) throw new Error(res.error);
            showToast('Transaksi baru berhasil dicatat');
          }
          loadLaporanRT();
        }}
        referensi={referensi}
        currentKas={laporanRT ? laporanRT.saldoKas : 0}
      />

      <ModalBatal
        isOpen={!!cancelingTx}
        onClose={() => setCancelingTx(null)}
        transaction={cancelingTx}
        activeRT={activeRT}
        onConfirmCancel={async (txId, rtId, alasan) => {
          const res = await api.batalkanTransaksi(txId, rtId, alasan);
          if (!res.ok) throw new Error(res.error);
          showToast(`Transaksi ${txId} berhasil dibatalkan`);
          loadLaporanRT();
        }}
      />

      <ModalSaldoAwal
        isOpen={isSaldoAwalOpen}
        onClose={() => setIsSaldoAwalOpen(false)}
        activeRT={activeRT}
        onSuccess={() => {
          showToast(`Saldo awal RT ${activeRT} diperbarui`);
          loadLaporanRT();
        }}
      />

      <ModalPinWarga
        isOpen={isPinWargaOpen}
        onClose={() => setIsPinWargaOpen(false)}
        activeRT={activeRT}
        onSuccess={(pin) => {
          showToast(`PIN Warga RT ${activeRT} diperbarui menjadi ${pin}`);
        }}
      />

      <ModalLogin
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer (Sesuai referensi image.png) */}
      <footer className="py-7 px-4 text-center text-xs text-slate-500 mt-12 bg-transparent">
        <div className="font-semibold text-slate-700 dark:text-slate-300">
          &copy; 2026 <strong className="text-emerald-700 dark:text-emerald-400">RahazaDigital</strong> · Hak Cipta Dilindungi
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">
          Aplikasi Kas SiPerelek RT {activeRT} / {rwName}
        </div>
      </footer>
    </div>
  );
}
