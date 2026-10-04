import React, { useState, useEffect } from 'react';
import { ShieldCheck, Delete, ArrowRight, UserCheck, MessageSquare } from 'lucide-react';
import { UnitRT } from '../../types';
import { api } from '../../services/api';

interface WargaLockScreenProps {
  rtList: UnitRT[];
  selectedRT: string;
  onSelectRT: (rtId: string) => void;
  onSuccess: (rtId: string) => void;
  onOpenLogin: () => void;
  adminWa?: string;
}

export const WargaLockScreen: React.FC<WargaLockScreenProps> = ({
  rtList,
  selectedRT,
  onSelectRT,
  onSuccess,
  onOpenLogin,
  adminWa = '6281911934000'
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [rememberPin, setRememberPin] = useState(true);
  const [shake, setShake] = useState(false);

  // Periksa apakah sudah ada PIN tersimpan untuk RT ini
  useEffect(() => {
    const saved = localStorage.getItem(`pin_warga_RT${selectedRT}`);
    if (saved && saved.length === 6) {
      // Auto verify
      autoVerifySavedPin(selectedRT, saved);
    } else {
      setPin('');
      setErrorMsg('');
    }
  }, [selectedRT]);

  const autoVerifySavedPin = async (rtId: string, savedPin: string) => {
    setIsVerifying(true);
    const res = await api.verifyPinWarga(rtId, savedPin);
    setIsVerifying(false);
    if (res.ok) {
      onSuccess(rtId);
    } else {
      localStorage.removeItem(`pin_warga_RT${rtId}`);
      setPin('');
    }
  };

  const handleKeyPress = (digit: string) => {
    if (isVerifying || pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg('');

    if (newPin.length === 6) {
      submitPin(newPin);
    }
  };

  const handleBackspace = () => {
    if (isVerifying || pin.length === 0) return;
    setPin(pin.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    if (isVerifying) return;
    setPin('');
    setErrorMsg('');
  };

  const submitPin = async (enteredPin: string) => {
    setIsVerifying(true);
    setErrorMsg('Memverifikasi PIN lingkungan...');

    try {
      const res = await api.verifyPinWarga(selectedRT, enteredPin);
      setIsVerifying(false);

      if (res.ok) {
        if (rememberPin) {
          localStorage.setItem(`pin_warga_RT${selectedRT}`, enteredPin);
        } else {
          sessionStorage.setItem(`pin_warga_RT${selectedRT}`, enteredPin);
        }
        setErrorMsg('✓ PIN Benar! Membuka data kas...');
        setTimeout(() => {
          onSuccess(selectedRT);
        }, 300);
      } else {
        triggerError(res.error || `PIN Akses Warga RT ${selectedRT} salah`);
      }
    } catch (e: any) {
      setIsVerifying(false);
      triggerError(e.message || 'Gagal memverifikasi PIN');
    }
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setTimeout(() => setPin(''), 600);
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isVerifying]);

  const waLink = `https://wa.me/${adminWa}?text=${encodeURIComponent(
    `Halo Pengurus RT ${selectedRT}, saya warga ingin menanyakan PIN akses aplikasi kas SiPerelek.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4 overflow-y-auto">
      <div
        className={`w-full max-w-sm rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-6 sm:p-7 shadow-2xl border border-white/20 dark:border-slate-800 text-center relative transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* App Logo */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-sky-500 mx-auto mb-3 shadow-lg p-1 flex items-center justify-center">
          <img
            src="/icon.svg"
            alt="Logo RT RW"
            className="w-full h-full object-contain rounded-xl p-1"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Security Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold mb-2 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Akses Warga Lingkungan</span>
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          SiPerelek Multi-RT
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          Pilih RT & masukkan 6 digit PIN untuk melihat laporan kas warga
        </p>

        {/* RT Unit Selector */}
        <div className="mb-4 text-left">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 text-center">
            Pilih Rukun Tetangga (RT)
          </label>
          <div className="relative">
            <select
              value={selectedRT}
              onChange={(e) => onSelectRT(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
            >
              {rtList.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 6-Digit PIN Indicators */}
        <div className="flex justify-center gap-3 my-4">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-600 border-emerald-600 scale-125 shadow-sm shadow-emerald-500/50'
                    : 'bg-transparent border-slate-300 dark:border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {/* Feedback Message */}
        <div
          className={`min-h-[20px] text-xs font-semibold mb-3 ${
            errorMsg.startsWith('✓')
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {errorMsg || (isVerifying ? 'Memverifikasi...' : '')}
        </div>

        {/* Numeric Touch Keypad */}
        <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto mb-4 select-none">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-white font-bold text-lg border border-slate-200/80 dark:border-slate-700/80 active:scale-95 transition shadow-2xs flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 font-semibold text-xs active:scale-95 transition flex items-center justify-center"
          >
            Hapus
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-800 dark:text-white font-bold text-lg border border-slate-200/80 dark:border-slate-700/80 active:scale-95 transition flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Hapus satu angka"
            className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 active:scale-95 transition flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Remember PIN toggle */}
        <div className="flex items-center justify-center gap-2 mb-5 text-xs text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            id="rememberPin"
            checked={rememberPin}
            onChange={(e) => setRememberPin(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
          />
          <label htmlFor="rememberPin" className="cursor-pointer select-none">
            Ingat PIN RT ini di browser ini
          </label>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            type="button"
            onClick={onOpenLogin}
            className="w-full py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Masuk sebagai Pengurus RT / RW / Admin</span>
          </button>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-98"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Tanya PIN ke Pengurus RT (WhatsApp)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
