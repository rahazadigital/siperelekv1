import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Jika sudah terpasang sebagai aplikasi standalone, sembunyikan tombol
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (compact) {
      return (
        <button
          onClick={install}
          title="Pasang Aplikasi (PWA)"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition active:scale-95 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Pasang App</span>
        </button>
      );
    }

    return (
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3 sm:p-4 rounded-2xl shadow-md flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold leading-tight">Pasang Aplikasi SiPerelek</h4>
            <p className="text-xs text-emerald-100">Buka langsung dari layar utama HP Anda dengan cepat & tanpa browser.</p>
          </div>
        </div>
        <button
          onClick={install}
          className="px-4 py-2 bg-white text-emerald-800 text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-50 transition active:scale-95 shrink-0"
        >
          Pasang
        </button>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        {compact ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition active:scale-95"
          >
            <Share className="w-3.5 h-3.5" />
            <span>Pasang di iOS</span>
          </button>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 sm:p-4 rounded-2xl shadow-xs flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Share className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold leading-tight">Pasang di iPhone / iPad</h4>
                <p className="text-xs text-emerald-700">Simpan aplikasi kas RT/RW ke layar depan ponsel.</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-3.5 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-800 transition shrink-0"
            >
              Petunjuk
            </button>
          </div>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative text-slate-800">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Share className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Pasang di iPhone / iPad</h3>
                  <p className="text-xs text-slate-500">2 Langkah mudah menambahkan ke Home Screen</p>
                </div>
              </div>
              <ol className="mt-3 space-y-2.5 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700 bg-emerald-100 rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <span>Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah browser Safari Anda.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700 bg-emerald-100 rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <span>Gulir ke bawah dan ketuk menu <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.</span>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
