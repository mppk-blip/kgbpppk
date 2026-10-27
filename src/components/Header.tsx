import React from 'react';
import { User } from 'firebase/auth';
import { FileSpreadsheet, HardDrive, RefreshCw, FileText, Settings, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  onOpenSheetsConfig: () => void;
  onOpenTemplateEditor: () => void;
  isSyncing: boolean;
  onSync: () => void;
  spreadsheetTitle?: string;
  hasUnsavedChanges: boolean;
  onSaveAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  onOpenSheetsConfig,
  onOpenTemplateEditor,
  isSyncing,
  onSync,
  spreadsheetTitle,
  hasUnsavedChanges,
  onSaveAll
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30">
              <span className="text-xl font-black text-slate-950 tracking-tighter">SK</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  KGB Online
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Perpres 11/2024
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  DB KGB &bull; TEMPLATE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dashboard Interaktif & Cetak Surat Keputusan Kenaikan Gaji Berkala
              </p>
            </div>
          </div>

          {/* Action Tools & User Auth */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Google Sheets Status / Config */}
            <button
              onClick={onOpenSheetsConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm"
              title="Konfigurasi Sumber Data Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="max-w-[130px] truncate">
                {spreadsheetTitle || 'Hubungkan Sheets'}
              </span>
            </button>

            {/* Refresh / Sync */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
              title="Sinkronisasi Data Google Sheets Real-time"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sinkron</span>
            </button>

            {/* Menu Format SK (Google Docs & Bawaan) */}
            <button
              onClick={onOpenTemplateEditor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition shadow-sm ring-1 ring-amber-500/20"
              title="Menu Format SK: Hubungkan Google Docs Template atau Kustomisasi Template"
            >
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Format SK</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-semibold bg-amber-500/30 text-amber-200 rounded">
                Google Docs
              </span>
            </button>

            {/* Save All Changes Button */}
            <button
              onClick={onSaveAll}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
                hasUnsavedChanges
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{hasUnsavedChanges ? 'Simpan Perubahan *' : 'Tersimpan'}</span>
            </button>

            {/* Google Authentication */}
            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

            {user ? (
              <div className="flex items-center gap-2 pl-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full ring-2 ring-emerald-500/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-medium text-slate-200 leading-tight truncate max-w-[120px]">
                    {user.displayName || 'Akun Google'}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Drive & Sheets Aktif
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                  title="Keluar Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 shadow transition disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoggingIn ? 'Menghubungkan...' : 'Login Google'}</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
