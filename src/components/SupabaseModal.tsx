import React, { useState, useEffect } from 'react';
import { TrainingRecord } from '../types/training';
import { SUPABASE_URL } from '../lib/supabase';
import { checkSupabaseStatus, syncAllRecordsToSupabase, fetchSchedulesFromSupabase } from '../services/supabaseService';
import { generateSupabaseSql } from '../data/sqlGenerator';
import { 
  X, Database, Copy, Check, Download, RefreshCw, 
  ExternalLink, AlertTriangle, ShieldCheck, Cloud, CloudUpload, CloudDownload, Terminal
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: TrainingRecord[];
  onDataLoadedFromCloud: (records: TrainingRecord[]) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  records,
  onDataLoadedFromCloud,
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'sync'>('sql');
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [status, setStatus] = useState<{
    connected: boolean;
    tableExists: boolean;
    rowCount: number;
    message: string;
  } | null>(null);

  const fullSql = React.useMemo(() => generateSupabaseSql(records), [records]);

  // Check Supabase connection when modal opens
  const verifyConnection = async () => {
    setChecking(true);
    const result = await checkSupabaseStatus();
    setStatus(result);
    setChecking(false);
  };

  useEffect(() => {
    if (isOpen) {
      verifyConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(fullSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadSql = () => {
    const blob = new Blob([fullSql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'setup_training_schedules_supabase.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [modalAlert, setModalAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handlePushToCloud = async () => {
    setSyncing(true);
    setModalAlert(null);
    setSyncProgress({ current: 0, total: records.length });
    const result = await syncAllRecordsToSupabase(records, (done, total) => {
      setSyncProgress({ current: done, total });
    });
    setSyncing(false);
    if (result.success) {
      setModalAlert({
        type: 'success',
        message: `Sukses mengunggah ${result.count} data ke Supabase!`,
      });
      verifyConnection();
    } else {
      setModalAlert({
        type: 'error',
        message: `Gagal sinkronisasi: ${result.error}. Pastikan Anda sudah menjalankan kode SQL di Supabase SQL Editor terlebih dahulu.`,
      });
    }
  };

  const handlePullFromCloud = async () => {
    setSyncing(true);
    setModalAlert(null);
    try {
      const cloudRecords = await fetchSchedulesFromSupabase();
      onDataLoadedFromCloud(cloudRecords);
      setModalAlert({
        type: 'success',
        message: `Berhasil menarik ${cloudRecords.length} data dari Supabase!`,
      });
      verifyConnection();
    } catch (err: any) {
      setModalAlert({
        type: 'error',
        message: `Gagal mengambil data dari Supabase: ${err.message}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Koneksi Database Supabase
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Permanen
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                {SUPABASE_URL}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Status Cloud:</span>
            {checking ? (
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                Memeriksa koneksi...
              </span>
            ) : status?.tableExists ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Tersambung · Tabel Aktif ({status.rowCount} Baris Data)
              </span>
            ) : status?.connected ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Tersambung ke Server · Tabel Belum Dibuat
              </span>
            ) : (
              <span className="text-rose-700 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Gagal Tersambung
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={verifyConnection}
              disabled={checking}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
              Cek Ulang
            </button>
            <a
              href="https://supabase.com/dashboard/project/mmrjblorrtfjmiqhodcl/sql"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded hover:bg-emerald-100 flex items-center gap-1"
            >
              <span>Buka SQL Editor</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {modalAlert && (
          <div className={`mx-6 mt-3 p-3 rounded-xl text-xs flex items-center justify-between border ${
            modalAlert.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}>
            <span>{modalAlert.message}</span>
            <button
              onClick={() => setModalAlert(null)}
              className="text-slate-400 hover:text-slate-700 ml-2 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'sql'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Kode Lengkap SQL Editor</span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'sync'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Sinkronisasi Otomatis (Push / Pull)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'sql' ? (
            <div className="space-y-4">
              {/* Instructions */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                <p className="font-bold">Langkah Cepat Memindahkan Semua Data ke Supabase:</p>
                <ol className="list-decimal pl-4 mt-1.5 space-y-1 text-blue-800">
                  <li>
                    Klik tombol <strong>"Salin Semua Kode SQL"</strong> di bawah ini (atau unduh file <code>.sql</code>).
                  </li>
                  <li>
                    Buka menu <strong>SQL Editor</strong> di dashboard Supabase Anda (
                    <a
                      href="https://supabase.com/dashboard/project/mmrjblorrtfjmiqhodcl/sql"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold text-blue-700"
                    >
                      Buka Supabase SQL Editor
                    </a>
                    ).
                  </li>
                  <li>
                    Tempelkan (Paste) kodenya lalu klik tombol <strong>"Run"</strong> (atau tekan Ctrl+Enter).
                  </li>
                  <li>
                    Selesai! Tabel <code>training_schedules</code> beserta seluruh {records.length} baris data dan hak akses RLS langsung siap.
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  PostgreSQL DDL + RLS + {records.length} Baris Data INSERT
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadSql}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh File .sql
                  </button>
                  <button
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Tersalin ke Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Salin Semua Kode SQL
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                  <span>supabase_setup.sql</span>
                  <span>{Math.round(fullSql.length / 1024)} KB</span>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[340px] leading-relaxed selection:bg-emerald-900">
                  {fullSql}
                </pre>
              </div>
            </div>
          ) : (
            /* Sync Push/Pull Tab */
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
                <h4 className="font-bold text-slate-900 text-sm">Status Sinkronisasi Cloud</h4>
                <p>
                  URL Supabase telah dikonfigurasi secara permanen di aplikasi:
                  <br />
                  <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-900">
                    {SUPABASE_URL}
                  </code>
                </p>
                <p className="text-slate-500">
                  Setelah menjalankan skrip SQL di Supabase SQL Editor sekali saja, Anda dapat mengirim data baru atau menarik data kapan saja menggunakan tombol di bawah ini.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Push */}
                <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CloudUpload className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Kirim ke Supabase (Push)</h5>
                    <p className="text-xs text-slate-500 mt-1">
                      Mengunggah seluruh {records.length} data lokal ke tabel <code>training_schedules</code> di Supabase.
                    </p>
                  </div>
                  <button
                    onClick={handlePushToCloud}
                    disabled={syncing}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {syncing && syncProgress ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Mengunggah ({syncProgress.current}/{syncProgress.total})...
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-3.5 h-3.5" />
                        Push Semua Data ke Cloud
                      </>
                    )}
                  </button>
                </div>

                {/* Pull */}
                <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CloudDownload className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Tarik dari Supabase (Pull)</h5>
                    <p className="text-xs text-slate-500 mt-1">
                      Mengunduh data terbaru dari tabel Supabase dan menyegarkan tampilan web aplikasi.
                    </p>
                  </div>
                  <button
                    onClick={handlePullFromCloud}
                    disabled={syncing}
                    className="w-full py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Mengambil Data...
                      </>
                    ) : (
                      <>
                        <CloudDownload className="w-3.5 h-3.5" />
                        Pull Data Terbaru
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
