import React, { useMemo } from 'react';
import { TrainingRecord, DashboardMetrics } from '../types/training';
import { Building2, BookOpen, Laptop, Radio, Award } from 'lucide-react';

interface BranchSummaryPanelProps {
  records: TrainingRecord[];
  metrics: DashboardMetrics;
  onFilterCabang: (cabang: string) => void;
  onFilterTraining: (training: string) => void;
}

export const BranchSummaryPanel: React.FC<BranchSummaryPanelProps> = ({
  records,
  metrics,
  onFilterCabang,
  onFilterTraining,
}) => {
  // Compute detailed branch stats
  const branchDetails = useMemo(() => {
    const map = new Map<string, { total: number; aman: number; doubleToko: number; stores: Set<string> }>();

    records.forEach(r => {
      const c = r.cabang || 'LAINNYA';
      if (!map.has(c)) {
        map.set(c, { total: 0, aman: 0, doubleToko: 0, stores: new Set() });
      }
      const entry = map.get(c)!;
      entry.total++;
      if (r.status === 'AMAN') entry.aman++;
      if (r.status === 'DOUBLE TOKO') entry.doubleToko++;
      if (r.kodeToko) entry.stores.add(r.kodeToko);
    });

    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [records]);

  // Compute detailed training type stats
  const trainingDetails = useMemo(() => {
    const map = new Map<string, { total: number; aman: number; doubleToko: number; branches: Set<string> }>();

    records.forEach(r => {
      const t = r.jenisTraining || 'LAINNYA';
      if (!map.has(t)) {
        map.set(t, { total: 0, aman: 0, doubleToko: 0, branches: new Set() });
      }
      const entry = map.get(t)!;
      entry.total++;
      if (r.status === 'AMAN') entry.aman++;
      if (r.status === 'DOUBLE TOKO') entry.doubleToko++;
      if (r.cabang) entry.branches.add(r.cabang);
    });

    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Branch Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Rekapitulasi Berdasarkan Cabang
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branchDetails.map(([cabang, data]) => {
            const doublePct = data.total > 0 ? Math.round((data.doubleToko / data.total) * 100) : 0;
            return (
              <div
                key={cabang}
                onClick={() => onFilterCabang(cabang)}
                className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-base text-slate-900">
                    Cabang {cabang}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {data.stores.size} Toko
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold font-mono text-slate-900">
                    {data.total}
                  </span>
                  <span className="text-xs text-slate-500">jadwal pelatihan</span>
                </div>

                <div className="space-y-1.5 text-xs pt-2 border-t border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Status Aman:</span>
                    <span className="font-semibold text-emerald-600 font-mono">{data.aman}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Kasus Double Toko:</span>
                    <span className={`font-semibold font-mono ${data.doubleToko > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {data.doubleToko} ({doublePct}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Program Training Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Distribusi Jenis Program Training
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">JENIS TRAINING</th>
                <th className="py-2.5 px-3 text-right">TOTAL PESERTA</th>
                <th className="py-2.5 px-3 text-right">STATUS AMAN</th>
                <th className="py-2.5 px-3 text-right">DOUBLE TOKO</th>
                <th className="py-2.5 px-3">CABANG TERKAIT</th>
                <th className="py-2.5 px-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trainingDetails.map(([training, data]) => (
                <tr key={training} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {training}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                    {data.total}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-medium">
                    {data.aman}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    {data.doubleToko}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {Array.from(data.branches).map(b => (
                        <span key={b} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                          {b}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onFilterTraining(training)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      Lihat Data
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
