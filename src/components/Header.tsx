import React from 'react';
import { Plus, Upload, Database, AlertTriangle } from 'lucide-react';
import { DashboardMetrics } from '../types/training';

interface HeaderProps {
  metrics: DashboardMetrics;
  onOpenAddModal: () => void;
  onOpenImportExport: () => void;
  onOpenSupabaseModal: () => void;
  onResetData: () => void;
  activeTab: 'jadwal' | 'bentrok' | 'kalender' | 'rekap';
  setActiveTab: (tab: 'jadwal' | 'bentrok' | 'kalender' | 'rekap') => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  onOpenAddModal,
  onOpenImportExport,
  onOpenSupabaseModal,
  onResetData,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Wordmark Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              ST
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                Validasi Training Toko
              </h1>
              <p className="text-xs text-slate-500 font-normal">
                Sistem Deteksi Double Toko &amp; Jadwal Pelatihan Retail
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('jadwal')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'jadwal'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Jadwal ({metrics.totalSchedules})
            </button>
            <button
              onClick={() => setActiveTab('bentrok')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'bentrok'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              {metrics.totalDoubleToko > 0 ? (
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
              ) : null}
              Kasus Double Toko ({metrics.affectedStoresCount} Toko)
            </button>
            <button
              onClick={() => setActiveTab('kalender')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'kalender'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kalender Pelatihan
            </button>
            <button
              onClick={() => setActiveTab('rekap')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'rekap'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rekapitulasi Cabang
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2">
            {/* Supabase Cloud Button */}
            <button
              onClick={onOpenSupabaseModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors shadow-xs"
              title="Buka status koneksi Supabase & SQL Editor"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase Cloud</span>
            </button>

            <button
              onClick={onOpenImportExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              title="Import file Excel / CSV atau Export"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline">Excel/CSV</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Jadwal</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-slate-100 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('jadwal')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'jadwal' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Jadwal ({metrics.totalSchedules})
          </button>
          <button
            onClick={() => setActiveTab('bentrok')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'bentrok' ? 'bg-rose-50 text-rose-700' : 'text-slate-600'
            }`}
          >
            Double Toko ({metrics.affectedStoresCount})
          </button>
          <button
            onClick={() => setActiveTab('kalender')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'kalender' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Kalender
          </button>
          <button
            onClick={() => setActiveTab('rekap')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'rekap' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Rekap
          </button>
        </div>
      </div>
    </header>
  );
};
