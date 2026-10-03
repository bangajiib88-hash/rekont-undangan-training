import React from 'react';
import { Plus, Upload, Database, RefreshCw, Sun, Moon, Users, Shield, Building2, LogOut } from 'lucide-react';
import { DashboardMetrics } from '../types/training';
import { AppUser } from '../types/auth';

interface HeaderProps {
  metrics: DashboardMetrics;
  onOpenAddModal: () => void;
  onOpenImportExport: () => void;
  onOpenSupabaseModal: () => void;
  onResetData: () => void;
  activeTab: 'jadwal' | 'rekap';
  setActiveTab: (tab: 'jadwal' | 'rekap') => void;
  onSyncCloud?: () => void;
  isCloudSyncing?: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentUser: AppUser | null;
  onLogout: () => void;
  onOpenUserManagement: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  onOpenAddModal,
  onOpenImportExport,
  onOpenSupabaseModal,
  onResetData,
  activeTab,
  setActiveTab,
  onSyncCloud,
  isCloudSyncing = false,
  theme,
  onToggleTheme,
  currentUser,
  onLogout,
  onOpenUserManagement,
}) => {
  const isPusat = currentUser?.role === 'PUSAT';

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      {/* Indomaret Authentic Tri-Color Stripe (Biru, Merah, Kuning) */}
      <div className="h-1.5 w-full indomaret-stripe" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Zone 1: Wordmark Brand with Indomaret Emblem */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs overflow-hidden h-10 w-24 shrink-0">
              <img 
                src="/indomaret.svg" 
                alt="Logo Indomaret" 
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', 'https://upload.wikimedia.org/wikipedia/commons/4/44/Indomaret.svg');
                }}
              />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
                  Validasi Training Toko
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                {isPusat 
                  ? 'Akses Nasional (Admin Pusat - Semua Cabang)' 
                  : `Akses Terisolasi: Admin Cabang ${currentUser?.cabang || 'SBY'}`}
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('jadwal')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'jadwal'
                  ? 'bg-white dark:bg-slate-900 text-[#005BAC] dark:text-blue-400 shadow-xs border-b-2 border-[#005BAC]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Jadwal ({metrics.totalSchedules})
            </button>
            <button
              onClick={() => setActiveTab('rekap')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'rekap'
                  ? 'bg-white dark:bg-slate-900 text-[#005BAC] dark:text-blue-400 shadow-xs border-b-2 border-[#005BAC]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Rekap Cabang
            </button>
          </nav>

          {/* Zone 3: Actions, User Role Badge & Theme Toggle */}
          <div className="flex items-center gap-2">
            {/* User Account & Role Indicator */}
            <div className="flex items-center gap-1">
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold shadow-xs ${
                  isPusat
                    ? 'bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200'
                    : 'bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800 text-[#005BAC] dark:text-blue-200'
                }`}
              >
                {isPusat ? (
                  <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-[#005BAC] dark:text-blue-400" />
                )}
                <span className="hidden sm:inline font-bold">
                  {isPusat ? 'Admin Pusat' : `Cabang ${currentUser?.cabang || 'SBY'}`}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal hidden md:inline">
                  ({currentUser?.username})
                </span>
              </div>

              {/* Admin Pusat: Manage Users Button */}
              {isPusat && (
                <button
                  type="button"
                  onClick={onOpenUserManagement}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-xs"
                  title="Tambah & kelola user cabang baru"
                >
                  <Users className="w-3.5 h-3.5 text-[#005BAC] dark:text-blue-400" />
                  <span className="hidden xl:inline">Tambah/Kelola User</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-xs"
                title="Keluar dari akun dan kembali ke halaman login"
              >
                <LogOut className="w-3.5 h-3.5 text-[#E31B23] dark:text-red-400" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>

            {/* Theme Toggle Button (Terang / Gelap) */}
            <button
              type="button"
              onClick={onToggleTheme}
              className={`inline-flex items-center gap-1.5 p-2 rounded-lg border font-bold text-xs transition-all shadow-xs ${
                theme === 'dark'
                  ? 'bg-slate-800 border-amber-500/50 text-amber-300 hover:bg-slate-700 hover:border-amber-400'
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 hover:border-slate-400'
              }`}
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-700 fill-indigo-700/20" />
              )}
            </button>

            {/* Supabase Cloud Button */}
            <button
              onClick={onOpenSupabaseModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-xs"
              title="Buka status koneksi Supabase & SQL Editor"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Supabase</span>
            </button>

            {/* Quick Cloud Sync Button */}
            {onSyncCloud && (
              <button
                type="button"
                onClick={onSyncCloud}
                disabled={isCloudSyncing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-[#005BAC] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shadow-xs disabled:opacity-50"
                title="Tarik & sinkronkan data terbaru dari database Supabase Cloud"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#005BAC] dark:text-blue-400 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isCloudSyncing ? 'Sinkron...' : 'Tarik Cloud'}</span>
              </button>
            )}

            <button
              onClick={onOpenImportExport}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
              title="Import file Excel / CSV atau Export"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span className="hidden lg:inline">Excel/CSV</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#005BAC] hover:bg-[#004785] rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tambah Jadwal</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs & Theme Bar */}
        <div className="lg:hidden flex items-center justify-between py-2 border-t border-slate-200 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('jadwal')}
              className={`px-3 py-1 text-xs font-bold rounded-lg whitespace-nowrap ${
                activeTab === 'jadwal' 
                  ? 'bg-blue-100 dark:bg-blue-950/80 text-[#005BAC] dark:text-blue-300 border border-blue-300 dark:border-blue-700' 
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              Jadwal ({metrics.totalSchedules})
            </button>
            <button
              onClick={() => setActiveTab('rekap')}
              className={`px-3 py-1 text-xs font-bold rounded-lg whitespace-nowrap ${
                activeTab === 'rekap' 
                  ? 'bg-blue-100 dark:bg-blue-950/80 text-[#005BAC] dark:text-blue-300 border border-blue-300 dark:border-blue-700' 
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              Rekap Cabang
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isPusat && (
              <button
                type="button"
                onClick={onOpenUserManagement}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[#005BAC] dark:text-blue-400 text-xs"
                title="Kelola User Cabang"
              >
                <Users className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-[#E31B23] dark:text-red-400 text-xs font-bold flex items-center gap-1"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
