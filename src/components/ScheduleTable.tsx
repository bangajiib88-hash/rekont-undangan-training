import React, { useState, useMemo } from 'react';
import { TrainingRecord, SHEET_LIST, SheetDefinition } from '../types/training';
import { 
  Search, Filter, Trash2, Edit2, AlertCircle, ShieldCheck, 
  ArrowUpDown, ExternalLink, Calendar, Layers, Sparkles, Database, RefreshCw, Plus 
} from 'lucide-react';
import { getAllSessionDates } from '../utils/trainingUtils';

interface ScheduleTableProps {
  records: TrainingRecord[];
  onEdit: (record: TrainingRecord) => void;
  onRequestDelete: (record: TrainingRecord) => void;
  onRequestBulkDelete: (ids: string[]) => void;
  onRequestClearAll: () => void;
  onSelectStore: (storeCode: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  selectedSheet: string;
  setSelectedSheet: (sheetCode: string) => void;
  sheetList?: SheetDefinition[];
  onOpenAddSheet?: () => void;
  onOpenAddModal?: () => void;
  onOpenImportExport?: () => void;
  onSyncCloud?: () => void;
  isCloudSyncing?: boolean;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  records,
  onEdit,
  onRequestDelete,
  onRequestBulkDelete,
  onRequestClearAll,
  onSelectStore,
  statusFilter,
  setStatusFilter,
  selectedSheet,
  setSelectedSheet,
  sheetList = SHEET_LIST,
  onOpenAddSheet,
  onOpenAddModal,
  onOpenImportExport,
  onSyncCloud,
  isCloudSyncing = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCabang, setSelectedCabang] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof TrainingRecord>('tanggalAwal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Extract unique branches
  const uniqueBranches = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => { if (r.cabang) set.add(r.cabang); });
    return Array.from(set).sort();
  }, [records]);

  // Extract unique dates
  const uniqueDates = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => { if (r.tanggalAwal) set.add(r.tanggalAwal); });
    return Array.from(set).sort();
  }, [records]);

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Sheet filter: 'MASTER' shows all 19 sheets synchronized together
      if (selectedSheet !== 'MASTER' && r.sheetCode !== selectedSheet) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      // Branch filter
      if (selectedCabang !== 'ALL' && r.cabang !== selectedCabang) return false;
      // Date filter
      if (selectedDate !== 'ALL' && r.tanggalAwal !== selectedDate) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNama = r.nama.toLowerCase().includes(q);
        const matchesNik = r.nik.includes(q);
        const matchesToko = r.kodeToko.toLowerCase().includes(q);
        const matchesNamaToko = (r.toko || '').toLowerCase().includes(q);
        const matchesJabatan = (r.jabatan || '').toLowerCase().includes(q);
        const matchesTraining = r.jenisTraining.toLowerCase().includes(q);
        const matchesCabang = r.cabang.toLowerCase().includes(q);
        if (!matchesNama && !matchesNik && !matchesToko && !matchesNamaToko && !matchesJabatan && !matchesTraining && !matchesCabang) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [records, selectedSheet, statusFilter, selectedCabang, selectedDate, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleSort = (field: keyof TrainingRecord) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newSet = new Set<string>();
      paginatedRecords.forEach(r => newSet.add(r.id));
      setSelectedIds(newSet);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const isAllSelected = paginatedRecords.length > 0 && paginatedRecords.every(r => selectedIds.has(r.id));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors">
      {/* 19 Sheet Selector Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-thin">
        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap pr-2 border-r border-slate-300 dark:border-slate-700 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-[#005BAC] dark:text-blue-400" />
          <span>Pilih Sheet:</span>
        </span>

        {/* Master Crosscheck Tab */}
        <button
          onClick={() => { setSelectedSheet('MASTER'); setCurrentPage(1); }}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs ${
            selectedSheet === 'MASTER'
              ? 'bg-gradient-to-r from-[#005BAC] via-[#004785] to-[#E31B23] text-white shadow-md ring-2 ring-[#FFC72C]'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 border-2 border-[#005BAC]/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FFC72C] fill-[#FFC72C]" />
          <span>⭐ Master Sinkronisasi (Kroscek Semua Sheet)</span>
          <span className={`ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
            selectedSheet === 'MASTER' 
              ? 'bg-black/30 text-amber-300' 
              : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
          }`}>
            {records.length}
          </span>
        </button>

        {/* Sheets List */}
        {sheetList.map((s) => {
          const count = records.filter(r => r.sheetCode === s.code).length;
          const isSelected = selectedSheet === s.code;
          return (
            <button
              key={s.code}
              onClick={() => { setSelectedSheet(s.code); setCurrentPage(1); }}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-[#005BAC] text-white border-[#005BAC] shadow-xs font-bold ring-1 ring-[#FFC72C]'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 font-semibold'
              }`}
            >
              <span>{s.name}</span>
              <span className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                isSelected 
                  ? 'bg-blue-800/80 text-blue-100' 
                  : count > 0 
                  ? 'bg-blue-50 dark:bg-slate-700 text-[#005BAC] dark:text-blue-300' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                ({count})
              </span>
            </button>
          );
        })}

        {/* Tombol Tambah Sheet Baru */}
        {onOpenAddSheet && (
          <button
            type="button"
            onClick={onOpenAddSheet}
            className="px-3 py-1.5 rounded-lg whitespace-nowrap font-bold text-xs bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all flex items-center gap-1.5 shadow-2xs"
            title="Tambah sheet program training baru dan otomatis sinkronkan ke Supabase"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Tambah Sheet Baru</span>
          </button>
        )}
      </div>

      {/* Control & Filter Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari NAMA, NIK, JABATAN, KODE TOKO, AS, AM..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#005BAC] focus:border-transparent transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Cabang */}
            <select
              value={selectedCabang}
              onChange={e => { setSelectedCabang(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#005BAC]"
            >
              <option value="ALL">Semua Cabang ({uniqueBranches.length})</option>
              {uniqueBranches.map(c => (
                <option key={c} value={c}>Cabang {c}</option>
              ))}
            </select>

            {/* Tanggal */}
            <select
              value={selectedDate}
              onChange={e => { setSelectedDate(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#005BAC] max-w-[150px] truncate"
            >
              <option value="ALL">Semua Tanggal</option>
              {uniqueDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => { setStatusFilter('AMAN'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'AMAN' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                }`}
              >
                Aman
              </button>
              <button
                onClick={() => { setStatusFilter('DOUBLE TOKO'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'DOUBLE TOKO' ? 'bg-white dark:bg-slate-700 text-[#E31B23] dark:text-red-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                }`}
              >
                Double Toko
              </button>
              <button
                onClick={() => { setStatusFilter('BENTROK NIK'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'BENTROK NIK' ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-purple-600'
                }`}
              >
                Double NIK
              </button>
            </div>

            {/* Tombol Hapus Semua Data */}
            <button
              type="button"
              onClick={onRequestClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#E31B23] dark:text-red-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-xs"
              title="Hapus seluruh data di aplikasi dan database Supabase"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#E31B23] dark:text-red-400" />
              <span>Hapus Semua Data</span>
            </button>
          </div>
        </div>

        {/* Batch Action Bar if rows selected */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between py-1.5 px-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-900 dark:text-blue-200">
            <span>Terpilih <strong>{selectedIds.size}</strong> baris jadwal</span>
            <button
              type="button"
              onClick={() => {
                onRequestBulkDelete(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-[#E31B23] hover:bg-red-700 rounded-md transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus {selectedIds.size} Terpilih
            </button>
          </div>
        )}
      </div>

      {/* Spreadsheet Data Grid with Exact Header Structure */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/95 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 shadow-2xs">
            <tr>
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded text-[#005BAC] focus:ring-[#005BAC] w-3.5 h-3.5"
                />
              </th>
              <th onClick={() => handleSort('nik')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>NIK</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('nama')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 min-w-[170px]">
                <div className="flex items-center gap-1">
                  <span>NAMA</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('jabatan')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 whitespace-nowrap">
                <span>JABATAN</span>
              </th>
              <th onClick={() => handleSort('kodeToko')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>KODE TOKO</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('toko')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 whitespace-nowrap">
                <span>TOKO</span>
              </th>
              <th className="py-2.5 px-2 whitespace-nowrap text-slate-600 dark:text-slate-400 text-center">AS</th>
              <th className="py-2.5 px-2 whitespace-nowrap text-slate-600 dark:text-slate-400 text-center" title="Area Manager">AM / MANAGER</th>
              <th onClick={() => handleSort('tanggalAwal')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>TANGGAL</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('jenisTraining')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>JENIS TRAINING</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-2 whitespace-nowrap">BATCH</th>
              <th onClick={() => handleSort('cabang')} className="py-2.5 px-2 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 whitespace-nowrap text-center">
                <span>CABANG</span>
              </th>
              <th onClick={() => handleSort('status')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>STATUS</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400" title="Berdasarkan NIK">
                NIK (F)
              </th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400" title="Berdasarkan Kode Toko">
                TOKO (F)
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                PENGGABUNGAN
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">
                KETERANGAN
              </th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap sticky right-0 bg-slate-100/95 dark:bg-slate-800 z-10 shadow-2xs">
                AKSI
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={18} className="py-16 text-center text-slate-500 dark:text-slate-400">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {records.length === 0 ? 'Belum Ada Data Jadwal Training' : 'Tidak Ada Data Ditemukan'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                        {records.length === 0 
                          ? 'Mulai dengan mengunggah file Excel jadwal training atau tarik data terbaru dari cloud.'
                          : 'Coba pilih sheet lain atau sesuaikan kata kunci pencarian.'}
                      </p>
                    </div>

                    {records.length === 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {onSyncCloud && (
                          <button
                            type="button"
                            onClick={onSyncCloud}
                            disabled={isCloudSyncing}
                            className="px-3.5 py-1.5 text-xs font-semibold text-[#005BAC] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Database className={`w-3.5 h-3.5 text-[#005BAC] dark:text-blue-400 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                            <span>{isCloudSyncing ? 'Menghubungkan Cloud...' : 'Tarik Data dari Cloud Supabase'}</span>
                          </button>
                        )}
                        {onOpenImportExport && (
                          <button
                            type="button"
                            onClick={onOpenImportExport}
                            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
                          >
                            Import File Excel / CSV
                          </button>
                        )}
                        {onOpenAddModal && (
                          <button
                            type="button"
                            onClick={onOpenAddModal}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#005BAC] hover:bg-[#004785] rounded-lg transition-colors shadow-xs"
                          >
                            + Tambah Jadwal Pertama
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r) => {
                const isClash = r.status === 'DOUBLE TOKO';
                const isNikClash = r.status === 'BENTROK NIK';
                const isSelected = selectedIds.has(r.id);

                return (
                  <tr
                    key={r.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/50'
                        : isClash
                        ? 'bg-red-50/50 dark:bg-red-950/35 hover:bg-red-50/80 dark:hover:bg-red-950/50'
                        : isNikClash
                        ? 'bg-amber-50/50 dark:bg-amber-950/35 hover:bg-amber-50/80 dark:hover:bg-amber-950/50'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60 even:bg-slate-50/30 even:dark:bg-slate-900/30'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(r.id)}
                        className="rounded text-[#005BAC] focus:ring-[#005BAC] w-3.5 h-3.5"
                      />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                      {r.nik}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                      {r.nama}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {r.jabatan || 'Crew Toko'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <button
                        onClick={() => onSelectStore(r.kodeToko)}
                        className="font-mono font-bold text-[#005BAC] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                        title="Klik untuk filter semua jadwal toko ini"
                      >
                        {r.kodeToko}
                        {isClash && <ExternalLink className="w-2.5 h-2.5 text-[#E31B23] dark:text-red-400" />}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {r.toko || '-'}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {r.as || '-'}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {r.am || '-'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                      {r.tanggalAwal}
                      {r.tanggalH1 && (
                        <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                          H1: {r.tanggalH1}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-800 dark:text-slate-100 font-semibold">
                      {r.jenisTraining}
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap text-slate-600 dark:text-slate-300 text-[11px]">
                      {r.batch || 'Batch 1'}
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap text-center">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] border border-slate-200 dark:border-slate-700">
                        {r.cabang}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {r.status === 'AMAN' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-200 font-bold text-[11px] bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 rounded-md shadow-2xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          AMAN
                        </span>
                      ) : r.status === 'DOUBLE TOKO' ? (
                        <span className="inline-flex items-center gap-1.5 text-white font-extrabold text-[11px] bg-[#E31B23] border border-red-700 dark:border-red-500 px-2.5 py-0.5 rounded-md shadow-xs">
                          <AlertCircle className="w-3.5 h-3.5 text-white" />
                          DOUBLE TOKO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-950 dark:text-amber-100 font-extrabold text-[11px] bg-[#FFC72C] dark:bg-amber-600 border border-amber-400 dark:border-amber-400 px-2.5 py-0.5 rounded-md shadow-xs">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-950 dark:text-amber-100" />
                          BENTROK NIK
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {r.berdasarkanNik}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono tabular-nums font-bold">
                      <span className={r.berdasarkanKodeToko > 1 ? 'text-white bg-[#E31B23] px-1.5 py-0.5 rounded font-extrabold' : 'text-slate-700 dark:text-slate-300'}>
                        {r.berdasarkanKodeToko}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono tabular-nums text-slate-600 dark:text-slate-300 text-[11px] select-all">
                      {r.penggabungan}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-200 text-[11px]">
                      {r.keterangan || '-'}
                    </td>
                    <td className={`py-2.5 px-3 text-right whitespace-nowrap sticky right-0 z-10 shadow-2xs ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950'
                        : isClash
                        ? 'bg-red-50/95 dark:bg-slate-900/95'
                        : isNikClash
                        ? 'bg-amber-50/95 dark:bg-slate-900/95'
                        : 'bg-white/95 dark:bg-slate-900/95'
                    }`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(r)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors"
                          title="Ubah Jadwal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDelete(r)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#E31B23] dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span>Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRecords.length)} dari {filteredRecords.length} data</span>
          <span>·</span>
          <span>Per halaman:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>Semua</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 dark:text-slate-200"
          >
            Sebelumnya
          </button>
          <span className="px-2 font-mono tabular-nums text-slate-700 dark:text-slate-300">
            Halaman {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 dark:text-slate-200"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
};
