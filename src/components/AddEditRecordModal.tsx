import React, { useState, useEffect, useMemo } from 'react';
import { TrainingRecord, SHEET_LIST, SheetDefinition, RawTrainingInput } from '../types/training';
import { X, AlertCircle, Calendar, ShieldCheck, ChevronDown, ChevronUp, UserX, Store } from 'lucide-react';
import { 
  generatePenggabunganKey, 
  dateToIso, 
  isoToDateIndo, 
  getAllSessionDates,
  normalizeDateKey,
  mapTrainingToSheetCode 
} from '../utils/trainingUtils';

export const JABATAN_OPTIONS = [
  'Store Jr. Leader',
  'Store Crew Girl',
  'Store Crew Boy',
  'Store Crew Boy (Ss)',
  'Store Crew Girl (Ss)',
  'Store Jr. Leader (Ss)',
  'Chief Of Store (Ss)',
  'Chief Of Store',
  'Store Sr. Leader (Ss)',
  'Store Sr. Leader',
  'Barista Point Coffee',
];

interface AddEditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: RawTrainingInput) => void;
  recordToEdit: TrainingRecord | null;
  existingRecords: TrainingRecord[];
  defaultSheetCode?: string;
  sheetList?: SheetDefinition[];
}

export const AddEditRecordModal: React.FC<AddEditRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recordToEdit,
  existingRecords,
  defaultSheetCode,
  sheetList = SHEET_LIST,
}) => {
  // Core Fields
  const [sheetCode, setSheetCode] = useState<string>('SBM');
  const [tanggalIso, setTanggalIso] = useState<string>('2026-10-12');
  const [nik, setNik] = useState<string>('');
  const [nama, setNama] = useState<string>('');
  const [jabatan, setJabatan] = useState<string>('Store Jr. Leader');
  const [kodeToko, setKodeToko] = useState<string>('');
  const [toko, setToko] = useState<string>('');
  const [as, setAs] = useState<string>('-');
  const [am, setAm] = useState<string>('-');
  const [batch, setBatch] = useState<string>('Batch 1');
  const [cabang, setCabang] = useState<string>('SBY');
  const [keterangan, setKeterangan] = useState<string>('OFFLINE CLASS');

  // Multi-day schedule (H1 - H10)
  const [showMultiDay, setShowMultiDay] = useState(false);
  const [h1, setH1] = useState<string>('');
  const [h2, setH2] = useState<string>('');
  const [h3, setH3] = useState<string>('');
  const [h4, setH4] = useState<string>('');
  const [h5, setH5] = useState<string>('');
  const [h6, setH6] = useState<string>('');
  const [h7, setH7] = useState<string>('');
  const [h8, setH8] = useState<string>('');
  const [h9, setH9] = useState<string>('');
  const [h10, setH10] = useState<string>('');

  // Initial populate when opening or editing
  useEffect(() => {
    if (recordToEdit) {
      setSheetCode(recordToEdit.sheetCode || mapTrainingToSheetCode(recordToEdit.jenisTraining) || 'SBM');
      setTanggalIso(dateToIso(recordToEdit.tanggalAwal) || '2026-10-12');
      setNik(recordToEdit.nik || '');
      setNama(recordToEdit.nama || '');
      setJabatan(recordToEdit.jabatan || 'Store Jr. Leader');
      setKodeToko(recordToEdit.kodeToko || '');
      setToko(recordToEdit.toko || '');
      setAs(recordToEdit.as || '-');
      setAm(recordToEdit.am || '-');
      setBatch(recordToEdit.batch || 'Batch 1');
      setCabang(recordToEdit.cabang || 'SBY');
      setKeterangan(recordToEdit.keterangan || 'OFFLINE CLASS');

      setH1(recordToEdit.tanggalH1 ? dateToIso(recordToEdit.tanggalH1) : '');
      setH2(recordToEdit.tanggalH2 ? dateToIso(recordToEdit.tanggalH2) : '');
      setH3(recordToEdit.tanggalH3 ? dateToIso(recordToEdit.tanggalH3) : '');
      setH4(recordToEdit.tanggalH4 ? dateToIso(recordToEdit.tanggalH4) : '');
      setH5(recordToEdit.tanggalH5 ? dateToIso(recordToEdit.tanggalH5) : '');
      setH6(recordToEdit.tanggalH6 ? dateToIso(recordToEdit.tanggalH6) : '');
      setH7(recordToEdit.tanggalH7 ? dateToIso(recordToEdit.tanggalH7) : '');
      setH8(recordToEdit.tanggalH8 ? dateToIso(recordToEdit.tanggalH8) : '');
      setH9(recordToEdit.tanggalH9 ? dateToIso(recordToEdit.tanggalH9) : '');
      setH10(recordToEdit.tanggalH10 ? dateToIso(recordToEdit.tanggalH10) : '');

      if (recordToEdit.tanggalH1 || recordToEdit.tanggalH2) {
        setShowMultiDay(true);
      } else {
        setShowMultiDay(false);
      }
    } else {
      // Default new record
      setSheetCode(defaultSheetCode && defaultSheetCode !== 'MASTER' ? defaultSheetCode : 'SBM');
      setTanggalIso('2026-10-12');
      setNik('');
      setNama('');
      setJabatan('Store Jr. Leader');
      setKodeToko('');
      setToko('');
      setAs('-');
      setAm('-');
      setBatch('Batch 1');
      setCabang('SBY');
      setKeterangan('OFFLINE CLASS');
      setH1(''); setH2(''); setH3(''); setH4(''); setH5('');
      setH6(''); setH7(''); setH8(''); setH9(''); setH10('');
      setShowMultiDay(false);
    }
  }, [recordToEdit, defaultSheetCode, isOpen]);

  // Selected training sheet label
  const selectedSheetMeta = (sheetList && sheetList.find(s => s.code === sheetCode)) || (sheetList && sheetList[0]) || SHEET_LIST[0];
  const jenisTraining = selectedSheetMeta?.name || 'TRAINING';
  const tanggalIndo = isoToDateIndo(tanggalIso);

  // Collect all active dates entered for the current record
  const currentInputDates = useMemo(() => {
    const dates: string[] = [];
    if (tanggalIso) dates.push(tanggalIso);
    if (showMultiDay) {
      [h1, h2, h3, h4, h5, h6, h7, h8, h9, h10].forEach(h => {
        if (h) dates.push(h);
      });
    }
    return dates.map(d => normalizeDateKey(d)).filter(Boolean);
  }, [tanggalIso, showMultiDay, h1, h2, h3, h4, h5, h6, h7, h8, h9, h10]);

  // Live Clash Preview: Check if store or NIK will clash across ALL 19 sheets (Hooks must run before any return!)
  const clashPreview = useMemo(() => {
    const cleanKode = kodeToko.trim().toUpperCase().replace(/\.$/, '');
    const cleanNik = nik.trim();

    if ((!cleanKode && !cleanNik) || currentInputDates.length === 0) return null;

    const currentId = recordToEdit?.id;
    const storeClashes: { record: TrainingRecord; clashDate: string }[] = [];
    const nikClashes: { record: TrainingRecord; clashDate: string }[] = [];

    existingRecords.forEach(r => {
      if (r.id === currentId) return;
      const rDates = getAllSessionDates(r);
      
      // Find overlap
      for (const d of rDates) {
        const normD = normalizeDateKey(d);
        if (normD && currentInputDates.includes(normD)) {
          if (cleanKode && r.kodeToko && r.kodeToko.trim().toUpperCase().replace(/\.$/, '') === cleanKode) {
            if (!storeClashes.some(c => c.record.id === r.id)) {
              storeClashes.push({ record: r, clashDate: d });
            }
          }
          if (cleanNik && r.nik && r.nik.trim() === cleanNik) {
            if (!nikClashes.some(c => c.record.id === r.id)) {
              nikClashes.push({ record: r, clashDate: d });
            }
          }
        }
      }
    });

    return {
      storeClashes,
      nikClashes,
      hasClash: storeClashes.length > 0 || nikClashes.length > 0,
    };
  }, [kodeToko, nik, currentInputDates, existingRecords, recordToEdit]);

  const previewPenggabungan = generatePenggabunganKey(tanggalIndo, nik, jenisTraining);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nik.trim() || !nama.trim() || !kodeToko.trim() || !tanggalIndo) {
      return;
    }

    onSave({
      id: recordToEdit ? recordToEdit.id : `rec-${Date.now()}`,
      sheetCode,
      tanggalAwal: tanggalIndo,
      nik: nik.trim(),
      nama: nama.trim().toUpperCase(),
      jabatan: jabatan.trim(),
      kodeToko: kodeToko.trim().toUpperCase(),
      toko: toko.trim().toUpperCase(),
      as: as.trim() || '-',
      am: am.trim() || '-',
      batch: batch.trim(),
      jenisTraining,
      cabang: cabang.trim().toUpperCase(),
      keterangan: keterangan.trim(),
      tanggalH1: h1 ? isoToDateIndo(h1) : undefined,
      tanggalH2: h2 ? isoToDateIndo(h2) : undefined,
      tanggalH3: h3 ? isoToDateIndo(h3) : undefined,
      tanggalH4: h4 ? isoToDateIndo(h4) : undefined,
      tanggalH5: h5 ? isoToDateIndo(h5) : undefined,
      tanggalH6: h6 ? isoToDateIndo(h6) : undefined,
      tanggalH7: h7 ? isoToDateIndo(h7) : undefined,
      tanggalH8: h8 ? isoToDateIndo(h8) : undefined,
      tanggalH9: h9 ? isoToDateIndo(h9) : undefined,
      tanggalH10: h10 ? isoToDateIndo(h10) : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col transition-colors">
        {/* Indomaret Authentic Tri-Color Accent */}
        <div className="h-1.5 w-full indomaret-stripe shrink-0" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
              {recordToEdit ? 'Ubah Data Jadwal Training' : 'Tambah Jadwal Training Baru'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sistem otomatis mengkroscek potensi DOUBLE TOKO &amp; BENTROK NIK di seluruh sheet training secara real-time.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Live Cross-check Banner */}
          {clashPreview && clashPreview.hasClash && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 rounded-xl space-y-3 text-xs shadow-xs animate-in fade-in duration-150">
              {/* Double NIK Clash Warning */}
              {clashPreview.nikClashes.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-600 text-white shrink-0 mt-0.5 shadow-2xs">
                    <UserX className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-purple-900 dark:text-purple-200 text-[13px] block">
                      ⛔ PERINGATAN BENTROK NIK ({clashPreview.nikClashes.length} bentrok)
                    </span>
                    <p className="text-purple-950 dark:text-purple-200 mt-0.5">
                      NIK <strong>{nik}</strong> sudah terdaftar di sesi training lain pada tanggal yang sama:
                    </p>
                    <div className="mt-1.5 space-y-1 bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-purple-200 dark:border-purple-800">
                      {clashPreview.nikClashes.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] text-slate-800 dark:text-slate-200">
                          <span>
                            • <strong>{c.record.nama}</strong> ({c.record.jenisTraining} · Sheet <strong>{c.record.sheetCode}</strong>)
                          </span>
                          <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                            {c.clashDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Double Toko Clash Warning */}
              {clashPreview.storeClashes.length > 0 && (
                <div className="flex items-start gap-2.5 pt-2 border-t border-rose-200 dark:border-rose-800">
                  <div className="p-1.5 rounded-lg bg-[#E31B23] text-white shrink-0 mt-0.5 shadow-2xs">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-[#E31B23] dark:text-red-300 text-[13px] block">
                      ⚠️ PERINGATAN DOUBLE TOKO ({clashPreview.storeClashes.length} personil bentrok)
                    </span>
                    <p className="text-rose-950 dark:text-red-200 mt-0.5">
                      Toko <strong>{kodeToko.toUpperCase()}</strong> ({toko || clashPreview.storeClashes[0].record.toko || 'Toko'}) sudah mengirimkan personil pada tanggal yang sama:
                    </p>
                    <div className="mt-1.5 space-y-1 bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-red-200 dark:border-red-800">
                      {clashPreview.storeClashes.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] text-slate-800 dark:text-slate-200">
                          <span>
                            • <strong>{c.record.nama}</strong> ({c.record.jabatan} · {c.record.jenisTraining} [Sheet {c.record.sheetCode}])
                          </span>
                          <span className="font-mono font-bold text-[#E31B23] dark:text-red-400">
                            {c.clashDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Safe Check Badge if inputs filled and no clash */}
          {kodeToko && nik && tanggalIndo && clashPreview && !clashPreview.hasClash && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Status Kroscek Aman:</strong> Toko <strong>{kodeToko.toUpperCase()}</strong> dan NIK <strong>{nik}</strong> tidak memiliki jadwal bentrok di 19 sheet training pada tanggal {tanggalIndo}.
              </span>
            </div>
          )}

          {/* Sheet & Training Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                SHEET / PROGRAM TRAINING *
              </label>
              <select
                value={sheetCode}
                onChange={e => setSheetCode(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              >
                {sheetList.map(s => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                BATCH / GELOMBANG *
              </label>
              <select
                value={batch}
                onChange={e => setBatch(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              >
                {Array.from({ length: 20 }, (_, i) => `Batch ${i + 1}`).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker Input */}
          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#005BAC] dark:text-blue-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#005BAC] dark:text-blue-400" />
                <span>PILIH TANGGAL AWAL / PELAKSANAAN *</span>
              </label>
              <span className="text-xs font-bold text-[#005BAC] dark:text-blue-200 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-700 shadow-xs">
                {tanggalIndo || 'Belum dipilih'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <input
                type="date"
                value={tanggalIso}
                onChange={e => setTanggalIso(e.target.value)}
                className="sm:col-span-2 px-3 py-2 text-xs border border-blue-300 dark:border-blue-700 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium cursor-pointer shadow-xs"
                required
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTanggalIso(new Date().toISOString().split('T')[0])}
                  className="px-2 py-1.5 text-[11px] font-medium text-[#005BAC] dark:text-blue-300 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-100 dark:hover:bg-slate-700 flex-1 text-center"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    setTanggalIso(d.toISOString().split('T')[0]);
                  }}
                  className="px-2 py-1.5 text-[11px] font-medium text-[#005BAC] dark:text-blue-300 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-100 dark:hover:bg-slate-700 flex-1 text-center"
                >
                  +7 Hari
                </button>
              </div>
            </div>
          </div>

          {/* Personnel Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                NIK *
              </label>
              <input
                type="text"
                value={nik}
                onChange={e => setNik(e.target.value)}
                placeholder="Misal: 2015779889"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden font-mono"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                NAMA LENGKAP KARYAWAN *
              </label>
              <input
                type="text"
                value={nama}
                onChange={e => setNama(e.target.value.toUpperCase())}
                placeholder="NAMA LENGKAP PESERTA"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden uppercase font-semibold"
                required
              />
            </div>
          </div>

          {/* Toko & Jabatan Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                KODE TOKO *
              </label>
              <input
                type="text"
                value={kodeToko}
                onChange={e => setKodeToko(e.target.value.toUpperCase())}
                placeholder="Contoh: T33F"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden font-mono uppercase font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                NAMA TOKO
              </label>
              <input
                type="text"
                value={toko}
                onChange={e => setToko(e.target.value.toUpperCase())}
                placeholder="Misal: TOKO KENJERAN"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                JABATAN *
              </label>
              <select
                value={jabatan}
                onChange={e => setJabatan(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden font-medium"
              >
                {JABATAN_OPTIONS.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
                {!JABATAN_OPTIONS.includes(jabatan) && jabatan && (
                  <option value={jabatan}>{jabatan}</option>
                )}
              </select>
            </div>
          </div>

          {/* Area Supervisor (AS), Area Manager (AM), Cabang */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                CABANG *
              </label>
              <select
                value={cabang}
                onChange={e => setCabang(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="SBY">SBY (Surabaya)</option>
                <option value="JAP">JAP (Jayapura)</option>
                <option value="MNK">MNK (Manokwari)</option>
                <option value="SON">SON (Sorong)</option>
                <option value="MRK">MRK (Merauke)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                AREA SUPERVISOR (AS)
              </label>
              <input
                type="text"
                value={as}
                onChange={e => setAs(e.target.value)}
                placeholder="Nama AS (atau -)"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                AREA MANAGER (AM)
              </label>
              <input
                type="text"
                value={am}
                onChange={e => setAm(e.target.value)}
                placeholder="Nama AM (atau -)"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Metode Training */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              KETERANGAN / METODE TRAINING
            </label>
            <select
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="OFFLINE CLASS">OFFLINE CLASS</option>
              <option value="FULL LMS">FULL LMS</option>
              <option value="LIVE STREAMING">LIVE STREAMING</option>
              <option value="OFFLINE CLASS H1">OFFLINE CLASS H1</option>
              <option value="OFFLINE CLASS H2">OFFLINE CLASS H2</option>
              <option value="HYBRID">HYBRID</option>
              <option value="-">-</option>
            </select>
          </div>

          {/* Multi-day schedule accordion */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMultiDay(!showMultiDay)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#005BAC] dark:text-blue-400" />
                <span>Jadwal Lanjutan Multi-Hari (H1 s/d H10) - Opsional</span>
              </div>
              {showMultiDay ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showMultiDay && (
              <div className="p-4 bg-white dark:bg-slate-900 space-y-3 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Isi tanggal jika program training berlangsung beberapa hari (misal Soft Skill H1-H6 atau Eva SC H1-H2). Sistem akan otomatis mengkroscek potensi bentrok di setiap hari.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">TANGGAL H1</label>
                    <input
                      type="date"
                      value={h1}
                      onChange={e => setH1(e.target.value)}
                      className="w-full p-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">TANGGAL H2</label>
                    <input
                      type="date"
                      value={h2}
                      onChange={e => setH2(e.target.value)}
                      className="w-full p-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">TANGGAL H3</label>
                    <input
                      type="date"
                      value={h3}
                      onChange={e => setH3(e.target.value)}
                      className="w-full p-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">TANGGAL H4</label>
                    <input
                      type="date"
                      value={h4}
                      onChange={e => setH4(e.target.value)}
                      className="w-full p-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">TANGGAL H5</label>
                    <input
                      type="date"
                      value={h5}
                      onChange={e => setH5(e.target.value)}
                      className="w-full p-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">TANGGAL H6</label>
                    <input
                      type="date"
                      value={h6}
                      onChange={e => setH6(e.target.value)}
                      className="w-full p-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">TANGGAL H7</label>
                    <input
                      type="date"
                      value={h7}
                      onChange={e => setH7(e.target.value)}
                      className="w-full p-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">TANGGAL H8</label>
                    <input
                      type="date"
                      value={h8}
                      onChange={e => setH8(e.target.value)}
                      className="w-full p-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">TANGGAL H9</label>
                    <input
                      type="date"
                      value={h9}
                      onChange={e => setH9(e.target.value)}
                      className="w-full p-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">TANGGAL H10</label>
                    <input
                      type="date"
                      value={h10}
                      onChange={e => setH10(e.target.value)}
                      className="w-full p-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Formula Penggabungan Preview */}
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 text-[11px] font-mono flex items-center justify-between">
            <span>Formula Penggabungan:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{previewPenggabungan}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#005BAC] hover:bg-[#004785] rounded-lg transition-colors shadow-xs"
            >
              Simpan Jadwal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
