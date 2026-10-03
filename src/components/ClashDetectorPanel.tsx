import React, { useState } from 'react';
import { TrainingRecord, StoreClashGroup, NikClashGroup } from '../types/training';
import { AlertTriangle, Store, Calendar, ArrowRight, CheckCircle2, User, ChevronRight, RefreshCw, Sparkles } from 'lucide-react';

interface ClashDetectorPanelProps {
  storeClashes: StoreClashGroup[];
  nikClashes: NikClashGroup[];
  allRecords: TrainingRecord[];
  onEditRecord: (record: TrainingRecord) => void;
  onQuickReschedule: (recordId: string, newDate: string) => void;
}

export const ClashDetectorPanel: React.FC<ClashDetectorPanelProps> = ({
  storeClashes,
  nikClashes,
  allRecords,
  onEditRecord,
  onQuickReschedule,
}) => {
  const [activeTab, setActiveTab] = useState<'store' | 'nik'>('store');
  const [selectedClash, setSelectedClash] = useState<StoreClashGroup | null>(storeClashes[0] || null);

  return (
    <div className="space-y-6">
      {/* Overview Banner with Indomaret Red Accent */}
      <div className="bg-gradient-to-r from-rose-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#E31B23] text-white rounded-xl shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Pusat Deteksi Bentrok Operasional Toko
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Aturan Ritel: Toko tidak boleh mengirim &ge; 2 personil pada tanggal yang sama agar toko tidak kekurangan staf.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('store')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'store'
                  ? 'bg-[#E31B23] text-white shadow-sm ring-1 ring-red-400'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Konflik Double Toko ({storeClashes.length})
            </button>
            <button
              onClick={() => setActiveTab('nik')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'nik'
                  ? 'bg-[#FFC72C] text-slate-950 shadow-sm ring-1 ring-amber-500'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Bentrok NIK ({nikClashes.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'store' ? (
        storeClashes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-12 text-center transition-colors">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Semua Toko Dalam Kondisi Aman!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Tidak ada jadwal yang bentrok antar personil di toko yang sama pada tanggal yang identik.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List of Store Clashes */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Daftar Toko Bermasalah ({storeClashes.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                {storeClashes.map((clash) => {
                  const isSelected = selectedClash?.kodeToko === clash.kodeToko && selectedClash?.tanggalAwal === clash.tanggalAwal;
                  return (
                    <div
                      key={`${clash.kodeToko}-${clash.tanggalAwal}`}
                      onClick={() => setSelectedClash(clash)}
                      className={`p-3.5 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-l-4 border-l-[#E31B23]'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                            {clash.kodeToko}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {clash.cabang}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#E31B23] dark:text-red-300 bg-rose-100 dark:bg-red-950/80 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                          {clash.count} Personil
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{clash.tanggalAwal}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clash Details & Quick Fix Panel */}
            <div className="lg:col-span-2 space-y-4">
              {selectedClash ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                          Detail Konflik Toko: {selectedClash.kodeToko}
                        </h3>
                        <span className="text-xs bg-rose-100 dark:bg-red-950/80 text-[#E31B23] dark:text-red-300 font-bold px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                          {selectedClash.count} personil terdaftar bersamaan
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tanggal: <strong className="text-slate-700 dark:text-slate-200">{selectedClash.tanggalAwal}</strong> · Cabang: <strong className="text-slate-700 dark:text-slate-200">{selectedClash.cabang}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Warning advice */}
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Rekomendasi Tindakan Operasional:</p>
                      <p className="mt-0.5 leading-relaxed">
                        Pindahkan salah satu peserta di bawah ini ke gelombang/tanggal lain agar toko {selectedClash.kodeToko} tidak kekurangan crew saat jam operasional.
                      </p>
                    </div>
                  </div>

                  {/* Participants list */}
                  <div className="mt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Personil Yang Terjadwal Pada Tanggal Tersebut:
                    </h4>

                    {selectedClash.participants.map((person, index) => (
                      <div
                        key={person.id}
                        className="p-3.5 border border-slate-200 dark:border-slate-700/80 rounded-lg bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {person.nama}
                            </span>
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                              (NIK: {person.nik})
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-[#005BAC] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded">
                              {person.jenisTraining}
                            </span>
                            <span>·</span>
                            <span>{person.jabatan || 'Crew Toko'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditRecord(person)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#005BAC] dark:text-blue-300 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors shadow-xs"
                          >
                            Ubah Jadwal
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )
      ) : (
        /* NIK Clash Tab */
        nikClashes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-12 text-center transition-colors">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Tidak Ada Bentrok NIK!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Tidak ada personil yang terdaftar pada lebih dari satu training pada tanggal yang sama.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {nikClashes.map((group) => (
              <div
                key={`${group.nik}-${group.tanggalAwal}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {group.nama}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      (NIK: {group.nik})
                    </span>
                    <span className="text-xs bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded">
                      {group.count} Jadwal Bersamaan
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Tanggal: <strong className="text-slate-700 dark:text-slate-200">{group.tanggalAwal}</strong>
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.participants.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{r.jenisTraining}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          Toko: {r.kodeToko} · Batch: {r.batch || 'Batch 1'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onEditRecord(r)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#005BAC] dark:text-blue-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-600"
                      >
                        Atur
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
