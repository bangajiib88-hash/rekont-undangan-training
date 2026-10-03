import React, { useState } from 'react';
import { X, Plus, Layers, Database, Sparkles, AlertCircle } from 'lucide-react';

interface AddSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSheet: (newSheet: { code: string; name: string; description?: string }) => Promise<void>;
  existingSheetCodes: string[];
  totalCurrentSheets: number;
}

export const AddSheetModal: React.FC<AddSheetModalProps> = ({
  isOpen,
  onClose,
  onAddSheet,
  existingSheetCodes,
  totalCurrentSheets,
}) => {
  const [sheetName, setSheetName] = useState('');
  const [sheetCode, setSheetCode] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const nextNumber = totalCurrentSheets + 1;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSheetName(val);
    setErrorMessage(null);

    // Auto-suggest sheet code if user hasn't manually edited code
    if (!sheetCode || sheetCode.startsWith('SHEET_')) {
      const sanitized = val
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 15);
      if (sanitized) {
        setSheetCode(sanitized);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = sheetName.trim();
    let cleanCode = sheetCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');

    if (!cleanName) {
      setErrorMessage('Nama Sheet / Training wajib diisi.');
      return;
    }

    if (!cleanCode) {
      cleanCode = `SHEET_${nextNumber}`;
    }

    // Check if code already exists
    if (existingSheetCodes.some(c => c.toUpperCase() === cleanCode)) {
      setErrorMessage(`Kode Sheet "${cleanCode}" sudah digunakan. Silakan gunakan kode lain.`);
      return;
    }

    // Format full display name if user didn't include numbering prefix
    const hasNumberPrefix = /^\d+\.\s*/.test(cleanName);
    const fullName = hasNumberPrefix ? cleanName : `${nextNumber}. ${cleanName}`;

    try {
      setIsSubmitting(true);
      await onAddSheet({
        code: cleanCode,
        name: fullName,
        description: description.trim() || undefined,
      });

      // Reset & close
      setSheetName('');
      setSheetCode('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyimpan dan menyinkronkan sheet baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col transition-colors">
        {/* Indomaret Authentic Tri-Color Accent */}
        <div className="h-1.5 w-full indomaret-stripe shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-[#005BAC] dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Tambah Sheet Training Baru
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sheet baru otomatis langsung tersinkronisasi ke database Supabase
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#E31B23] dark:text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Nama Program Training / Sheet <span className="text-[#E31B23]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: BAKERY (Say Bread & Pastry), KASIR ADVANCED, dsb"
              value={sheetName}
              onChange={handleNameChange}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#005BAC]"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Nomor urut otomatis ditambahkan sebagai: <strong>{nextNumber}. {sheetName || 'Nama Training'}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Kode Singkatan Sheet <span className="text-[#E31B23]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: BAKERY, KASIR_ADV, IC_PRO"
              value={sheetCode}
              onChange={(e) => setSheetCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
              className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#005BAC]"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Digunakan sebagai kode identifikasi teknis di database Supabase (huruf kapital tanpa spasi).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Keterangan / Deskripsi (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Deskripsi modul atau sasaran peserta training..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#005BAC]"
            />
          </div>

          {/* Cloud Sync Notice */}
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
            <Database className="w-4 h-4 text-[#005BAC] dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Sinkronisasi Otomatis ke Supabase</p>
              <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed">
                Begitu sheet disimpan, definisi sheet akan langsung disinkronkan ke Supabase Cloud sehingga komputer dan pengguna lain akan langsung melihat sheet ini.
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#005BAC] hover:bg-[#004785] rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyinkronkan...' : 'Simpan & Sinkronkan Sheet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
