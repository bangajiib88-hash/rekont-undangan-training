-- ===================================================================================
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
-- View Sheet: 1. FFIS (Fried Food IS)
CREATE OR REPLACE VIEW public.sheet_ffis AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'FFIS';

-- View Sheet: 2. FF (Fried Food)
CREATE OR REPLACE VIEW public.sheet_ff AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'FF';

-- View Sheet: 3. FRESH (Perishable Khusus Toko Fresh)
CREATE OR REPLACE VIEW public.sheet_fresh AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'FRESH';

-- View Sheet: 4. SBM (Say Bread Minimalis)
CREATE OR REPLACE VIEW public.sheet_sbm AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'SBM';

-- View Sheet: 5. SAY BURGER
CREATE OR REPLACE VIEW public.sheet_say_burger AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'SAY_BURGER';

-- View Sheet: 6. YCCG (Yummy Coffee Gold)
CREATE OR REPLACE VIEW public.sheet_yccg AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'YCCG';

-- View Sheet: 7. PCDEL (Delivery Online & Klik Food)
CREATE OR REPLACE VIEW public.sheet_pcdel AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'PCDEL';

-- View Sheet: 8. SS (Special Store)
CREATE OR REPLACE VIEW public.sheet_ss AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'SS';

-- View Sheet: 9. EVA SC (Evaluasi Bulanan Store Crew)
CREATE OR REPLACE VIEW public.sheet_eva_sc AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'EVA_SC';

-- View Sheet: 10. BARISTA
CREATE OR REPLACE VIEW public.sheet_barista AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'BARISTA';

-- View Sheet: 11. LEADER BARISTA
CREATE OR REPLACE VIEW public.sheet_leader_barista AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'LEADER_BARISTA';

-- View Sheet: 12. SOFT SKILL
CREATE OR REPLACE VIEW public.sheet_soft_skill AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'SOFT_SKILL';

-- View Sheet: 13. SOFT SKILL REMIDIAL
CREATE OR REPLACE VIEW public.sheet_soft_skill_remidial AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'SOFT_SKILL_REMIDIAL';

-- View Sheet: 14. SOFT SKILL CIF
CREATE OR REPLACE VIEW public.sheet_soft_skill_cif AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'SOFT_SKILL_CIF';

-- View Sheet: 15. SOFT SKILL CIF REMIDIAL
CREATE OR REPLACE VIEW public.sheet_soft_skill_cif_remidial AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'SOFT_SKILL_CIF_REMIDIAL';

-- View Sheet: 16. IDEL (iDelivery Crew)
CREATE OR REPLACE VIEW public.sheet_idel AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'IDEL';

-- View Sheet: 17. SJL (Service & Jurnal)
CREATE OR REPLACE VIEW public.sheet_sjl AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'SJL';

-- View Sheet: 18. SSL
CREATE OR REPLACE VIEW public.sheet_ssl AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'SSL';

-- View Sheet: 19. CIF
CREATE OR REPLACE VIEW public.sheet_cif AS
SELECT 
    nik, nama, jabatan, kode_toko, toko, as_val AS "as", am_val AS "am",
    tanggal_awal AS "tanggal", jenis_training, batch, cabang,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10,
    status, berdasarkan_nik, berdasarkan_kode_toko, penggabungan, keterangan
FROM public.training_schedules
WHERE sheet_code = 'CIF';

-- 7. Masukkan Seluruh Data (0 Baris Data)
INSERT INTO public.training_schedules (
    id, sheet_code, nik, nama, jabatan, kode_toko, toko, as_val, am_val,
    tanggal_awal, jenis_training, batch, cabang, status, berdasarkan_nik, berdasarkan_kode_toko,
    penggabungan, keterangan,
    tanggal_h1, tanggal_h2, tanggal_h3, tanggal_h4, tanggal_h5,
    tanggal_h6, tanggal_h7, tanggal_h8, tanggal_h9, tanggal_h10
) VALUES

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
