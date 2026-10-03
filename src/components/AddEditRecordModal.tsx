import React, { useState, useEffect, useMemo } from 'react';
import { TrainingRecord, SHEET_LIST, SheetDefinition, RawTrainingInput } from '../types/training';
import { X, AlertCircle, Calendar, ChevronDown, ChevronUp, Layers, Check } from 'lucide-react';
import { 
  generatePenggabunganKey, 
  dateToIso, 
  isoToDateIndo, 
  getAllSessionDates,
  mapTrainingToSheetCode 
} from '../utils/trainingUtils';

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
  const [jabatan, setJabatan] = useState<string>('Crew Toko');
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
      setTanggalIso(dateToIso(recordToEdit.tanggalAwal));
      setNik(recordToEdit.nik);
      setNama(recordToEdit.nama);
      setJabatan(recordToEdit.jabatan || 'Crew Toko');
      setKodeToko(recordToEdit.kodeToko);
      setToko(recordToEdit.toko || '');
      setAs(recordToEdit.as || '-');
      setAm(recordToEdit.am || recordToEdit.nama);
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
      }
    } else {
      // Default new record
      setSheetCode(defaultSheetCode && defaultSheetCode !== 'MASTER' ? defaultSheetCode : 'SBM');
      setTanggalIso('2026-10-12');
      setNik('');
      setNama('');
      setJabatan('Crew Toko');
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

  // Live Clash Preview: Check if store or NIK will clash (Hooks must run before any return!)
  const clashPreview = useMemo(() => {
    if (!kodeToko || !tanggalIndo) return null;

    const currentId = recordToEdit?.id;
    const storeClashes = existingRecords.filter(r => 
      r.id !== currentId && 
      r.kodeToko.trim().toUpperCase() === kodeToko.trim().toUpperCase() &&
      r.tanggalAwal === tanggalIndo
    );

    const nikClashes = nik ? existingRecords.filter(r => 
      r.id !== currentId &&
      r.nik.trim() === nik.trim() &&
      r.tanggalAwal === tanggalIndo
    ) : [];

    return {
      storeClashes,
      nikClashes,
    };
  }, [kodeToko, tanggalIndo, nik, existingRecords, recordToEdit]);

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
      as: as.trim(),
      am: am.trim(),
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
              {recordToEdit ? 'Ubah Data Jadwal Training' : 'Tambah Jadwal Training Baru'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sistem akan otomatis mengkroscek potensi DOUBLE TOKO &amp; BENTROK NIK di seluruh sheet
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Clash Alert Banner */}
          {clashPreview && (clashPreview.storeClashes.length > 0 || clashPreview.nikClashes.length > 0) && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2 text-xs text-rose-800 dark:text-red-300">
              {clashPreview.storeClashes.length > 0 && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#E31B23] dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">PERINGATAN DOUBLE TOKO:</span> Toko <strong>{kodeToko.toUpperCase()}</strong> sudah memiliki <strong>{clashPreview.storeClashes.length} personil lain</strong> terdaftar pada tanggal yang sama:
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {clashPreview.storeClashes.map(c => (
                        <li key={c.id}>
                          <strong>{c.nama}</strong> ({c.jenisTraining} · Cabang {c.cabang})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {clashPreview.nikClashes.length > 0 && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900 dark:text-amber-300">PERINGATAN BENTROK NIK:</span> NIK ini sudah terjadwal di training lain pada hari yang sama ({clashPreview.nikClashes[0].jenisTraining}).
                  </div>
                </div>
              )}
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
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setNama(val);
                  if (!recordToEdit && (!am || am === nama || am === '-')) {
                    setAm(val);
                  }
                }}
                placeholder="NAMA LENGKAP PESERTA"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden uppercase font-semibold"
                required
              />
            </div>
          </div>

          {/* Toko & Jabatan */}
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
                JABATAN
              </label>
              <input
                type="text"
                value={jabatan}
                onChange={e => setJabatan(e.target.value)}
                placeholder="Crew Toko / Barista / ACOS"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden"
              />
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
                placeholder="Nama AS"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  AREA MANAGER (AM)
                </label>
                {nama && (
                  <button
                    type="button"
                    onClick={() => setAm(nama)}
                    className="text-[10px] text-[#005BAC] dark:text-blue-400 hover:underline font-semibold"
                    title="Samakan dengan nama peserta"
                  >
                    Samakan Peserta
                  </button>
                )}
              </div>
              <input
                type="text"
                value={am}
                onChange={e => setAm(e.target.value.toUpperCase())}
                placeholder="Sama dengan nama peserta"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden uppercase font-semibold"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                * Otomatis terisi sama dengan nama peserta
              </span>
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
              <option value="-">-</option>
            </select>
          </div>

          {/* Optional Multi-Day Sessions Toggle (H1 - H10) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowMultiDay(!showMultiDay)}
              className="text-xs font-bold text-[#005BAC] dark:text-blue-400 hover:underline flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showMultiDay ? 'Sembunyikan Sesi Hari H1 - H10' : '+ Tambah Tanggal Multi-Hari (H1 s/d H10)'}</span>
              {showMultiDay ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showMultiDay && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Pilih tanggal untuk sesi multi-hari. Sistem akan otomatis mendeteksi bentrok jadwal di setiap hari yang ditentukan.
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
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
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
