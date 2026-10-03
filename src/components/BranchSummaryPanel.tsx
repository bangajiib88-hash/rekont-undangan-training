import React, { useMemo } from 'react';
import { TrainingRecord, DashboardMetrics, SheetDefinition, SHEET_LIST } from '../types/training';
import { Building2, BookOpen, ArrowRight, ExternalLink } from 'lucide-react';
import { mapTrainingToSheetCode } from '../utils/trainingUtils';

interface BranchSummaryPanelProps {
  records: TrainingRecord[];
  metrics: DashboardMetrics;
  onFilterCabang: (cabang: string) => void;
  onFilterTraining: (sheetCode: string, trainingName: string) => void;
  sheetList?: SheetDefinition[];
}

export const BranchSummaryPanel: React.FC<BranchSummaryPanelProps> = ({
  records,
  metrics,
  onFilterCabang,
  onFilterTraining,
  sheetList = SHEET_LIST,
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

  // Compute detailed training type stats with corresponding Sheet Code
  const trainingDetails = useMemo(() => {
    const map = new Map<string, { 
      total: number; 
      aman: number; 
      doubleToko: number; 
      branches: Set<string>; 
      sheetCode: string;
      sheetName: string;
    }>();

    records.forEach(r => {
      const t = r.jenisTraining || 'LAINNYA';
      const resolvedCode = r.sheetCode || mapTrainingToSheetCode(t);
      const sheetDef = sheetList.find(s => s.code === resolvedCode);
      const sheetDisplayName = sheetDef?.name || resolvedCode;

      if (!map.has(t)) {
        map.set(t, { 
          total: 0, 
          aman: 0, 
          doubleToko: 0, 
          branches: new Set(),
          sheetCode: resolvedCode,
          sheetName: sheetDisplayName,
        });
      }
      const entry = map.get(t)!;
      entry.total++;
      if (r.status === 'AMAN') entry.aman++;
      if (r.status === 'DOUBLE TOKO') entry.doubleToko++;
      if (r.cabang) entry.branches.add(r.cabang);
    });

    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [records, sheetList]);

  return (
    <div className="space-y-6">
      {/* Branch Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-[#005BAC] dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider">
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
                className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/60 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-[#005BAC] dark:hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer group"
                title={`Klik untuk melihat seluruh jadwal Cabang ${cabang}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-[#005BAC] dark:group-hover:text-blue-400 transition-colors">
                    Cabang {cabang}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded">
                    {data.stores.size} Toko
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-50">
                    {data.total}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">jadwal training</span>
                </div>

                <div className="space-y-1.5 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Status Aman:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{data.aman}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Kasus Double Toko:</span>
                    <span className={`font-semibold font-mono ${data.doubleToko > 0 ? 'text-[#E31B23] dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#005BAC] dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider">
              Distribusi Jenis Program Training
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Klik <strong>"Lihat Data"</strong> untuk langsung membuka sheet training yang dituju
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">JENIS TRAINING</th>
                <th className="py-2.5 px-3">TARGET SHEET</th>
                <th className="py-2.5 px-3 text-right">TOTAL PESERTA</th>
                <th className="py-2.5 px-3 text-right">STATUS AMAN</th>
                <th className="py-2.5 px-3 text-right">DOUBLE TOKO</th>
                <th className="py-2.5 px-3">CABANG TERKAIT</th>
                <th className="py-2.5 px-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trainingDetails.map(([training, data]) => (
                <tr key={training} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                    {training}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/80 text-[#005BAC] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Sheet {data.sheetCode}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    {data.total}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {data.aman}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#E31B23] dark:text-red-400">
                    {data.doubleToko}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {Array.from(data.branches).map(b => (
                        <span key={b} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                          {b}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onFilterTraining(data.sheetCode, training)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#005BAC] hover:bg-[#004785] active:scale-95 rounded-lg shadow-2xs transition-all cursor-pointer"
                      title={`Buka Sheet ${data.sheetCode} (${training})`}
                    >
                      <span>Lihat Data</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
