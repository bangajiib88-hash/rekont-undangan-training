import React, { useState, useMemo } from 'react';
import { TrainingRecord } from '../types/training';
import { Calendar as CalendarIcon, Store, AlertTriangle, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { parseDate } from '../utils/trainingUtils';

interface CalendarViewProps {
  records: TrainingRecord[];
  onSelectStore: (storeCode: string) => void;
  onEditRecord: (record: TrainingRecord) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  records,
  onSelectStore,
  onEditRecord,
}) => {
  // Group records by Date
  const dateGroups = useMemo(() => {
    const map = new Map<string, { date: Date | null; records: TrainingRecord[]; doubleTokoCount: number }>();

    records.forEach(r => {
      const dateKey = r.tanggalAwal;
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          date: parseDate(dateKey),
          records: [],
          doubleTokoCount: 0,
        });
      }
      const entry = map.get(dateKey)!;
      entry.records.push(r);
      if (r.status === 'DOUBLE TOKO') {
        entry.doubleTokoCount++;
      }
    });

    return Array.from(map.entries()).sort((a, b) => {
      const timeA = a[1].date?.getTime() || 0;
      const timeB = b[1].date?.getTime() || 0;
      return timeA - timeB;
    });
  }, [records]);

  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    dateGroups.length > 0 ? dateGroups[0][0] : ''
  );

  const activeGroup = useMemo(() => {
    return dateGroups.find(([key]) => key === selectedDateKey)?.[1] || null;
  }, [dateGroups, selectedDateKey]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Date selector cards */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors">
        <div className="h-1 w-full indomaret-stripe" />
        <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#005BAC] text-white">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Tanggal Training ({dateGroups.length})
            </h3>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[620px] overflow-y-auto">
          {dateGroups.map(([dateKey, group]) => {
            const isSelected = selectedDateKey === dateKey;
            return (
              <div
                key={dateKey}
                onClick={() => setSelectedDateKey(dateKey)}
                className={`p-3.5 cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-l-[#005BAC]' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{dateKey}</span>
                  <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    {group.records.length} peserta
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  {group.doubleTokoCount > 0 ? (
                    <span className="text-[#E31B23] dark:text-red-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {group.doubleTokoCount} konflik toko
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Aman (tanpa bentrok)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Detail View */}
      <div className="lg:col-span-2 space-y-4">
        {activeGroup ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  Jadwal Training: {selectedDateKey}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Total {activeGroup.records.length} peserta training terjadwal pada hari ini.
                </p>
              </div>

              {activeGroup.doubleTokoCount > 0 && (
                <div className="text-xs font-bold bg-rose-100 dark:bg-red-950/80 text-[#E31B23] dark:text-red-300 border border-rose-200 dark:border-rose-900 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#E31B23] dark:text-red-400" />
                  {activeGroup.doubleTokoCount} Terkena Double Toko
                </div>
              )}
            </div>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
              {activeGroup.records.map((r, i) => (
                <div
                  key={r.id}
                  className={`py-3 px-2 flex items-center justify-between transition-colors ${
                    r.status === 'DOUBLE TOKO' 
                      ? 'bg-rose-50/50 dark:bg-rose-950/30 rounded-lg px-3' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500 w-5">
                      {i + 1}.
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {r.nama}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          ({r.nik})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Toko:</span>
                        <button
                          onClick={() => onSelectStore(r.kodeToko)}
                          className="font-mono font-bold text-[#005BAC] dark:text-blue-400 hover:underline"
                        >
                          {r.kodeToko} ({r.cabang})
                        </button>
                        <span>·</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{r.jenisTraining}</span>
                        <span>·</span>
                        <span className="text-slate-500 dark:text-slate-400">{r.keterangan || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {r.status === 'DOUBLE TOKO' ? (
                      <span className="text-xs font-bold text-[#E31B23] dark:text-red-300 bg-rose-100 dark:bg-red-950/80 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded">
                        Double Toko ({r.berdasarkanKodeToko})
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Aman
                      </span>
                    )}
                    <button
                      onClick={() => onEditRecord(r)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500 dark:text-slate-400 transition-colors">
            Pilih tanggal di sebelah kiri untuk melihat jadwal lengkap.
          </div>
        )}
      </div>
    </div>
  );
};
