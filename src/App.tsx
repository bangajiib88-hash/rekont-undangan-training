import React, { useState, useEffect, useMemo } from 'react';
import { TrainingRecord, RawTrainingInput } from './types/training';
import { loadDefaultRecords } from './data/fullDataset';
import { 
  validateAndEnrichRecords, 
  getStoreClashes, 
  getNikClashes, 
  calculateMetrics,
  mapTrainingToSheetCode 
} from './utils/trainingUtils';
import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { ScheduleTable } from './components/ScheduleTable';
import { ClashDetectorPanel } from './components/ClashDetectorPanel';
import { CalendarView } from './components/CalendarView';
import { BranchSummaryPanel } from './components/BranchSummaryPanel';
import { AddEditRecordModal } from './components/AddEditRecordModal';
import { ImportExportModal } from './components/ImportExportModal';
import { SupabaseModal } from './components/SupabaseModal';
import { ConfirmModal } from './components/ConfirmModal';
import { 
  checkSupabaseStatus, 
  fetchSchedulesFromSupabase, 
  saveRecordToSupabase, 
  deleteRecordFromSupabase,
  deleteAllRecordsFromSupabase,
  syncAllRecordsToSupabase
} from './services/supabaseService';
import { Database, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'store_training_records_v2';

export default function App() {
  const [records, setRecords] = useState<TrainingRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return validateAndEnrichRecords(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load from storage:', e);
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'jadwal' | 'bentrok' | 'kalender' | 'rekap'>('jadwal');
  const [selectedSheet, setSelectedSheet] = useState<string>('MASTER');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<TrainingRecord | null>(null);

  // Custom Delete Confirmations
  const [recordToDelete, setRecordToDelete] = useState<TrainingRecord | null>(null);
  const [bulkIdsToDelete, setBulkIdsToDelete] = useState<string[] | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Cloud status
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [supabaseTableExists, setSupabaseTableExists] = useState<boolean>(false);

  // Toast helper
  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to persist to storage:', e);
    }
  }, [records]);

  // Initial Supabase check & auto-pull if table is populated
  useEffect(() => {
    async function checkCloud() {
      try {
        const status = await checkSupabaseStatus();
        setSupabaseConnected(status.connected);
        setSupabaseTableExists(status.tableExists);

        if (status.tableExists && status.rowCount > 0) {
          const cloudData = await fetchSchedulesFromSupabase();
          if (cloudData.length > 0) {
            setRecords(cloudData);
            showToast('info', `Tersinkronisasi otomatis dengan ${cloudData.length} data dari Supabase.`);
          }
        }
      } catch (err) {
        console.warn('Initial Supabase check skipped:', err);
      }
    }
    checkCloud();
  }, []);

  // Dynamic calculations
  const metrics = useMemo(() => calculateMetrics(records), [records]);
  const storeClashes = useMemo(() => getStoreClashes(records), [records]);
  const nikClashes = useMemo(() => getNikClashes(records), [records]);

  // Handlers
  const handleSaveRecord = async (recordData: RawTrainingInput) => {
    let savedRecord: TrainingRecord;

    if (recordToEdit) {
      const updatedList = records.map(r => r.id === recordToEdit.id ? { ...r, ...recordData } : r);
      const validated = validateAndEnrichRecords(updatedList);
      setRecords(validated);
      savedRecord = validated.find(r => r.id === recordToEdit.id)!;
      showToast('success', `Jadwal ${savedRecord.nama} berhasil diperbarui.`);
    } else {
      const validated = validateAndEnrichRecords([recordData, ...records]);
      setRecords(validated);
      savedRecord = validated[0];
      showToast('success', `Jadwal baru untuk ${savedRecord.nama} berhasil ditambahkan.`);
    }
    setRecordToEdit(null);

    // Sync to Supabase in background
    if (supabaseTableExists && savedRecord) {
      try {
        await saveRecordToSupabase(savedRecord);
      } catch (e) {
        console.warn('Background Supabase save skipped:', e);
      }
    }
  };

  // Single Delete
  const handleConfirmDeleteSingle = async () => {
    if (!recordToDelete) return;
    const targetId = recordToDelete.id;
    const targetName = recordToDelete.nama;
    setRecordToDelete(null);

    const remaining = records.filter(r => r.id !== targetId);
    setRecords(validateAndEnrichRecords(remaining));
    showToast('success', `Jadwal pelatihan ${targetName} berhasil dihapus.`);

    if (supabaseTableExists) {
      try {
        await deleteRecordFromSupabase(targetId);
      } catch (e) {
        console.warn('Background Supabase delete skipped:', e);
      }
    }
  };

  // Bulk Delete
  const handleConfirmBulkDelete = () => {
    if (!bulkIdsToDelete || bulkIdsToDelete.length === 0) return;
    const count = bulkIdsToDelete.length;
    const idSet = new Set(bulkIdsToDelete);
    setBulkIdsToDelete(null);

    const remaining = records.filter(r => !idSet.has(r.id));
    setRecords(validateAndEnrichRecords(remaining));
    showToast('success', `${count} baris jadwal berhasil dihapus.`);

    if (supabaseTableExists) {
      bulkIdsToDelete.forEach(id => {
        deleteRecordFromSupabase(id).catch(e => console.warn(e));
      });
    }
  };

  // Clear All Data
  const handleConfirmClearAll = async () => {
    setIsClearAllModalOpen(false);
    const countBefore = records.length;
    setRecords([]);
    localStorage.removeItem(STORAGE_KEY);

    // Call Supabase delete
    let cloudMsg = '';
    if (supabaseTableExists) {
      const res = await deleteAllRecordsFromSupabase();
      if (res.success) {
        cloudMsg = ' dan database Supabase berhasil dikosongkan.';
      } else {
        cloudMsg = `. Supabase error: ${res.error}`;
      }
    }

    showToast('success', `Seluruh data (${countBefore} baris) berhasil dihapus dari sistem${cloudMsg}`);
  };

  const handleQuickReschedule = async (recordId: string, newDate: string) => {
    const updated = records.map(r => r.id === recordId ? { ...r, tanggalAwal: newDate } : r);
    const validated = validateAndEnrichRecords(updated);
    setRecords(validated);

    const changed = validated.find(r => r.id === recordId);
    if (supabaseTableExists && changed) {
      saveRecordToSupabase(changed).catch(e => console.warn(e));
    }
    showToast('success', `Tanggal pelatihan berhasil diubah menjadi ${newDate}.`);
  };

  const handleImportRecords = async (newRecords: TrainingRecord[]) => {
    if (!newRecords || newRecords.length === 0) return;

    // 1. Ensure incoming records are correctly mapped to their designated sheet by training type
    const validatedIncoming = newRecords.map(r => {
      const correctSheet = mapTrainingToSheetCode(r.jenisTraining) || r.sheetCode || 'SBM';
      return {
        ...r,
        sheetCode: correctSheet,
      };
    });

    // 2. Merge with existing records without deleting or losing previous data
    const existingMap = new Map<string, TrainingRecord>();
    const getUniqueKey = (r: TrainingRecord) => {
      const nik = (r.nik || '').trim();
      const tgl = (r.tanggalAwal || '').trim();
      const training = (r.jenisTraining || '').trim().toUpperCase();
      if (nik && tgl && training) {
        return `${nik}___${tgl}___${training}`;
      }
      return r.id;
    };

    // Index existing records
    records.forEach(r => {
      existingMap.set(getUniqueKey(r), r);
    });

    let addedCount = 0;
    let updatedCount = 0;

    // Append new records or update existing identical entries
    validatedIncoming.forEach(inc => {
      const key = getUniqueKey(inc);
      if (existingMap.has(key)) {
        const prev = existingMap.get(key)!;
        existingMap.set(key, { ...prev, ...inc, id: prev.id });
        updatedCount++;
      } else {
        existingMap.set(key, inc);
        addedCount++;
      }
    });

    const mergedList = Array.from(existingMap.values());
    const enriched = validateAndEnrichRecords(mergedList);
    setRecords(enriched);

    // Track which sheets received newly uploaded records
    const sheetCounts = new Map<string, number>();
    validatedIncoming.forEach(r => {
      const sc = r.sheetCode || 'SBM';
      sheetCounts.set(sc, (sheetCounts.get(sc) || 0) + 1);
    });

    // If incoming records are mostly for a specific sheet, switch active tab to that sheet
    const topSheet = Array.from(sheetCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topSheet) {
      setSelectedSheet(topSheet);
      setActiveTab('jadwal');
    }

    const totalCount = enriched.length;
    showToast(
      'success',
      `Berhasil mengunggah ${validatedIncoming.length} jadwal (${addedCount} data baru ditambahkan ke sheet tujuan, ${updatedCount} data diperbarui). Data lama tetap tersimpan (Total sekarang: ${totalCount} jadwal).`
    );

    // Sync to Supabase in background if table exists
    if (supabaseTableExists) {
      try {
        await syncAllRecordsToSupabase(enriched);
      } catch (e) {
        console.warn('Background Supabase batch sync skipped:', e);
      }
    }
  };

  const handleResetToDefault = () => {
    const defaultData = loadDefaultRecords();
    setRecords(defaultData);
    localStorage.removeItem(STORAGE_KEY);
    showToast('info', 'Data berhasil direset ke dataset awal.');
  };

  const handleSelectStore = (storeCode: string) => {
    setActiveTab('jadwal');
    setSelectedSheet('MASTER');
    setStatusFilter('ALL');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border-slate-800'
              : toastMessage.type === 'error'
              ? 'bg-rose-950 text-rose-300 border-rose-800'
              : 'bg-slate-900 text-blue-300 border-slate-800'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        metrics={metrics}
        onOpenAddModal={() => { setRecordToEdit(null); setIsAddModalOpen(true); }}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onResetData={handleResetToDefault}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Supabase Notice Banner */}
      {!supabaseTableExists && (
        <div className="bg-emerald-950 text-emerald-100 px-4 py-2 text-xs border-b border-emerald-800">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Koneksi Supabase permanen aktif (<strong>mmrjblorrtfjmiqhodcl.supabase.co</strong>). Jalankan kode SQL 19 Sheet di Supabase SQL Editor untuk aktivasi cloud sync.
              </span>
            </div>
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-3 py-1 rounded transition-colors whitespace-nowrap shadow-xs"
            >
              Lihat Kode SQL Editor 19 Sheet
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Metric Cards Banner */}
        <MetricsCards
          metrics={metrics}
          onFilterStatus={(status) => {
            setStatusFilter(status);
            setActiveTab('jadwal');
          }}
          selectedStatusFilter={activeTab === 'jadwal' ? statusFilter : undefined}
        />

        {/* Dynamic Tab Panes */}
        {activeTab === 'jadwal' && (
          <ScheduleTable
            records={records}
            onEdit={(record) => { setRecordToEdit(record); setIsAddModalOpen(true); }}
            onRequestDelete={(record) => setRecordToDelete(record)}
            onRequestBulkDelete={(ids) => setBulkIdsToDelete(ids)}
            onRequestClearAll={() => setIsClearAllModalOpen(true)}
            onSelectStore={handleSelectStore}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selectedSheet={selectedSheet}
            setSelectedSheet={setSelectedSheet}
            onOpenAddModal={() => { setRecordToEdit(null); setIsAddModalOpen(true); }}
            onOpenImportExport={() => setIsImportExportOpen(true)}
          />
        )}

        {activeTab === 'bentrok' && (
          <ClashDetectorPanel
            storeClashes={storeClashes}
            nikClashes={nikClashes}
            allRecords={records}
            onEditRecord={(record) => { setRecordToEdit(record); setIsAddModalOpen(true); }}
            onQuickReschedule={handleQuickReschedule}
          />
        )}

        {activeTab === 'kalender' && (
          <CalendarView
            records={records}
            onSelectStore={handleSelectStore}
            onEditRecord={(record) => { setRecordToEdit(record); setIsAddModalOpen(true); }}
          />
        )}

        {activeTab === 'rekap' && (
          <BranchSummaryPanel
            records={records}
            metrics={metrics}
            onFilterCabang={(cabang) => {
              setActiveTab('jadwal');
              setSelectedSheet('MASTER');
            }}
            onFilterTraining={(training) => {
              setActiveTab('jadwal');
              setSelectedSheet('MASTER');
            }}
          />
        )}
      </main>

      {/* Modals */}
      <AddEditRecordModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setRecordToEdit(null); }}
        onSave={handleSaveRecord}
        recordToEdit={recordToEdit}
        existingRecords={records}
        defaultSheetCode={selectedSheet}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        records={records}
        onImportRecords={handleImportRecords}
        onResetToDefault={handleResetToDefault}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        records={records}
        onDataLoadedFromCloud={(cloudRecords) => {
          setRecords(cloudRecords);
          setSupabaseTableExists(true);
        }}
      />

      {/* Custom Confirmation Modals for Reliable Deletion (No window.confirm!) */}
      <ConfirmModal
        isOpen={Boolean(recordToDelete)}
        title="Konfirmasi Hapus Jadwal"
        message={`Apakah Anda yakin ingin menghapus jadwal pelatihan untuk:\n• Nama: ${recordToDelete?.nama}\n• NIK: ${recordToDelete?.nik}\n• Toko: ${recordToDelete?.kodeToko} (${recordToDelete?.tanggalAwal})\n\nTindakan ini akan otomatis memperbarui database Supabase jika terhubung.`}
        confirmLabel="Ya, Hapus Jadwal"
        isDestructive={true}
        onConfirm={handleConfirmDeleteSingle}
        onCancel={() => setRecordToDelete(null)}
      />

      <ConfirmModal
        isOpen={Boolean(bulkIdsToDelete && bulkIdsToDelete.length > 0)}
        title={`Konfirmasi Hapus ${bulkIdsToDelete?.length} Jadwal Terpilih`}
        message={`Anda akan menghapus ${bulkIdsToDelete?.length} jadwal terpilih secara permanen.\n\nData yang dihapus juga akan dihapus dari database Supabase.`}
        confirmLabel="Hapus Data Terpilih"
        isDestructive={true}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkIdsToDelete(null)}
      />

      <ConfirmModal
        isOpen={isClearAllModalOpen}
        title="⚠️ Hapus Seluruh Data Jadwal & Supabase"
        message={`PERINGATAN: Tindakan ini akan mengosongkan seluruh ${records.length} data jadwal di web aplikasi dan secara otomatis MENGHAPUS SEMUA DATA yang ada di dalam tabel Supabase (mmrjblorrtfjmiqhodcl.supabase.co).\n\nApakah Anda yakin ingin mengosongkan seluruh data?`}
        confirmLabel="Ya, Hapus Semua Data"
        isDestructive={true}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setIsClearAllModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Sistem Validasi &amp; Kroscek 19 Sheet Pelatihan Toko</span>
            <span>·</span>
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="text-emerald-700 hover:text-emerald-900 font-semibold hover:underline flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase Cloud Sync</span>
            </button>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Total {records.length} Data Tersinkronisasi
          </div>
        </div>
      </footer>
    </div>
  );
}
