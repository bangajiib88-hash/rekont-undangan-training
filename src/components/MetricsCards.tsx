import React from 'react';
import { DashboardMetrics } from '../types/training';
import { Users, Store, ShieldCheck, AlertCircle, Calendar } from 'lucide-react';

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Jadwal */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('ALL')}
        className={`bg-white border rounded-xl p-4 transition-all cursor-pointer hover:border-slate-400 ${
          selectedStatusFilter === 'ALL' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Jadwal</span>
          <Calendar className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {metrics.totalSchedules.toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-slate-500">sesi training</span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Mencakup {metrics.totalPersonnel} personil di {metrics.totalStores} toko
        </div>
      </div>

      {/* Status Aman */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('AMAN')}
        className={`bg-white border rounded-xl p-4 transition-all cursor-pointer hover:border-emerald-400 ${
          selectedStatusFilter === 'AMAN' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">Status Aman</span>
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
            {metrics.totalAman.toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-emerald-700 font-medium">
            ({metrics.totalSchedules > 0 ? Math.round((metrics.totalAman / metrics.totalSchedules) * 100) : 0}%)
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          1 personil per toko, operasional toko lancar
        </div>
      </div>

      {/* Konflik Double Toko */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('DOUBLE TOKO')}
        className={`bg-white border rounded-xl p-4 transition-all cursor-pointer hover:border-rose-400 ${
          selectedStatusFilter === 'DOUBLE TOKO' ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-200'
        } ${metrics.totalDoubleToko > 0 ? 'bg-rose-50/40' : ''}`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-rose-700">Konflik Double Toko</span>
          <AlertCircle className="w-4 h-4 text-rose-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-rose-600">
            {metrics.totalDoubleToko.toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-rose-700 font-medium">peserta bentrok</span>
        </div>
        <div className="mt-2 text-xs text-rose-600 font-medium">
          {metrics.affectedStoresCount} toko mengirim &ge; 2 orang sekaligus
        </div>
      </div>

      {/* Bentrok NIK & Toko Unik */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('BENTROK NIK')}
        className={`bg-white border rounded-xl p-4 transition-all cursor-pointer hover:border-amber-400 ${
          selectedStatusFilter === 'BENTROK NIK' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-700">Total Toko Aktif</span>
          <Store className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {metrics.totalStores.toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-slate-500">toko ritel</span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {metrics.totalBentrokNik > 0 ? (
            <span className="text-amber-600 font-medium">Ada {metrics.totalBentrokNik} bentrok NIK ganda</span>
          ) : (
            'Tidak ada bentrok NIK ganda di hari sama'
          )}
        </div>
      </div>
    </div>
  );
};
