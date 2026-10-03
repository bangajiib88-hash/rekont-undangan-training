import React, { useState, useRef } from 'react';
import { TrainingRecord } from '../types/training';
import { parseCsvText, parseSpreadsheetBuffer, downloadCsv, exportToXlsx } from '../utils/csvParser';
import { X, Upload, Download, FileSpreadsheet, RotateCcw, Check, AlertCircle, ShieldCheck } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: TrainingRecord[];
  onImportRecords: (newRecords: TrainingRecord[]) => void;
  onResetToDefault: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  records,
  onImportRecords,
  onResetToDefault,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseSpreadsheetBuffer(buffer);
      if (parsed.length > 0) {
        onImportRecords(parsed);
        setStatusMessage({
          type: 'success',
          text: `Berhasil mengimpor ${parsed.length} baris data dari file "${file.name}"! Data lama tetap aman.`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Tidak ada baris data valid yang terbaca dari file ini.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Gagal membaca file: ${err.message || 'Format tidak didukung'}`,
      });
    }
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    try {
      const parsed = parseCsvText(pasteText);
      if (parsed.length > 0) {
        onImportRecords(parsed);
        setStatusMessage({
          type: 'success',
          text: `Berhasil mengimpor ${parsed.length} data dari teks! Data lama tetap aman.`,
        });
        setPasteText('');
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Format teks CSV tidak valid atau kosong.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat memproses teks CSV.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Indomaret Authentic Tri-Color Accent */}
        <div className="h-1.5 w-full indomaret-stripe shrink-0" />
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#005BAC] dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
              Sinkronisasi Spreadsheet (Excel &amp; CSV)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40 px-6 pt-3 gap-2">
          <button
            onClick={() => { setActiveTab('import'); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-[#005BAC] text-[#005BAC] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Import File / Salin Teks
          </button>
          <button
            onClick={() => { setActiveTab('export'); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-[#005BAC] text-[#005BAC] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Export (Unduh Data)
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-red-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#E31B23] dark:text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {activeTab === 'import' ? (
            <div className="space-y-5">
              {/* Safe Append Banner */}
              <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950 dark:text-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200">Data Sebelumnya Tetap Tersimpan Aman</h4>
                  <p className="text-emerald-700 dark:text-emerald-300 mt-0.5 leading-relaxed text-[11px]">
                    Saat mengunggah file baru, jadwal yang sudah ada <strong>tidak akan terhapus</strong>. 
                    Setiap baris data baru akan digabungkan dan otomatis ditempatkan ke sheet yang sesuai dengan program trainingnya.
                  </p>
                </div>
              </div>

              {/* File upload dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  1. Unggah File Spreadsheet (.xlsx, .xls, .csv)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#005BAC] dark:hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/20"
                >
                  <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Klik untuk memilih file spreadsheet dari komputer Anda
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Mendukung format file Excel (.xlsx, .xls) dan CSV dengan header standar
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Paste CSV textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  2. Atau Tempel (Paste) Teks CSV Langsung
                </label>
                <textarea
                  rows={4}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder="Tempel baris teks CSV di sini (misal: 12 Oktober 2026,2015779889,NAMA,KODE TOKO...)"
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handlePasteImport}
                  disabled={!pasteText.trim()}
                  className="mt-2 px-3 py-1.5 text-xs font-bold text-white bg-[#005BAC] hover:bg-[#004785] rounded-lg disabled:opacity-50 transition-colors shadow-xs"
                >
                  Proses &amp; Import Teks CSV
                </button>
              </div>

              {/* Reset to default seed */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Kembalikan Data Awal</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Muat ulang dataset spreadsheet awal</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onResetToDefault();
                    setStatusMessage({
                      type: 'success',
                      text: 'Data telah berhasil direset ke dataset awal!',
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset ke Awal
                </button>
              </div>
            </div>
          ) : (
            /* Export Tab */
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Ekspor seluruh data jadwal training ({records.length} baris) beserta hasil kalkulasi otomatis (Status, Berdasarkan NIK, Berdasarkan Kode Toko, dan Formula Penggabungan):
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    exportToXlsx(records);
                    setStatusMessage({
                      type: 'success',
                      text: 'File Excel (.xlsx) berhasil diunduh!',
                    });
                  }}
                  className="p-4 border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50 rounded-xl text-center transition-all group cursor-pointer"
                >
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2 group-hover:scale-105 transition-transform" />
                  <span className="block text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Unduh Format Excel (.xlsx)
                  </span>
                  <span className="block text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                    Kompatibel dengan Microsoft Excel &amp; Google Sheets
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadCsv(records);
                    setStatusMessage({
                      type: 'success',
                      text: 'File CSV berhasil diunduh!',
                    });
                  }}
                  className="p-4 border border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 hover:bg-blue-100/60 dark:hover:bg-blue-900/50 rounded-xl text-center transition-all group cursor-pointer"
                >
                  <Download className="w-8 h-8 text-[#005BAC] dark:text-blue-400 mx-auto mb-2 group-hover:scale-105 transition-transform" />
                  <span className="block text-xs font-bold text-blue-900 dark:text-blue-200">
                    Unduh Format CSV (.csv)
                  </span>
                  <span className="block text-[11px] text-blue-700 dark:text-blue-400 mt-1">
                    Struktur kolom identik dengan file spreadsheet sumber
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
