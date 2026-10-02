import React, { useState, useMemo } from 'react';
import { TrainingRecord, SHEET_LIST } from '../types/training';
import { 
  Search, Filter, Trash2, Edit2, AlertCircle, ShieldCheck, 
  ArrowUpDown, ExternalLink, Calendar, Layers, Sparkles 
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
  onOpenAddModal?: () => void;
  onOpenImportExport?: () => void;
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
  onOpenAddModal,
  onOpenImportExport,
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* 19 Sheet Selector Bar */}
      <div className="border-b border-slate-200 bg-slate-100/70 px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-thin">
        <span className="font-bold text-slate-700 whitespace-nowrap pr-2 border-r border-slate-300 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Pilih Sheet:</span>
        </span>

        {/* Master Crosscheck Tab */}
        <button
          onClick={() => { setSelectedSheet('MASTER'); setCurrentPage(1); }}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors flex items-center gap-1 shadow-xs ${
            selectedSheet === 'MASTER'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>⭐ Master Sinkronisasi (Kroscek Semua Sheet)</span>
          <span className="ml-1 text-[10px] opacity-80">({records.length})</span>
        </button>

        {/* 19 Individual Sheets */}
        {SHEET_LIST.map((s) => {
          const count = records.filter(r => r.sheetCode === s.code).length;
          const isSelected = selectedSheet === s.code;
          return (
            <button
              key={s.code}
              onClick={() => { setSelectedSheet(s.code); setCurrentPage(1); }}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <span>{s.name}</span>
              <span className={`ml-1 text-[10px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Control & Filter Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari NAMA, NIK, JABATAN, KODE TOKO, AS, AM..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Cabang */}
            <select
              value={selectedCabang}
              onChange={e => { setSelectedCabang(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
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
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 max-w-[150px] truncate"
            >
              <option value="ALL">Semua Tanggal</option>
              {uniqueDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => { setStatusFilter('AMAN'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'AMAN' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Aman
              </button>
              <button
                onClick={() => { setStatusFilter('DOUBLE TOKO'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'DOUBLE TOKO' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Double Toko
              </button>
            </div>

            {/* Tombol Hapus Semua Data */}
            <button
              type="button"
              onClick={onRequestClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors shadow-xs"
              title="Hapus seluruh data di aplikasi dan database Supabase"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Hapus Semua Data</span>
            </button>
          </div>
        </div>

        {/* Batch Action Bar if rows selected */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between py-1.5 px-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <span>Terpilih <strong>{selectedIds.size}</strong> baris jadwal</span>
            <button
              type="button"
              onClick={() => {
                onRequestBulkDelete(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors shadow-xs"
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
          <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
            <tr>
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
              </th>
              <th onClick={() => handleSort('nik')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>NIK</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('nama')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 min-w-[170px]">
                <div className="flex items-center gap-1">
                  <span>NAMA</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('jabatan')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 whitespace-nowrap">
                <span>JABATAN</span>
              </th>
              <th onClick={() => handleSort('kodeToko')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>KODE TOKO</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('toko')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 whitespace-nowrap">
                <span>TOKO</span>
              </th>
              <th className="py-2.5 px-2 whitespace-nowrap text-slate-600 text-center">AS</th>
              <th className="py-2.5 px-2 whitespace-nowrap text-slate-600 text-center" title="Area Manager (sama dengan nama peserta)">AM / MANAGER</th>
              <th onClick={() => handleSort('tanggalAwal')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>TANGGAL</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('jenisTraining')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>JENIS TRAINING</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-2 whitespace-nowrap">BATCH</th>
              <th onClick={() => handleSort('cabang')} className="py-2.5 px-2 cursor-pointer hover:bg-slate-200/50 whitespace-nowrap text-center">
                <span>CABANG</span>
              </th>
              <th onClick={() => handleSort('status')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>STATUS</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap text-[11px] text-slate-500" title="Berdasarkan NIK">
                NIK (F)
              </th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap text-[11px] text-slate-500" title="Berdasarkan Kode Toko">
                TOKO (F)
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                PENGGABUNGAN
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">
                KETERANGAN
              </th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap sticky right-0 bg-slate-100/95 z-10">
                AKSI
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={18} className="py-16 text-center text-slate-500">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {records.length === 0 ? 'Belum Ada Data Jadwal Pelatihan' : 'Tidak Ada Data Ditemukan'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        {records.length === 0 
                          ? 'Seluruh data demo telah dibersihkan. Anda dapat mulai menambahkan jadwal pelatihan baru atau mengunggah file Excel.'
                          : 'Coba pilih sheet lain atau sesuaikan filter pencarian.'}
                      </p>
                    </div>

                    {records.length === 0 && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        {onOpenAddModal && (
                          <button
                            type="button"
                            onClick={onOpenAddModal}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                          >
                            + Tambah Jadwal Pertama
                          </button>
                        )}
                        {onOpenImportExport && (
                          <button
                            type="button"
                            onClick={onOpenImportExport}
                            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Import File Excel / CSV
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
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isSelected
                        ? 'bg-blue-50/50'
                        : isClash
                        ? 'bg-rose-50/30'
                        : isNikClash
                        ? 'bg-amber-50/40'
                        : ''
                    }`}
                  >
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(r.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono tabular-nums text-slate-700 font-medium">
                      {r.nik}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {r.nama}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                      {r.jabatan || 'Crew Toko'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <button
                        onClick={() => onSelectStore(r.kodeToko)}
                        className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        title="Klik untuk filter semua jadwal toko ini"
                      >
                        {r.kodeToko}
                        {isClash && <ExternalLink className="w-2.5 h-2.5" />}
                      </button>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {r.toko || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-500 text-[11px] whitespace-nowrap">
                      {r.as || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-500 text-[11px] whitespace-nowrap">
                      {r.am || '-'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-800">
                      {r.tanggalAwal}
                      {r.tanggalH1 && (
                        <span className="block text-[10px] text-blue-600 font-mono">
                          H1: {r.tanggalH1}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-800 font-medium">
                      {r.jenisTraining}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap text-slate-600 text-[11px]">
                      {r.batch || 'Batch 1'}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap text-center">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {r.cabang}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {r.status === 'AMAN' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          AMAN
                        </span>
                      ) : r.status === 'DOUBLE TOKO' ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px] bg-rose-100/80 px-1.5 py-0.5 rounded">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          DOUBLE TOKO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px] bg-amber-100/80 px-1.5 py-0.5 rounded">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          BENTROK NIK
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-mono tabular-nums text-slate-600">
                      {r.berdasarkanNik}
                    </td>
                    <td className="py-2 px-2 text-center font-mono tabular-nums font-bold">
                      <span className={r.berdasarkanKodeToko > 1 ? 'text-rose-600 bg-rose-100 px-1 rounded' : 'text-slate-600'}>
                        {r.berdasarkanKodeToko}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono tabular-nums text-slate-400 text-[11px] select-all">
                      {r.penggabungan}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600 text-[11px]">
                      {r.keterangan || '-'}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap sticky right-0 bg-white/95 z-10 shadow-2xs">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(r)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Ubah Jadwal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDelete(r)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
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
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRecords.length)} dari {filteredRecords.length} data</span>
          <span>·</span>
          <span>Per halaman:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1 text-xs bg-white border border-slate-300 rounded"
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
            className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            Sebelumnya
          </button>
          <span className="px-2 font-mono tabular-nums">
            Halaman {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
};
