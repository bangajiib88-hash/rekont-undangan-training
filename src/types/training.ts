export type TrainingMethod = 
  | 'OFFLINE CLASS' 
  | 'FULL LMS' 
  | 'LIVE STREAMING' 
  | 'OFFLINE CLASS H1' 
  | 'OFFLINE CLASS H2' 
  | 'HYBRID'
  | '-';

export type TrainingStatus = 'AMAN' | 'DOUBLE TOKO' | 'BENTROK NIK';

export const SHEET_LIST = [
  { code: 'FFIS', name: '1. FFIS (Fried Food IS)' },
  { code: 'FF', name: '2. FF (Fried Food)' },
  { code: 'FRESH', name: '3. FRESH (Perishable Khusus Toko Fresh)' },
  { code: 'SBM', name: '4. SBM (Say Bread Minimalis)' },
  { code: 'SAY_BURGER', name: '5. SAY BURGER' },
  { code: 'YCCG', name: '6. YCCG (Yummy Coffee Gold)' },
  { code: 'PCDEL', name: '7. PCDEL (Delivery Online & Klik Food)' },
  { code: 'SS', name: '8. SS (Special Store)' },
  { code: 'EVA_SC', name: '9. EVA SC (Evaluasi Bulanan Store Crew)' },
  { code: 'BARISTA', name: '10. BARISTA' },
  { code: 'LEADER_BARISTA', name: '11. LEADER BARISTA' },
  { code: 'SOFT_SKILL', name: '12. SOFT SKILL' },
  { code: 'SOFT_SKILL_REMIDIAL', name: '13. SOFT SKILL REMIDIAL' },
  { code: 'SOFT_SKILL_CIF', name: '14. SOFT SKILL CIF' },
  { code: 'SOFT_SKILL_CIF_REMIDIAL', name: '15. SOFT SKILL CIF REMIDIAL' },
  { code: 'IDEL', name: '16. IDEL (iDelivery Crew)' },
  { code: 'SJL', name: '17. SJL (Service & Jurnal)' },
  { code: 'SSL', name: '18. SSL' },
  { code: 'CIF', name: '19. CIF' },
] as const;

export type SheetCode = typeof SHEET_LIST[number]['code'];

export interface RawTrainingInput {
  id?: string;
  sheetCode?: string;
  nik: string;
  nama: string;
  jabatan?: string;
  kodeToko: string;
  toko?: string;
  as?: string;
  am?: string;
  tanggalAwal: string;
  jenisTraining: string;
  batch?: string;
  cabang?: string;
  tanggalH1?: string;
  tanggalH2?: string;
  tanggalH3?: string;
  tanggalH4?: string;
  tanggalH5?: string;
  tanggalH6?: string;
  tanggalH7?: string;
  tanggalH8?: string;
  tanggalH9?: string;
  tanggalH10?: string;
  keterangan?: string;
  notes?: string;
}

export interface TrainingRecord {
  id: string;
  sheetCode: string; // One of the 19 sheets (e.g. 'SBM', 'FFIS', etc.)
  nik: string;
  nama: string;
  jabatan: string;
  kodeToko: string;
  toko: string; // Nama Toko
  as: string; // Area Supervisor
  am: string; // Area Manager
  tanggalAwal: string; // TANGGAL (Formatted as "DD MMMM YYYY" or ISO)
  jenisTraining: string;
  batch: string;
  cabang: string; // SBY, JAP, MNK, SON, MRK
  // Multi-day schedule
  tanggalH1?: string;
  tanggalH2?: string;
  tanggalH3?: string;
  tanggalH4?: string;
  tanggalH5?: string;
  tanggalH6?: string;
  tanggalH7?: string;
  tanggalH8?: string;
  tanggalH9?: string;
  tanggalH10?: string;
  // Calculation & Validation
  status: TrainingStatus;
  berdasarkanNik: number;
  berdasarkanKodeToko: number;
  penggabungan: string;
  keterangan: string;
  notes?: string;
}

export interface StoreClashGroup {
  kodeToko: string;
  toko?: string;
  tanggalAwal: string;
  cabang: string;
  count: number;
  participants: TrainingRecord[];
}

export interface NikClashGroup {
  nik: string;
  nama: string;
  tanggalAwal: string;
  count: number;
  participants: TrainingRecord[];
}

export interface DashboardMetrics {
  totalSchedules: number;
  totalPersonnel: number;
  totalStores: number;
  totalAman: number;
  totalDoubleToko: number;
  totalBentrokNik: number;
  affectedStoresCount: number;
  branches: { [cabang: string]: number };
  trainings: { [training: string]: number };
  sheetDistribution: { [sheetCode: string]: number };
}
