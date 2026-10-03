import { TrainingRecord, SHEET_LIST } from '../types/training';
import { loadDefaultRecords } from './fullDataset';
import { mapTrainingToSheetCode } from '../utils/trainingUtils';

export function generateSupabaseSql(records: TrainingRecord[] = loadDefaultRecords()): string {
  const insertStatements = records.map(r => {
    const id = `'${r.id.replace(/'/g, "''")}'`;
    const sheet = `'${(r.sheetCode || mapTrainingToSheetCode(r.jenisTraining)).replace(/'/g, "''")}'`;
    const nik = `'${r.nik.replace(/'/g, "''")}'`;
    const nama = `'${r.nama.replace(/'/g, "''")}'`;
    const jabatan = `'${(r.jabatan || 'Crew Toko').replace(/'/g, "''")}'`;
    const kodeToko = `'${r.kodeToko.replace(/'/g, "''")}'`;
    const toko = `'${(r.toko || '').replace(/'/g, "''")}'`;
    const asVal = `'${(r.as || '-').replace(/'/g, "''")}'`;
    const amVal = `'${(r.am || '-').replace(/'/g, "''")}'`;
    const tanggal = `'${r.tanggalAwal.replace(/'/g, "''")}'`;
    const training = `'${r.jenisTraining.replace(/'/g, "''")}'`;
    const batch = `'${(r.batch || 'Batch 1').replace(/'/g, "''")}'`;
    const cabang = `'${r.cabang.replace(/'/g, "''")}'`;
    const status = `'${r.status.replace(/'/g, "''")}'`;
    const bNik = r.berdasarkanNik;
    const bToko = r.berdasarkanKodeToko;
    const gabung = `'${r.penggabungan.replace(/'/g, "''")}'`;
    const ket = `'${(r.keterangan || '-').replace(/'/g, "''")}'`;
    const h1 = r.tanggalH1 ? `'${r.tanggalH1.replace(/'/g, "''")}'` : 'NULL';
    const h2 = r.tanggalH2 ? `'${r.tanggalH2.replace(/'/g, "''")}'` : 'NULL';
    const h3 = r.tanggalH3 ? `'${r.tanggalH3.replace(/'/g, "''")}'` : 'NULL';
    const h4 = r.tanggalH4 ? `'${r.tanggalH4.replace(/'/g, "''")}'` : 'NULL';
    const h5 = r.tanggalH5 ? `'${r.tanggalH5.replace(/'/g, "''")}'` : 'NULL';
    const h6 = r.tanggalH6 ? `'${r.tanggalH6.replace(/'/g, "''")}'` : 'NULL';
    const h7 = r.tanggalH7 ? `'${r.tanggalH7.replace(/'/g, "''")}'` : 'NULL';
    const h8 = r.tanggalH8 ? `'${r.tanggalH8.replace(/'/g, "''")}'` : 'NULL';
    const h9 = r.tanggalH9 ? `'${r.tanggalH9.replace(/'/g, "''")}'` : 'NULL';
    const h10 = r.tanggalH10 ? `'${r.tanggalH10.replace(/'/g, "''")}'` : 'NULL';

    return `(${id}, ${sheet}, ${nik}, ${nama}, ${jabatan}, ${kodeToko}, ${toko}, ${asVal}, ${amVal}, ${tanggal}, ${training}, ${batch}, ${cabang}, ${status}, ${bNik}, ${bToko}, ${gabung}, ${ket}, ${h1}, ${h2}, ${h3}, ${h4}, ${h5}, ${h6}, ${h7}, ${h8}, ${h9}, ${h10})`;
  });

  // Generate 19 individual sheet views
  const sheetViewsSql = SHEET_LIST.map(s => {
    const tableName = `sheet_${s.code.toLowerCase()}`;
    return `-- View Sheet: ${s.name}
CREATE OR REPLACE VIEW public.${tableName} AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = '${s.code}';`;
  }).join('\n\n');

  return `-- ===================================================================================
-- SKRIP SETUP SUPABASE LENGKAP: 19 SHEET TRAINING & MASTER SINKRONISASI KROSCEK
-- Proyek Supabase: https://mmrjblorrtfjmiqhodcl.supabase.co
-- ===================================================================================

-- 1. Buat Tabel Master training_schedules jika belum ada
CREATE TABLE IF NOT EXISTS public.training_schedules (
    id TEXT PRIMARY KEY,
    sheet_code TEXT NOT NULL DEFAULT 'SBM',
    nik TEXT NOT NULL,
    nama TEXT NOT NULL,
    jabatan TEXT NOT NULL DEFAULT 'Crew Toko',
    kode_toko TEXT NOT NULL,
    toko TEXT DEFAULT '',
    as_val TEXT DEFAULT '-',
    am_val TEXT DEFAULT '-',
    tanggal_awal TEXT NOT NULL,
    jenis_training TEXT NOT NULL,
    batch TEXT NOT NULL DEFAULT 'Batch 1',
    cabang TEXT NOT NULL DEFAULT 'SBY',
    status TEXT NOT NULL DEFAULT 'AMAN',
    berdasarkan_nik INTEGER NOT NULL DEFAULT 1,
    berdasarkan_kode_toko INTEGER NOT NULL DEFAULT 1,
    penggabungan TEXT,
    keterangan TEXT DEFAULT '-',
    tanggal_h1 TEXT,
    tanggal_h2 TEXT,
    tanggal_h3 TEXT,
    tanggal_h4 TEXT,
    tanggal_h5 TEXT,
    tanggal_h6 TEXT,
    tanggal_h7 TEXT,
    tanggal_h8 TEXT,
    tanggal_h9 TEXT,
    tanggal_h10 TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Migrasi Kolom Tambahan (Untuk memastikan tabel yang sudah ada ter-update tanpa error 42703)
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS sheet_code TEXT DEFAULT 'SBM';
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS jabatan TEXT DEFAULT 'Crew Toko';
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS toko TEXT DEFAULT '';
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS as_val TEXT DEFAULT '-';
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS am_val TEXT DEFAULT '-';
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS batch TEXT DEFAULT 'Batch 1';
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS tanggal_h1 TEXT;
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS tanggal_h2 TEXT;
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS tanggal_h3 TEXT;
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS tanggal_h4 TEXT;
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS tanggal_h5 TEXT;
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS tanggal_h6 TEXT;
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS tanggal_h7 TEXT;
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS tanggal_h8 TEXT;
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS tanggal_h9 TEXT;
ALTER TABLE public.training_schedules ADD COLUMN IF NOT EXISTS tanggal_h10 TEXT;

-- Update baris data yang sheet_code-nya perlu disinkronkan
UPDATE public.training_schedules 
SET sheet_code = CASE 
    WHEN UPPER(jenis_training) LIKE '%YUMMY%' OR UPPER(jenis_training) LIKE '%COFFE%' OR UPPER(jenis_training) LIKE '%YCCG%' OR UPPER(jenis_training) LIKE '%GOLD%' THEN 'YCCG'
    WHEN UPPER(jenis_training) LIKE '%FRIED FOOD IS%' OR UPPER(jenis_training) LIKE '%FFIS%' THEN 'FFIS'
    WHEN UPPER(jenis_training) LIKE '%FRIED FOOD%' OR UPPER(jenis_training) = 'FF' OR UPPER(jenis_training) LIKE '% FF %' THEN 'FF'
    WHEN UPPER(jenis_training) LIKE '%FRESH%' OR UPPER(jenis_training) LIKE '%PERISHABLE%' THEN 'FRESH'
    WHEN UPPER(jenis_training) LIKE '%SAY BREAD%' OR UPPER(jenis_training) LIKE '%SBM%' THEN 'SBM'
    WHEN UPPER(jenis_training) LIKE '%SAY BURGER%' OR UPPER(jenis_training) LIKE '%BURGER%' THEN 'SAY_BURGER'
    WHEN UPPER(jenis_training) LIKE '%DELIVERY ONLINE%' OR UPPER(jenis_training) LIKE '%KLIK FOOD%' OR UPPER(jenis_training) LIKE '%PCDEL%' THEN 'PCDEL'
    WHEN UPPER(jenis_training) LIKE '%SPECIAL STORE%' OR UPPER(jenis_training) = 'SS' THEN 'SS'
    WHEN UPPER(jenis_training) LIKE '%EVA SC%' OR UPPER(jenis_training) LIKE '%EVALUASI%' THEN 'EVA_SC'
    WHEN UPPER(jenis_training) LIKE '%LEADER BARISTA%' THEN 'LEADER_BARISTA'
    WHEN UPPER(jenis_training) LIKE '%BARISTA%' THEN 'BARISTA'
    WHEN UPPER(jenis_training) LIKE '%SOFT SKILL CIF REMIDIAL%' OR UPPER(jenis_training) LIKE '%SOFT SKILL CIF REMEDIAL%' THEN 'SOFT_SKILL_CIF_REMIDIAL'
    WHEN UPPER(jenis_training) LIKE '%SOFT SKILL REMIDIAL%' OR UPPER(jenis_training) LIKE '%SOFT SKILL REMEDIAL%' THEN 'SOFT_SKILL_REMIDIAL'
    WHEN UPPER(jenis_training) LIKE '%SOFT SKILL CIF%' THEN 'SOFT_SKILL_CIF'
    WHEN UPPER(jenis_training) LIKE '%SOFT SKILL%' THEN 'SOFT_SKILL'
    WHEN UPPER(jenis_training) LIKE '%IDELIVERY%' OR UPPER(jenis_training) LIKE '%IDEL%' THEN 'IDEL'
    WHEN UPPER(jenis_training) LIKE '%SJL%' OR UPPER(jenis_training) LIKE '%JURNAL%' THEN 'SJL'
    WHEN UPPER(jenis_training) LIKE '%SSL%' THEN 'SSL'
    WHEN UPPER(jenis_training) LIKE '%CIF%' THEN 'CIF'
    ELSE 'SBM'
END;

-- 3. Index Pencarian Cepat
CREATE INDEX IF NOT EXISTS idx_tr_sheet ON public.training_schedules(sheet_code);
CREATE INDEX IF NOT EXISTS idx_tr_nik_tgl ON public.training_schedules(nik, tanggal_awal);
CREATE INDEX IF NOT EXISTS idx_tr_toko_tgl ON public.training_schedules(kode_toko, tanggal_awal);
CREATE INDEX IF NOT EXISTS idx_tr_status ON public.training_schedules(status);
CREATE INDEX IF NOT EXISTS idx_tr_cabang ON public.training_schedules(cabang);

-- 4. Aktifkan Row Level Security (RLS) & Hak Akses Publik (Anon Key)
ALTER TABLE public.training_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view training schedules" ON public.training_schedules;
CREATE POLICY "Public can view training schedules" ON public.training_schedules FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can insert training schedules" ON public.training_schedules;
CREATE POLICY "Public can insert training schedules" ON public.training_schedules FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update training schedules" ON public.training_schedules;
CREATE POLICY "Public can update training schedules" ON public.training_schedules FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete training schedules" ON public.training_schedules;
CREATE POLICY "Public can delete training schedules" ON public.training_schedules FOR DELETE TO anon, authenticated USING (true);

-- 5. VIEW SINKRONISASI MASTER DENGAN KROSCEK BENTROK OTOMATIS (SQL ENGINE)
-- View ini menggabungkan semua data dan mengkroscek apakah di tanggal yang sama ada NIK ganda atau Kode Toko ganda
CREATE OR REPLACE VIEW public.v_master_training_crosscheck AS
WITH crosscheck_calc AS (
    SELECT 
        ts.*,
        COUNT(*) OVER (PARTITION BY ts.tanggal_awal, ts.nik) AS count_nik_harian,
        COUNT(*) OVER (PARTITION BY ts.tanggal_awal, ts.kode_toko) AS count_toko_harian
    FROM public.training_schedules ts
)
SELECT 
    id,
    sheet_code AS "sheet",
    nik,
    nama,
    jabatan,
    kode_toko,
    toko,
    as_val AS "as",
    am_val AS "am",
    tanggal_awal AS "tanggal",
    jenis_training,
    batch,
    cabang,
    tanggal_h1,
    tanggal_h2,
    tanggal_h3,
    tanggal_h4,
    tanggal_h5,
    tanggal_h6,
    tanggal_h7,
    tanggal_h8,
    tanggal_h9,
    tanggal_h10,
    -- Status Kroscek Otomatis Lintas Sheet:
    CASE 
        WHEN count_nik_harian > 1 THEN 'BENTROK NIK'
        WHEN count_toko_harian > 1 THEN 'DOUBLE TOKO'
        ELSE 'AMAN'
    END AS status_kroscek,
    count_nik_harian AS "berdasarkan_nik",
    count_toko_harian AS "berdasarkan_kode_toko",
    penggabungan,
    keterangan
FROM crosscheck_calc
ORDER BY tanggal_awal, kode_toko;

-- 6. VIEW MASING-MASING 19 SHEET
${sheetViewsSql}

-- 7. Masukkan Seluruh Data (${records.length} Baris Data)
INSERT INTO public.training_schedules (
    id, sheet_code, nik, nama, jabatan, kode_toko, toko, as_val, am_val,
    tanggal_awal, jenis_training, batch, cabang, status, berdasarkan_nik, berdasarkan_kode_toko,
    penggabungan, keterangan,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10
) VALUES
${insertStatements.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
    sheet_code = EXCLUDED.sheet_code,
    nik = EXCLUDED.nik,
    nama = EXCLUDED.nama,
    jabatan = EXCLUDED.jabatan,
    kode_toko = EXCLUDED.kode_toko,
    toko = EXCLUDED.toko,
    as_val = EXCLUDED.as_val,
    am_val = EXCLUDED.am_val,
    tanggal_awal = EXCLUDED.tanggal_awal,
    jenis_training = EXCLUDED.jenis_training,
    batch = EXCLUDED.batch,
    cabang = EXCLUDED.cabang,
    status = EXCLUDED.status,
    berdasarkan_nik = EXCLUDED.berdasarkan_nik,
    berdasarkan_kode_toko = EXCLUDED.berdasarkan_kode_toko,
    penggabungan = EXCLUDED.penggabungan,
    keterangan = EXCLUDED.keterangan,
    tanggal_h1 = EXCLUDED.tanggal_h1,
    tanggal_h2 = EXCLUDED.tanggal_h2,
    tanggal_h3 = EXCLUDED.tanggal_h3,
    tanggal_h4 = EXCLUDED.tanggal_h4,
    tanggal_h5 = EXCLUDED.tanggal_h5,
    tanggal_h6 = EXCLUDED.tanggal_h6,
    tanggal_h7 = EXCLUDED.tanggal_h7,
    tanggal_h8 = EXCLUDED.tanggal_h8,
    tanggal_h9 = EXCLUDED.tanggal_h9,
    tanggal_h10 = EXCLUDED.tanggal_h10,
    updated_at = now();

-- Selesai! Seluruh sheet dan view kroscek telah berhasil dikonfigurasi.
`;
}
