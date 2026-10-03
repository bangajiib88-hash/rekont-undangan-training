import React, { useState, useEffect, useMemo } from 'react';
import { TrainingRecord, RawTrainingInput, SheetDefinition, DEFAULT_SHEET_LIST } from './types/training';
import { AppUser, INITIAL_DEFAULT_USERS } from './types/auth';
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
import { BranchSummaryPanel } from './components/BranchSummaryPanel';
import { AddEditRecordModal } from './components/AddEditRecordModal';
import { ImportExportModal } from './components/ImportExportModal';
import { SupabaseModal } from './components/SupabaseModal';
import { ConfirmModal } from './components/ConfirmModal';
import { AddSheetModal } from './components/AddSheetModal';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementModal } from './components/UserManagementModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { 
  getLocalUsers, 
  saveLocalUsers, 
  getCurrentUser, 
  setCurrentUser, 
  syncUserToSupabase, 
  fetchUsersFromSupabase,
  deleteUserFromSupabase 
} from './services/userService';
import { 
  checkSupabaseStatus, 
  fetchSchedulesFromSupabase, 
  saveRecordToSupabase, 
  deleteRecordFromSupabase,
  deleteAllRecordsFromSupabase,
  syncAllRecordsToSupabase,
  syncNewSheetToSupabase,
  fetchCustomSheetsFromSupabase
} from './services/supabaseService';
import { Database, CheckCircle2, AlertCircle, Sparkles, Building2, Shield } from 'lucide-react';

const STORAGE_KEY = 'store_training_records_v2';
const SHEETS_STORAGE_KEY = 'store_custom_sheets_v1';

export default function App() {
  // Authentication & Multi-branch User State
  const [currentUser, setCurrentUserState] = useState<AppUser | null>(() => getCurrentUser());
  const [users, setUsers] = useState<AppUser[]>(() => getLocalUsers());
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Training Records State
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

  const [activeTab, setActiveTab] = useState<'jadwal' | 'rekap'>('jadwal');
  const [selectedSheet, setSelectedSheet] = useState<string>('MASTER');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Sheet list state (Default 19 sheets + dynamically added custom sheets)
  const [sheetList, setSheetList] = useState<SheetDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(SHEETS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, SheetDefinition>();
          DEFAULT_SHEET_LIST.forEach(s => map.set(s.code, s));
          parsed.forEach((s: SheetDefinition) => map.set(s.code, s));
          return Array.from(map.values());
        }
      }
    } catch (e) {
      console.error('Failed to load custom sheets:', e);
    }
    return DEFAULT_SHEET_LIST;
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddSheetModalOpen, setIsAddSheetModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<TrainingRecord | null>(null);

  // Custom Delete Confirmations
  const [recordToDelete, setRecordToDelete] = useState<TrainingRecord | null>(null);
  const [bulkIdsToDelete, setBulkIdsToDelete] = useState<string[] | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Theme state (Indomaret Light / Dark Mode)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('indomaret_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('indomaret_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error('Failed to set theme:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Cloud status & syncing state
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [supabaseTableExists, setSupabaseTableExists] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Persistent storage for records
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  }, [records]);

  // Initial Supabase & Users connection check
  useEffect(() => {
    async function checkCloud() {
      try {
        const status = await checkSupabaseStatus();
        setSupabaseConnected(status.connected);
        setSupabaseTableExists(status.tableExists);

        // Fetch users from cloud if available
        try {
          const cloudUsers = await fetchUsersFromSupabase();
          if (cloudUsers.length > 0) {
            setUsers(prev => {
              const map = new Map<string, AppUser>();
              INITIAL_DEFAULT_USERS.forEach(u => map.set(u.username, u));
              prev.forEach(u => map.set(u.username, u));
              cloudUsers.forEach(u => map.set(u.username, u));
              const merged = Array.from(map.values());
              saveLocalUsers(merged);
              return merged;
            });
          }
        } catch (e) {
          console.warn('Cloud users fetch skipped:', e);
        }

        if (status.connected && status.tableExists) {
          // Fetch custom sheets
          try {
            const cloudSheets = await fetchCustomSheetsFromSupabase();
            if (cloudSheets.length > 0) {
              setSheetList(prev => {
                const map = new Map<string, SheetDefinition>();
                DEFAULT_SHEET_LIST.forEach(s => map.set(s.code, s));
                prev.forEach(s => map.set(s.code, s));
                cloudSheets.forEach(s => map.set(s.code, s));
                const merged = Array.from(map.values());
                try {
                  localStorage.setItem(SHEETS_STORAGE_KEY, JSON.stringify(merged));
                } catch {}
                return merged;
              });
            }
          } catch (e) {
            console.warn('Failed to load custom sheets from cloud:', e);
          }

          // Fetch schedules
          if (status.rowCount > 0) {
            const cloudData = await fetchSchedulesFromSupabase();
            if (cloudData.length > 0) {
              setRecords(cloudData);
              showToast('info', `Tersinkronisasi otomatis dengan ${cloudData.length} data jadwal dari Cloud Supabase.`);
            }
          } else if (records.length > 0) {
            const pushRes = await syncAllRecordsToSupabase(records);
            if (pushRes.success) {
              showToast('success', `${pushRes.count} data jadwal lokal otomatis diunggah ke Cloud Supabase.`);
            }
          }
        }
      } catch (err) {
        console.warn('Initial Supabase check skipped:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    }
    checkCloud();
  }, []);

  // Manual Cloud Sync trigger
  const handleManualCloudSync = async () => {
    setIsCloudSyncing(true);
    try {
      const status = await checkSupabaseStatus();
      setSupabaseConnected(status.connected);
      setSupabaseTableExists(status.tableExists);

      if (!status.connected) {
        showToast('error', 'Gagal terhubung ke database Cloud Supabase.');
        return;
      }

      if (status.rowCount > 0) {
        const cloudData = await fetchSchedulesFromSupabase();
        setRecords(cloudData);
        showToast('success', `Berhasil menarik ${cloudData.length} data jadwal dari Cloud Supabase!`);
      } else if (records.length > 0) {
        const res = await syncAllRecordsToSupabase(records);
        if (res.success) {
          showToast('success', `Berhasil mengunggah ${res.count} data jadwal ke Cloud Supabase!`);
        } else {
          showToast('error', `Gagal mengunggah ke Cloud: ${res.error}`);
        }
      } else {
        showToast('info', 'Database Cloud Supabase saat ini belum memiliki data jadwal.');
      }
    } catch (e: any) {
      showToast('error', `Gagal sinkronisasi: ${e.message || 'Error tidak diketahui'}`);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Add new sheet & automatically sync to Supabase
  const handleAddSheet = async (newSheet: { code: string; name: string; description?: string }) => {
    const def: SheetDefinition = {
      ...newSheet,
      isCustom: true,
    };

    const nextList = [...sheetList.filter(s => s.code !== def.code), def];
    setSheetList(nextList);

    try {
      localStorage.setItem(SHEETS_STORAGE_KEY, JSON.stringify(nextList));
    } catch (e) {
      console.warn('Failed to cache custom sheet:', e);
    }

    setSelectedSheet(def.code);
    setActiveTab('jadwal');

    if (supabaseTableExists || supabaseConnected) {
      try {
        await syncNewSheetToSupabase(def);
        showToast('success', `Sheet "${def.name}" berhasil dibuat dan otomatis disinkronkan ke Supabase.`);
      } catch (err: any) {
        showToast('info', `Sheet "${def.name}" berhasil ditambahkan lokal.`);
      }
    } else {
      showToast('success', `Sheet "${def.name}" berhasil ditambahkan ke sistem.`);
    }
  };

  // User Authentication Handlers
  const handleLogin = (user: AppUser) => {
    setCurrentUserState(user);
    setCurrentUser(user);
    showToast('success', `Selamat datang, ${user.nama}! Anda login sebagai ${user.role === 'PUSAT' ? 'Admin Pusat (Semua Cabang)' : 'Admin Cabang ' + user.cabang}.`);
  };

  const handleLogout = () => {
    setCurrentUserState(null);
    setCurrentUser(null);
    showToast('info', 'Anda telah keluar dari aplikasi.');
  };

  const handleAddUser = async (newUser: AppUser) => {
    const nextUsers = [...users.filter(u => u.username !== newUser.username), newUser];
    setUsers(nextUsers);
    saveLocalUsers(nextUsers);
    await syncUserToSupabase(newUser);
    showToast('success', `Akun ${newUser.nama} (${newUser.username}) berhasil didaftarkan! User cabang sekarang bisa login.`);
  };

  const handleDeleteUser = async (username: string) => {
    const nextUsers = users.filter(u => u.username !== username);
    setUsers(nextUsers);
    saveLocalUsers(nextUsers);
    await deleteUserFromSupabase(username);
    showToast('success', `Akun ${username} berhasil dihapus.`);
  };

  const handleUpdatePassword = async (username: string, newPassword: string) => {
    const nextUsers = users.map(u => u.username === username ? { ...u, password: newPassword } : u);
    setUsers(nextUsers);
    saveLocalUsers(nextUsers);

    if (currentUser && currentUser.username === username) {
      const nextCurrent = { ...currentUser, password: newPassword };
      setCurrentUserState(nextCurrent);
      setCurrentUser(nextCurrent);
    }

    const target = nextUsers.find(u => u.username === username);
    if (target) {
      await syncUserToSupabase(target);
    }
  };

  // ==========================================
  // DATA ISOLATION (Role-Based Access Control)
  // ==========================================
  const isPusat = currentUser?.role === 'PUSAT';
  const userCabang = currentUser?.cabang || 'SBY';

  // Branch-isolated records: Admin Cabang ONLY sees their own branch records!
  const visibleRecords = useMemo(() => {
    if (!currentUser) return [];
    if (isPusat || !currentUser?.cabang || currentUser.cabang === 'ALL') {
      return records;
    }
    return records.filter(r => (r.cabang || '').trim().toUpperCase() === userCabang.trim().toUpperCase());
  }, [records, isPusat, currentUser, userCabang]);

  // Dynamic calculations based on visible records
  const metrics = useMemo(() => calculateMetrics(visibleRecords), [visibleRecords]);
  const storeClashes = useMemo(() => getStoreClashes(visibleRecords), [visibleRecords]);
  const nikClashes = useMemo(() => getNikClashes(visibleRecords), [visibleRecords]);

  // Extract all unique branches in system
  const availableBranches = useMemo(() => {
    const set = new Set<string>(['SBY', 'JAP', 'MNK', 'SON', 'MRK']);
    records.forEach(r => { if (r.cabang) set.add(r.cabang.toUpperCase()); });
    return Array.from(set).sort();
  }, [records]);

  // Handlers for record operations
  const handleSaveRecord = async (recordData: RawTrainingInput) => {
    let savedRecord: TrainingRecord;
    // Enforce branch if user is Admin Cabang
    const finalRecordData: RawTrainingInput = {
      ...recordData,
      cabang: !isPusat ? userCabang : (recordData.cabang || 'SBY'),
    };

    if (recordToEdit) {
      const updatedList = records.map(r => r.id === recordToEdit.id ? { ...r, ...finalRecordData } : r);
      const validated = validateAndEnrichRecords(updatedList);
      setRecords(validated);
      savedRecord = validated.find(r => r.id === recordToEdit.id)!;
      showToast('success', `Jadwal ${savedRecord.nama} berhasil diperbarui.`);
    } else {
      const validated = validateAndEnrichRecords([finalRecordData, ...records]);
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
    showToast('success', `Jadwal training ${targetName} berhasil dihapus.`);

    if (supabaseTableExists) {
      try {
        await deleteRecordFromSupabase(targetId);
      } catch (e) {
        console.warn('Background Supabase delete skipped:', e);
      }
    }
  };

  // Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (!bulkIdsToDelete || bulkIdsToDelete.length === 0) return;
    const count = bulkIdsToDelete.length;
    const idSet = new Set(bulkIdsToDelete);
    setBulkIdsToDelete(null);

    const remaining = records.filter(r => !idSet.has(r.id));
    setRecords(validateAndEnrichRecords(remaining));
    showToast('success', `${count} jadwal training terpilih berhasil dihapus.`);

    if (supabaseTableExists) {
      for (const id of Array.from(idSet)) {
        try {
          await deleteRecordFromSupabase(id);
        } catch {}
      }
    }
  };

  // Clear All Data
  const handleConfirmClearAll = async () => {
    setIsClearAllModalOpen(false);
    
    if (!isPusat) {
      // Branch admin clears only their branch data
      const remaining = records.filter(r => (r.cabang || '').toUpperCase() !== userCabang.toUpperCase());
      setRecords(validateAndEnrichRecords(remaining));
      showToast('success', `Seluruh data jadwal Cabang ${userCabang} berhasil dibersihkan.`);
      return;
    }

    setRecords([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    if (supabaseTableExists) {
      try {
        await deleteAllRecordsFromSupabase();
        showToast('success', 'Seluruh data jadwal di aplikasi dan database Supabase Cloud telah dikosongkan.');
      } catch (err: any) {
        showToast('error', `Gagal mengosongkan Supabase: ${err.message}`);
      }
    } else {
      showToast('success', 'Seluruh data jadwal berhasil dibersihkan.');
    }
  };

  // Quick Reschedule handler from clash detector
  const handleQuickReschedule = async (recordId: string, newDateIso: string) => {
    const target = records.find(r => r.id === recordId);
    if (!target) return;

    const parts = newDateIso.split('-').map(Number);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const newFormattedDate = `${String(parts[2]).padStart(2, '0')} ${months[parts[1] - 1]} ${parts[0]}`;

    const updatedList = records.map(r => r.id === recordId ? { ...r, tanggalAwal: newFormattedDate } : r);
    const validated = validateAndEnrichRecords(updatedList);
    setRecords(validated);

    const updatedRecord = validated.find(r => r.id === recordId);
    if (updatedRecord && supabaseTableExists) {
      try {
        await saveRecordToSupabase(updatedRecord);
      } catch {}
    }
    showToast('success', `Jadwal ${target.nama} berhasil dijadwalkan ulang ke ${newFormattedDate}.`);
  };

  // Import Records
  const handleImportRecords = async (newRecords: TrainingRecord[]) => {
    // If branch admin, tag all imported records to their branch
    const tagged = newRecords.map(r => ({
      ...r,
      cabang: !isPusat ? userCabang : (r.cabang || 'SBY'),
    }));

    const merged = [...tagged, ...records.filter(r => !tagged.some(nr => nr.id === r.id))];
    const validated = validateAndEnrichRecords(merged);
    setRecords(validated);
    showToast('success', `Berhasil mengimpor ${newRecords.length} data jadwal baru.`);

    if (supabaseTableExists) {
      try {
        await syncAllRecordsToSupabase(validated);
        showToast('success', `${newRecords.length} data jadwal baru berhasil disinkronkan ke Supabase Cloud.`);
      } catch (e: any) {
        console.warn('Supabase sync after import error:', e);
      }
    }
  };

  // Reset to Full Dataset
  const handleResetToDefault = async () => {
    const initial = loadDefaultRecords();
    const validated = validateAndEnrichRecords(initial);
    setRecords(validated);
    showToast('success', `Berhasil memuat ulang ${validated.length} data jadwal standar.`);

    if (supabaseTableExists) {
      try {
        await syncAllRecordsToSupabase(validated);
      } catch (e) {}
    }
  };

  const handleSelectStore = (storeCode: string) => {
    setActiveTab('jadwal');
    setSelectedSheet('MASTER');
  };

  // ==========================================
  // GATEWAY: SHOW LOGIN SCREEN FIRST IF NOT LOGGED IN
  // ==========================================
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} users={users} />;
  }

  // ==========================================
  // MAIN DASHBOARD (UNLOCKED AFTER LOGIN)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 dark:bg-slate-800 text-emerald-400 border-slate-800 dark:border-slate-700'
              : toastMessage.type === 'error'
              ? 'bg-rose-950 text-rose-300 border-rose-800'
              : 'bg-slate-900 dark:bg-slate-800 text-blue-300 border-slate-800 dark:border-slate-700'
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
        onResetData={handleResetToDefault}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSyncCloud={handleManualCloudSync}
        isCloudSyncing={isCloudSyncing}
        theme={theme}
        onToggleTheme={toggleTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Indomaret Tri-Color Brand Status Hero Bar */}
        <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xs transition-colors">
          <div className="h-1.5 w-full indomaret-stripe" />
          <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
                <img 
                  src="/indomaret.svg" 
                  alt="Logo Indomaret" 
                  className="h-7 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', 'https://upload.wikimedia.org/wikipedia/commons/4/44/Indomaret.svg');
                  }}
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                    Sistem Validasi &amp; Penjadwalan Training Toko
                  </h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {isPusat ? (
                    <span>Akses Admin Utama: Menampilkan seluruh jadwal cabang nasional. Gunakan menu <strong>Tambah/Kelola User</strong> di header untuk mendaftarkan admin cabang baru.</span>
                  ) : (
                    <span>Akses Terisolasi: Anda mengelola data khusus <strong>Cabang {userCabang}</strong>. Data cabang lain terlindungi dan tidak ditampilkan.</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end">
              {/* User badge */}
              <div className="text-right hidden sm:block">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Pengguna Aktif:</span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-end gap-1">
                  {isPusat ? <Shield className="w-3.5 h-3.5 text-purple-600" /> : <Building2 className="w-3.5 h-3.5 text-[#005BAC]" />}
                  <span>{currentUser?.nama}</span>
                </span>
              </div>
              {isPusat && (
                <button
                  type="button"
                  onClick={() => setIsUserManagementModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/70 text-[#005BAC] dark:text-blue-300 hover:bg-blue-100 transition-colors shadow-2xs"
                  title="Daftarkan user admin cabang baru"
                >
                  + Tambah User Cabang
                </button>
              )}
            </div>
          </div>
        </div>

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
            records={visibleRecords}
            onEdit={(record) => { setRecordToEdit(record); setIsAddModalOpen(true); }}
            onRequestDelete={(record) => setRecordToDelete(record)}
            onRequestBulkDelete={(ids) => setBulkIdsToDelete(ids)}
            onRequestClearAll={() => setIsClearAllModalOpen(true)}
            onSelectStore={handleSelectStore}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selectedSheet={selectedSheet}
            setSelectedSheet={setSelectedSheet}
            sheetList={sheetList}
            onOpenAddSheet={() => setIsAddSheetModalOpen(true)}
            onOpenAddModal={() => { setRecordToEdit(null); setIsAddModalOpen(true); }}
            onOpenImportExport={() => setIsImportExportOpen(true)}
            onSyncCloud={handleManualCloudSync}
            isCloudSyncing={isCloudSyncing}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'rekap' && (
          <BranchSummaryPanel
            records={visibleRecords}
            metrics={metrics}
            sheetList={sheetList}
            onFilterCabang={() => {
              setSelectedSheet('MASTER');
              setStatusFilter('ALL');
              setActiveTab('jadwal');
            }}
            onFilterTraining={(targetSheetCode, trainingName) => {
              let matchedCode = targetSheetCode;
              if (!sheetList.some(s => s.code === matchedCode)) {
                const found = sheetList.find(s => 
                  s.code.toLowerCase() === matchedCode.toLowerCase() ||
                  s.name.toLowerCase().includes(trainingName.toLowerCase()) ||
                  trainingName.toLowerCase().includes(s.code.toLowerCase())
                );
                if (found) matchedCode = found.code;
              }
              setSelectedSheet(matchedCode || 'MASTER');
              setStatusFilter('ALL');
              setActiveTab('jadwal');
              showToast('info', `Membuka data Sheet ${matchedCode} (${trainingName})`);
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
        sheetList={sheetList}
        currentUser={currentUser}
      />

      <AddSheetModal
        isOpen={isAddSheetModalOpen}
        onClose={() => setIsAddSheetModalOpen(false)}
        onAddSheet={handleAddSheet}
        existingSheetCodes={sheetList.map(s => s.code)}
        totalCurrentSheets={sheetList.length}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        records={visibleRecords}
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

      {/* User Management Modal for Admin Pusat */}
      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        users={users}
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
        onUpdatePassword={handleUpdatePassword}
        currentUser={currentUser}
        availableBranches={availableBranches}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
        onUpdatePassword={handleUpdatePassword}
      />

      {/* Custom Confirmation Modals for Reliable Deletion (No window.confirm!) */}
      <ConfirmModal
        isOpen={Boolean(recordToDelete)}
        title="Konfirmasi Hapus Jadwal"
        message={`Apakah Anda yakin ingin menghapus jadwal training untuk:\n• Nama: ${recordToDelete?.nama}\n• NIK: ${recordToDelete?.nik}\n• Toko: ${recordToDelete?.kodeToko} (${recordToDelete?.tanggalAwal})\n\nTindakan ini akan otomatis memperbarui database Supabase jika terhubung.`}
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
        title={isPusat ? '⚠️ Hapus Seluruh Data Jadwal & Supabase' : `⚠️ Hapus Seluruh Jadwal Cabang ${userCabang}`}
        message={isPusat 
          ? `PERINGATAN ADMIN UTAMA: Tindakan ini akan mengosongkan seluruh ${records.length} data jadwal di aplikasi dan database Supabase.\n\nApakah Anda yakin ingin mengosongkan seluruh data?`
          : `PERINGATAN: Tindakan ini akan mengosongkan ${visibleRecords.length} data jadwal khusus Cabang ${userCabang}.\n\nData cabang lain tidak akan terhapus.`
        }
        confirmLabel="Ya, Hapus Semua Data"
        isDestructive={true}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setIsClearAllModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 mt-auto transition-colors">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span>Sistem Validasi &amp; Kroscek Sheet Training Toko</span>
            <span>·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Supabase Cloud Sync Aktif</span>
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
            {isPusat ? `Total ${records.length} Data Nasional` : `Total ${visibleRecords.length} Data Cabang ${userCabang}`}
          </div>
        </div>
      </footer>
    </div>
  );
}
