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
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-rose-50 via-white to-amber-50 border border-rose-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-lg shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pusat Deteksi Bentrok Operasional Toko
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Aturan Ritel: Toko tidak boleh mengirim &ge; 2 personil pada tanggal yang sama agar toko tidak kekurangan staf.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('store')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'store'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              Konflik Double Toko ({storeClashes.length})
            </button>
            <button
              onClick={() => setActiveTab('nik')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'nik'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              Bentrok NIK ({nikClashes.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'store' ? (
        storeClashes.length === 0 ? (
          <div className="bg-white border border-emerald-200 rounded-xl p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">Semua Toko Dalam Kondisi Aman!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tidak ada jadwal yang bentrok antar personil di toko yang sama pada tanggal yang identik.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List of Store Clashes */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Toko Bermasalah ({storeClashes.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {storeClashes.map((clash) => {
                  const isSelected = selectedClash?.kodeToko === clash.kodeToko && selectedClash?.tanggalAwal === clash.tanggalAwal;
                  return (
                    <div
                      key={`${clash.kodeToko}-${clash.tanggalAwal}`}
                      onClick={() => setSelectedClash(clash)}
                      className={`p-3.5 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-rose-50 border-l-4 border-rose-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-slate-500" />
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {clash.kodeToko}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {clash.cabang}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                          {clash.count} Personil
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          Detail Konflik Toko: {selectedClash.kodeToko}
                        </h3>
                        <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">
                          {selectedClash.count} personil terdaftar bersamaan
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tanggal: <strong>{selectedClash.tanggalAwal}</strong> · Cabang: <strong>{selectedClash.cabang}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Warning advice */}
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Rekomendasi Tindakan Operasional:</p>
                      <p className="mt-0.5">
                        Pindahkan salah satu peserta di bawah ini ke gelombang/tanggal lain agar toko {selectedClash.kodeToko} tidak kekurangan crew saat jam operasional.
                      </p>
                    </div>
                  </div>

                  {/* Participants list */}
                  <div className="mt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Personil Yang Terjadwal Pada Tanggal Tersebut:
                    </h4>

                    {selectedClash.participants.map((person, index) => (
                      <div
                        key={person.id}
                        className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="font-semibold text-slate-900 text-sm">
                              {person.nama}
                            </span>
                            <span className="font-mono text-xs text-slate-500">
                              (NIK: {person.nik})
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                            <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {person.jenisTraining}
                            </span>
                            <span>·</span>
                            <span>Metode: {person.keterangan || '-'}</span>
                            <span>·</span>
                            <span className="font-mono text-[11px] text-slate-400">
                              Key: {person.penggabungan}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEditRecord(person)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Ubah Jadwal
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
                  Pilih salah satu toko di samping untuk melihat rincian personil yang bentrok.
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        /* NIK Clash Tab */
        nikClashes.length === 0 ? (
          <div className="bg-white border border-emerald-200 rounded-xl p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">Tidak Ada Bentrok NIK Ganda!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tidak ada personil dengan NIK yang sama terjadwal di 2 training berbeda pada hari yang sama.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-xs">
            <div className="p-4 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Personil Dengan Jadwal Ganda Pada Hari Yang Sama ({nikClashes.length})
              </h3>
            </div>
            {nikClashes.map((clash) => (
              <div key={`${clash.nik}-${clash.tanggalAwal}`} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{clash.nama}</h4>
                    <p className="text-xs text-slate-500">
                      NIK: <span className="font-mono">{clash.nik}</span> · Tanggal: <strong>{clash.tanggalAwal}</strong>
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded">
                    Terdaftar {clash.count}x pada hari ini
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {clash.participants.map((p) => (
                    <div key={p.id} className="p-2.5 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{p.jenisTraining}</div>
                        <div className="text-slate-500">Toko: {p.kodeToko} ({p.cabang}) · {p.keterangan}</div>
                      </div>
                      <button
                        onClick={() => onEditRecord(p)}
                        className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
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
