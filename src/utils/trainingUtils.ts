import { TrainingRecord, StoreClashGroup, NikClashGroup, DashboardMetrics, SHEET_LIST, RawTrainingInput } from '../types/training';

export const INDONESIAN_MONTHS: { [key: string]: number } = {
  'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
  'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
};

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Parses date string in "DD MMMM YYYY" or "YYYY-MM-DD" to Date
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();

  // Standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const parts = cleanStr.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  // Indonesian format "12 Oktober 2026"
  const parts = cleanStr.split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthName = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && monthName in INDONESIAN_MONTHS && !isNaN(year)) {
      return new Date(year, INDONESIAN_MONTHS[monthName], day);
    }
  }

  const parsed = new Date(cleanStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats Date to Indonesian "DD MMMM YYYY"
 */
export function formatDateIndo(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Converts any date string to HTML <input type="date"> value (YYYY-MM-DD)
 */
export function dateToIso(dateStr: string): string {
  const d = parseDate(dateStr);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Converts HTML <input type="date"> value (YYYY-MM-DD) to Indonesian formatted date
 */
export function isoToDateIndo(isoStr: string): string {
  if (!isoStr) return '';
  const parts = isoStr.split('-').map(Number);
  if (parts.length === 3) {
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return formatDateIndo(date);
  }
  return isoStr;
}

/**
 * Converts date to Excel serial number (matches Excel 1900 date system)
 */
export function toExcelSerial(date: Date): number {
  const epoch = Date.UTC(1899, 11, 30);
  const target = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((target - epoch) / (24 * 60 * 60 * 1000));
}

/**
 * Calculates Excel-style penggabungan key: [SerialDate][NIK][JenisTraining]
 */
export function generatePenggabunganKey(tanggalAwal: string, nik: string, jenisTraining: string): string {
  const d = parseDate(tanggalAwal);
  const serial = d ? toExcelSerial(d) : '00000';
  return `${serial}${nik.trim()}${jenisTraining.trim()}`;
}

/**
 * Map training name to one of the 19 standard sheet codes
 */
export function mapTrainingToSheetCode(trainingName: string): string {
  const name = (trainingName || '').toUpperCase().trim();
  
  // 1. Specific multi-word or distinct product lines first
  if (name.includes('YUMMY') || name.includes('COFFE') || name.includes('COFFEE') || /\bYCCG\b/.test(name) || name.includes('CHOCO') || name.includes('GOLD')) {
    return 'YCCG';
  }
  if (name.includes('FRIED FOOD IS') || /\bFFIS\b/.test(name)) {
    return 'FFIS';
  }
  // Fried Food (must not match 'COFFE' which has 'FF' as substring)
  if (name.includes('FRIED FOOD') || /\bFF\b/.test(name)) {
    return 'FF';
  }
  if (name.includes('FRESH') || name.includes('PERISHABLE')) {
    return 'FRESH';
  }
  if (name.includes('SAY BREAD') || /\bSBM\b/.test(name)) {
    return 'SBM';
  }
  if (name.includes('SAY BURGER') || name.includes('BURGER')) {
    return 'SAY_BURGER';
  }
  if (name.includes('DELIVERY ONLINE') || name.includes('KLIK FOOD') || /\bPCDEL\b/.test(name)) {
    return 'PCDEL';
  }
  if (name.includes('SPECIAL STORE') || /\bSS\b/.test(name)) {
    return 'SS';
  }
  if (name.includes('EVA SC') || name.includes('EVALUASI')) {
    return 'EVA_SC';
  }
  if (name.includes('LEADER BARISTA')) {
    return 'LEADER_BARISTA';
  }
  if (/\bBARISTA\b/.test(name)) {
    return 'BARISTA';
  }
  if (name.includes('SOFT SKILL CIF REMIDIAL') || name.includes('SOFT SKILL CIF REMEDIAL')) {
    return 'SOFT_SKILL_CIF_REMIDIAL';
  }
  if (name.includes('SOFT SKILL REMIDIAL') || name.includes('SOFT SKILL REMEDIAL')) {
    return 'SOFT_SKILL_REMIDIAL';
  }
  if (name.includes('SOFT SKILL CIF')) {
    return 'SOFT_SKILL_CIF';
  }
  if (name.includes('SOFT SKILL')) {
    return 'SOFT_SKILL';
  }
  if (name.includes('IDELIVERY') || /\bIDEL\b/.test(name)) {
    return 'IDEL';
  }
  if (/\bSJL\b/.test(name) || name.includes('JURNAL')) {
    return 'SJL';
  }
  if (/\bSSL\b/.test(name)) {
    return 'SSL';
  }
  if (/\bCIF\b/.test(name)) {
    return 'CIF';
  }
  return 'SBM';
}

/**
 * Returns all active session dates for a record (primary date plus H1..H10)
 */
export function getAllSessionDates(r: {
  tanggalAwal: string;
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
}): string[] {
  const dates = new Set<string>();
  if (r.tanggalAwal?.trim()) dates.add(r.tanggalAwal.trim());
  const hKeys: (keyof typeof r)[] = [
    'tanggalH1', 'tanggalH2', 'tanggalH3', 'tanggalH4', 'tanggalH5',
    'tanggalH6', 'tanggalH7', 'tanggalH8', 'tanggalH9', 'tanggalH10'
  ];
  hKeys.forEach(k => {
    const val = r[k];
    if (val && typeof val === 'string' && val.trim() && val.trim() !== '-') {
      dates.add(val.trim());
    }
  });
  return Array.from(dates);
}

/**
 * Cross-checks records across all 19 sheets:
 * Validates whether on any identical date, the same NIK or Store Code has multiple training sessions.
 */
export function validateAndEnrichRecords(
  records: RawTrainingInput[]
): TrainingRecord[] {
  const cleanRecords = records.map((r, index) => {
    const calculatedSheet = r.jenisTraining ? mapTrainingToSheetCode(r.jenisTraining) : '';
    const sheetCode = calculatedSheet || r.sheetCode || 'SBM';
    return {
      ...r,
      id: r.id || `rec-${Date.now()}-${index}`,
      sheetCode,
      kodeToko: (r.kodeToko || '').trim().replace(/\.$/, '').toUpperCase(),
      toko: (r.toko || '').trim().toUpperCase(),
      nik: (r.nik || '').trim(),
      nama: (r.nama || '').trim().toUpperCase(),
      jabatan: (r.jabatan || 'Crew Toko').trim(),
      as: (r.as || '-').trim(),
      am: (r.am !== undefined && r.am !== null && String(r.am).trim() !== '' ? String(r.am).trim().toUpperCase() : '-'),
      batch: (r.batch || 'Batch 1').trim(),
      tanggalAwal: (r.tanggalAwal || '').trim(),
      jenisTraining: (r.jenisTraining || sheetCode).trim(),
      cabang: (r.cabang || 'SBY').trim().toUpperCase(),
      keterangan: (r.keterangan || '-').trim(),
    };
  });

  // Build occurrence maps across all active dates
  // Map<`${date}___${nik}`, number>
  const nikDateMap = new Map<string, number>();
  // Map<`${date}___${kodeToko}`, number>
  const storeDateMap = new Map<string, number>();

  cleanRecords.forEach(r => {
    const dates = getAllSessionDates(r);
    dates.forEach(d => {
      if (r.nik) {
        const nikKey = `${d}___${r.nik}`;
        nikDateMap.set(nikKey, (nikDateMap.get(nikKey) || 0) + 1);
      }
      if (r.kodeToko) {
        const storeKey = `${d}___${r.kodeToko}`;
        storeDateMap.set(storeKey, (storeDateMap.get(storeKey) || 0) + 1);
      }
    });
  });

  return cleanRecords.map(r => {
    const dates = getAllSessionDates(r);

    let maxNikCount = 1;
    let maxStoreCount = 1;

    dates.forEach(d => {
      const nC = nikDateMap.get(`${d}___${r.nik}`) || 1;
      const sC = r.kodeToko ? (storeDateMap.get(`${d}___${r.kodeToko}`) || 1) : 1;
      if (nC > maxNikCount) maxNikCount = nC;
      if (sC > maxStoreCount) maxStoreCount = sC;
    });

    let status: 'AMAN' | 'DOUBLE TOKO' | 'BENTROK NIK' = 'AMAN';
    if (maxNikCount > 1) {
      status = 'BENTROK NIK';
    } else if (maxStoreCount > 1) {
      status = 'DOUBLE TOKO';
    }

    const penggabungan = generatePenggabunganKey(r.tanggalAwal, r.nik, r.jenisTraining);

    return {
      ...r,
      berdasarkanNik: maxNikCount,
      berdasarkanKodeToko: maxStoreCount,
      status,
      penggabungan,
    };
  });
}

/**
 * Groups store conflicts
 */
export function getStoreClashes(records: TrainingRecord[]): StoreClashGroup[] {
  const storeDateMap = new Map<string, TrainingRecord[]>();

  records.forEach(r => {
    if (r.kodeToko) {
      const dates = getAllSessionDates(r);
      dates.forEach(d => {
        const key = `${r.kodeToko}___${d}`;
        if (!storeDateMap.has(key)) {
          storeDateMap.set(key, []);
        }
        // Avoid duplicate push if same record
        const list = storeDateMap.get(key)!;
        if (!list.some(item => item.id === r.id)) {
          list.push(r);
        }
      });
    }
  });

  const clashGroups: StoreClashGroup[] = [];
  storeDateMap.forEach((participants, key) => {
    if (participants.length > 1) {
      const [kodeToko, tanggalAwal] = key.split('___');
      clashGroups.push({
        kodeToko,
        toko: participants[0].toko,
        tanggalAwal,
        cabang: participants[0].cabang || 'SBY',
        count: participants.length,
        participants,
      });
    }
  });

  return clashGroups.sort((a, b) => b.count - a.count);
}

/**
 * Groups NIK conflicts
 */
export function getNikClashes(records: TrainingRecord[]): NikClashGroup[] {
  const nikDateMap = new Map<string, TrainingRecord[]>();

  records.forEach(r => {
    if (r.nik) {
      const dates = getAllSessionDates(r);
      dates.forEach(d => {
        const key = `${r.nik}___${d}`;
        if (!nikDateMap.has(key)) {
          nikDateMap.set(key, []);
        }
        const list = nikDateMap.get(key)!;
        if (!list.some(item => item.id === r.id)) {
          list.push(r);
        }
      });
    }
  });

  const clashGroups: NikClashGroup[] = [];
  nikDateMap.forEach((participants, key) => {
    if (participants.length > 1) {
      const [nik, tanggalAwal] = key.split('___');
      clashGroups.push({
        nik,
        nama: participants[0].nama,
        tanggalAwal,
        count: participants.length,
        participants,
      });
    }
  });

  return clashGroups.sort((a, b) => b.count - a.count);
}

/**
 * Metrics computation
 */
export function calculateMetrics(records: TrainingRecord[]): DashboardMetrics {
  const totalSchedules = records.length;
  const uniquePersonnel = new Set<string>();
  const uniqueStores = new Set<string>();
  let totalAman = 0;
  let totalDoubleToko = 0;
  let totalBentrokNik = 0;

  const branches: { [cabang: string]: number } = {};
  const trainings: { [training: string]: number } = {};
  const sheetDistribution: { [sheetCode: string]: number } = {};
  const doubleStoreCodes = new Set<string>();

  records.forEach(r => {
    if (r.nik) uniquePersonnel.add(r.nik);
    if (r.kodeToko) uniqueStores.add(r.kodeToko);

    if (r.status === 'AMAN') totalAman++;
    else if (r.status === 'DOUBLE TOKO') {
      totalDoubleToko++;
      if (r.kodeToko) doubleStoreCodes.add(r.kodeToko);
    } else if (r.status === 'BENTROK NIK') {
      totalBentrokNik++;
    }

    if (r.cabang) {
      branches[r.cabang] = (branches[r.cabang] || 0) + 1;
    }
    if (r.jenisTraining) {
      trainings[r.jenisTraining] = (trainings[r.jenisTraining] || 0) + 1;
    }
    if (r.sheetCode) {
      sheetDistribution[r.sheetCode] = (sheetDistribution[r.sheetCode] || 0) + 1;
    }
  });

  return {
    totalSchedules,
    totalPersonnel: uniquePersonnel.size,
    totalStores: uniqueStores.size,
    totalAman,
    totalDoubleToko,
    totalBentrokNik,
    affectedStoresCount: doubleStoreCodes.size,
    branches,
    trainings,
    sheetDistribution,
  };
}
