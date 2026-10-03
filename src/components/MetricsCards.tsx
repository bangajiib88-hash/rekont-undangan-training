import React from 'react';
import { DashboardMetrics } from '../types/training';
import { Store, ShieldCheck, AlertCircle, Calendar, UserX } from 'lucide-react';

interface MetricsCardsProps {
  metrics: DashboardMetrics;
  onFilterStatus?: (status: string) => void;
  selectedStatusFilter?: string;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  metrics,
  onFilterStatus,
  selectedStatusFilter,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {/* 1. Total Jadwal (Aksen Biru Indomaret #005BAC) */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('ALL')}
        className={`bg-gradient-to-b from-blue-50/60 via-white to-white dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 border-t-4 border-t-[#005BAC] border-x border-b border-slate-200 dark:border-slate-800 rounded-xl p-3.5 transition-all cursor-pointer hover:shadow-md ${
          selectedStatusFilter === 'ALL' 
            ? 'ring-2 ring-[#005BAC] shadow-md' 
            : 'hover:border-blue-300 dark:hover:border-blue-700'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#005BAC] dark:text-blue-300 truncate">
            Total Jadwal
          </span>
          <div className="p-1.5 rounded-lg bg-[#005BAC] text-white shadow-2xs shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-50">
            {metrics.totalSchedules.toLocaleString('id-ID')}
          </span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">sesi</span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
          Mencakup <strong className="text-slate-900 dark:text-white font-bold">{metrics.totalPersonnel}</strong> personil di <strong className="text-slate-900 dark:text-white font-bold">{metrics.totalStores}</strong> toko
        </div>
      </div>

      {/* 2. Status Aman (Aksen Hijau Operasional) */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('AMAN')}
        className={`bg-gradient-to-b from-emerald-50/60 via-white to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border-t-4 border-t-emerald-500 border-x border-b border-slate-200 dark:border-slate-800 rounded-xl p-3.5 transition-all cursor-pointer hover:shadow-md ${
          selectedStatusFilter === 'AMAN' 
            ? 'ring-2 ring-emerald-500 shadow-md' 
            : 'hover:border-emerald-300 dark:hover:border-emerald-700'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 truncate">
            Status Aman
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
            {metrics.totalAman.toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
            ({metrics.totalSchedules > 0 ? Math.round((metrics.totalAman / metrics.totalSchedules) * 100) : 0}%)
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
          1 personil per toko, operasional toko lancar
        </div>
      </div>

      {/* 3. Double Toko (Aksen Merah Indomaret #E31B23) */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('DOUBLE TOKO')}
        className={`bg-gradient-to-b from-red-50/80 via-white to-white dark:from-red-950/35 dark:via-slate-900 dark:to-slate-900 border-t-4 border-t-[#E31B23] border-x border-b border-slate-200 dark:border-slate-800 rounded-xl p-3.5 transition-all cursor-pointer hover:shadow-md ${
          selectedStatusFilter === 'DOUBLE TOKO' 
            ? 'ring-2 ring-[#E31B23] shadow-md' 
            : 'hover:border-red-300 dark:hover:border-red-700'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#E31B23] dark:text-red-400 truncate">
            Double Toko
          </span>
          <div className="p-1.5 rounded-lg bg-[#E31B23] text-white shadow-2xs shrink-0">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold font-mono tabular-nums text-[#E31B23] dark:text-red-400">
            {metrics.totalDoubleToko.toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-[#E31B23] dark:text-red-300 font-bold">
            peserta
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-[#C01018] dark:text-red-300 font-semibold leading-tight">
          {metrics.affectedStoresCount} toko mengirim &ge; 2 orang sekaligus
        </div>
      </div>

      {/* 4. Double Berdasarkan NIK (Tanggal Sama) - Aksen Ungu/Magenta Alert */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('BENTROK NIK')}
        className={`bg-gradient-to-b from-purple-50/80 via-white to-white dark:from-purple-950/35 dark:via-slate-900 dark:to-slate-900 border-t-4 border-t-purple-600 dark:border-t-purple-500 border-x border-b border-slate-200 dark:border-slate-800 rounded-xl p-3.5 transition-all cursor-pointer hover:shadow-md ${
          selectedStatusFilter === 'BENTROK NIK' 
            ? 'ring-2 ring-purple-600 dark:ring-purple-500 shadow-md' 
            : 'hover:border-purple-300 dark:hover:border-purple-700'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-300 truncate">
            Double NIK (Tgl Sama)
          </span>
          <div className="p-1.5 rounded-lg bg-purple-600 dark:bg-purple-500 text-white shadow-2xs shrink-0">
            <UserX className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold font-mono tabular-nums text-purple-700 dark:text-purple-300">
            {metrics.totalBentrokNik.toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-purple-700 dark:text-purple-300 font-bold">
            peserta
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-purple-800 dark:text-purple-300 font-semibold leading-tight">
          {metrics.affectedNikCount} NIK terdaftar &gt; 1x di tanggal sama
        </div>
      </div>

      {/* 5. Total Toko Aktif (Aksen Kuning Indomaret #FFC72C) */}
      <div 
        className="col-span-2 sm:col-span-1 bg-gradient-to-b from-amber-50/80 via-white to-white dark:from-amber-950/35 dark:via-slate-900 dark:to-slate-900 border-t-4 border-t-[#FFC72C] border-x border-b border-slate-200 dark:border-slate-800 rounded-xl p-3.5 transition-all shadow-xs"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300 truncate">
            Total Toko Aktif
          </span>
          <div className="p-1.5 rounded-lg bg-[#FFC72C] text-slate-950 shadow-2xs shrink-0">
            <Store className="w-3.5 h-3.5 font-bold" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-50">
            {metrics.totalStores.toLocaleString('id-ID')}
          </span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">outlet</span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
          Dari seluruh cabang operasional
        </div>
      </div>
    </div>
  );
};
