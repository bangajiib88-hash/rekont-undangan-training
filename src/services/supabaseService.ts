import { supabase, SUPABASE_URL } from '../lib/supabase';
import { TrainingRecord } from '../types/training';
import { validateAndEnrichRecords, mapTrainingToSheetCode } from '../utils/trainingUtils';

export const TABLE_NAME = 'training_schedules';

export interface SupabaseRow {
  id: string;
  sheet_code?: string;
  nik: string;
  nama: string;
  jabatan?: string;
  kode_toko: string;
  toko?: string;
  as?: string;
  am?: string;
  tanggal_awal: string;
  jenis_training: string;
  batch?: string;
  cabang: string;
  status: string;
  berdasarkan_nik: number;
  berdasarkan_kode_toko: number;
  penggabungan: string;
  keterangan: string;
  tanggal_h1?: string;
  tanggal_h2?: string;
  tanggal_h3?: string;
  tanggal_h4?: string;
  tanggal_h5?: string;
  tanggal_h6?: string;
  tanggal_h7?: string;
  tanggal_h8?: string;
  tanggal_h9?: string;
  tanggal_h10?: string;
  updated_at?: string;
}

export function recordToRow(r: TrainingRecord): SupabaseRow {
  return {
    id: r.id,
    sheet_code: r.sheetCode || mapTrainingToSheetCode(r.jenisTraining),
    nik: r.nik,
    nama: r.nama,
    jabatan: r.jabatan || 'Crew Toko',
    kode_toko: r.kodeToko,
    toko: r.toko || '',
    as: r.as || '-',
    am: r.am || '-',
    tanggal_awal: r.tanggalAwal,
    jenis_training: r.jenisTraining,
    batch: r.batch || 'Batch 1',
    cabang: r.cabang,
    status: r.status,
    berdasarkan_nik: r.berdasarkanNik,
    berdasarkan_kode_toko: r.berdasarkanKodeToko,
    penggabungan: r.penggabungan,
    keterangan: r.keterangan || '-',
    tanggal_h1: r.tanggalH1 || null as any,
    tanggal_h2: r.tanggalH2 || null as any,
    tanggal_h3: r.tanggalH3 || null as any,
    tanggal_h4: r.tanggalH4 || null as any,
    tanggal_h5: r.tanggalH5 || null as any,
    tanggal_h6: r.tanggalH6 || null as any,
    tanggal_h7: r.tanggalH7 || null as any,
    tanggal_h8: r.tanggalH8 || null as any,
    tanggal_h9: r.tanggalH9 || null as any,
    tanggal_h10: r.tanggalH10 || null as any,
    updated_at: new Date().toISOString(),
  };
}

export function rowToRecord(row: SupabaseRow): TrainingRecord {
  return {
    id: row.id,
    sheetCode: row.sheet_code || mapTrainingToSheetCode(row.jenis_training),
    nik: row.nik,
    nama: row.nama,
    jabatan: row.jabatan || 'Crew Toko',
    kodeToko: row.kode_toko,
    toko: row.toko || '',
    as: row.as || '-',
    am: row.am || '-',
    tanggalAwal: row.tanggal_awal,
    jenisTraining: row.jenis_training,
    batch: row.batch || 'Batch 1',
    cabang: row.cabang,
    status: (row.status as any) || 'AMAN',
    berdasarkanNik: row.berdasarkan_nik ?? 1,
    berdasarkanKodeToko: row.berdasarkan_kode_toko ?? 1,
    penggabungan: row.penggabungan || '',
    keterangan: row.keterangan || '-',
    tanggalH1: row.tanggal_h1 || undefined,
    tanggalH2: row.tanggal_h2 || undefined,
    tanggalH3: row.tanggal_h3 || undefined,
    tanggalH4: row.tanggal_h4 || undefined,
    tanggalH5: row.tanggal_h5 || undefined,
    tanggalH6: row.tanggal_h6 || undefined,
    tanggalH7: row.tanggal_h7 || undefined,
    tanggalH8: row.tanggal_h8 || undefined,
    tanggalH9: row.tanggal_h9 || undefined,
    tanggalH10: row.tanggal_h10 || undefined,
  };
}

/**
 * Checks connection and table presence in Supabase
 */
export async function checkSupabaseStatus(): Promise<{
  connected: boolean;
  tableExists: boolean;
  rowCount: number;
  message: string;
}> {
  try {
    const { data, count, error } = await supabase
      .from(TABLE_NAME)
      .select('id', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('Could not find')) {
        return {
          connected: true,
          tableExists: false,
          rowCount: 0,
          message: `Tersambung ke Supabase (${SUPABASE_URL}), namun tabel '${TABLE_NAME}' belum dibuat di SQL Editor.`,
        };
      }
      return {
        connected: false,
        tableExists: false,
        rowCount: 0,
        message: `Koneksi gagal: ${error.message}`,
      };
    }

    return {
      connected: true,
      tableExists: true,
      rowCount: count ?? 0,
      message: `Tersambung ke Supabase. Ditemukan ${count ?? 0} data di tabel '${TABLE_NAME}'.`,
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      rowCount: 0,
      message: err.message || 'Gagal menghubungi server Supabase',
    };
  }
}

/**
 * Fetches all training schedules from Supabase
 */
export async function fetchSchedulesFromSupabase(): Promise<TrainingRecord[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('tanggal_awal', { ascending: true });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  const records = (data as SupabaseRow[]).map(rowToRecord);
  return validateAndEnrichRecords(records);
}

/**
 * Pushes/upserts batch of records to Supabase in chunks of 50
 */
export async function syncAllRecordsToSupabase(
  records: TrainingRecord[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: boolean; count: number; error?: string }> {
  const CHUNK_SIZE = 50;
  const rows = records.map(recordToRow);
  let completed = 0;

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      return {
        success: false,
        count: completed,
        error: error.message,
      };
    }
    completed += chunk.length;
    if (onProgress) {
      onProgress(completed, rows.length);
    }
  }

  return { success: true, count: completed };
}

/**
 * Inserts or updates a single record in Supabase
 */
export async function saveRecordToSupabase(record: TrainingRecord): Promise<void> {
  const row = recordToRow(record);
  const { error } = await supabase.from(TABLE_NAME).upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('Failed to save to Supabase:', error);
    throw error;
  }
}

/**
 * Deletes record from Supabase
 */
export async function deleteRecordFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
  if (error) {
    console.error('Failed to delete from Supabase:', error);
    throw error;
  }
}

/**
 * Deletes all records from Supabase table
 */
export async function deleteAllRecordsFromSupabase(): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete all records where id is not null/empty
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .neq('id', '___non_existent_id___');

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
