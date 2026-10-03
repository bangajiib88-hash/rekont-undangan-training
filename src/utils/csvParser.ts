import * as XLSX from 'xlsx';
import { TrainingRecord } from '../types/training';
import { validateAndEnrichRecords, mapTrainingToSheetCode } from './trainingUtils';

/**
 * Searches for header column index using exact match first, then word-boundary regex
 */
function findHeaderIndex(headerRow: string[], exactMatches: string[], fallbackKeywords: string[] = []): number {
  const normalized = headerRow.map(h => (h || '').toString().trim().toUpperCase());

  // 1. Exact match has highest priority
  for (let i = 0; i < normalized.length; i++) {
    const col = normalized[i];
    if (exactMatches.some(e => e.toUpperCase() === col)) {
      return i;
    }
  }

  // 2. Exact word boundary regex match (e.g. "\bAM\b" will NOT match "NAMA")
  const allTerms = [...exactMatches, ...fallbackKeywords];
  for (let i = 0; i < normalized.length; i++) {
    const col = normalized[i];
    for (const term of allTerms) {
      const regex = new RegExp(`(^|[^A-Z0-9])${term.toUpperCase()}([^A-Z0-9]|$)`, 'i');
      if (regex.test(col)) {
        return i;
      }
    }
  }

  return -1;
}

/**
 * Parses 2D array of rows (from XLSX or CSV) into TrainingRecord[]
 */
export function parseTableRows(rows: any[][]): TrainingRecord[] {
  if (!rows || rows.length < 2) return [];

  // Locate the header row (search first 5 rows for presence of 'NIK')
  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const rowStr = rows[r].map(c => String(c || '').toUpperCase());
    if (rowStr.some(c => c === 'NIK' || c.includes('NIK'))) {
      headerRowIndex = r;
      break;
    }
  }

  const rawHeader = rows[headerRowIndex].map(c => String(c ?? '').trim());

  // Map header columns with exact matches
  const nikIdx = findHeaderIndex(rawHeader, ['NIK', 'NO. NIK', 'NO NIK'], ['NIK']);
  const namaIdx = findHeaderIndex(rawHeader, ['NAMA', 'NAMA LENGKAP', 'NAMA KARYAWAN', 'NAMA PESERTA', 'PESERTA'], ['NAMA']);
  const jabatanIdx = findHeaderIndex(rawHeader, ['JABATAN', 'POSISI'], ['JABATAN']);
  const kodeTokoIdx = findHeaderIndex(rawHeader, ['KODE TOKO', 'KODE_TOKO', 'KODETOKO', 'ID TOKO'], ['KODE TOKO']);
  const tokoIdx = findHeaderIndex(rawHeader, ['TOKO', 'NAMA TOKO', 'NAMA_TOKO'], ['TOKO']);
  const asIdx = findHeaderIndex(rawHeader, ['AS', 'AREA SUPERVISOR', 'AS SPV'], ['AREA SUPERVISOR']);
  
  // CRITICAL: AM column must NEVER match 'NAMA'
  const amIdx = findHeaderIndex(rawHeader, ['AM', 'AREA MANAGER', 'MANAGER', 'AM MANAGER'], ['AREA MANAGER']);
  
  const dateIdx = findHeaderIndex(rawHeader, ['TANGGAL', 'TANGGAL AWAL', 'TGL AWAL', 'TGL'], ['TANGGAL']);
  const trainingIdx = findHeaderIndex(rawHeader, ['JENIS TRAINING', 'TRAINING', 'PROGRAM TRAINING', 'NAMA TRAINING'], ['TRAINING']);
  const batchIdx = findHeaderIndex(rawHeader, ['BATCH', 'GELOMBANG', 'BATCH TRAINING', 'BATCH PELATIHAN'], ['BATCH']);
  const cabangIdx = findHeaderIndex(rawHeader, ['CABANG', 'BRANCH', 'KODE CABANG'], ['CABANG']);
  const ketIdx = findHeaderIndex(rawHeader, ['KETERANGAN', 'METODE', 'METODE TRAINING', 'METODE PELATIHAN', 'KET'], ['KETERANGAN']);

  // Multi-day sessions
  const h1Idx = findHeaderIndex(rawHeader, ['TANGGAL H1', 'H1', 'TGL H1']);
  const h2Idx = findHeaderIndex(rawHeader, ['TANGGAL H2', 'H2', 'TGL H2']);
  const h3Idx = findHeaderIndex(rawHeader, ['TANGGAL H3', 'H3', 'TGL H3']);
  const h4Idx = findHeaderIndex(rawHeader, ['TANGGAL H4', 'H4', 'TGL H4']);
  const h5Idx = findHeaderIndex(rawHeader, ['TANGGAL H5', 'H5', 'TGL H5']);
  const h6Idx = findHeaderIndex(rawHeader, ['TANGGAL H6', 'H6', 'TGL H6']);
  const h7Idx = findHeaderIndex(rawHeader, ['TANGGAL H7', 'H7', 'TGL H7']);
  const h8Idx = findHeaderIndex(rawHeader, ['TANGGAL H8', 'H8', 'TGL H8']);
  const h9Idx = findHeaderIndex(rawHeader, ['TANGGAL H9', 'H9', 'TGL H9']);
  const h10Idx = findHeaderIndex(rawHeader, ['TANGGAL H10', 'H10', 'TGL H10']);

  const rawEntries: any[] = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.length === 0) continue;

    const getCell = (idx: number, fallback = ''): string => {
      if (idx < 0 || idx >= cols.length) return fallback;
      const v = cols[idx];
      if (v === null || v === undefined) return fallback;
      return String(v).trim();
    };

    const nik = getCell(nikIdx, getCell(0));
    const nama = getCell(namaIdx, getCell(1));
    const jabatan = getCell(jabatanIdx, 'Crew Toko') || 'Crew Toko';
    const kodeToko = getCell(kodeTokoIdx, getCell(3));
    const toko = getCell(tokoIdx, '');
    const asVal = getCell(asIdx, '-');
    
    // Explicitly read AM from column G (amIdx), preserving whatever is in the spreadsheet
    const amVal = getCell(amIdx, '-');
    
    const tanggal = getCell(dateIdx, getCell(7));
    const jenisTraining = getCell(trainingIdx, 'FRIED FOOD IS') || 'FRIED FOOD IS';
    
    let batchVal = getCell(batchIdx, 'Batch 1');
    if (/^\d+$/.test(batchVal)) {
      batchVal = `Batch ${batchVal}`;
    }

    const cabang = getCell(cabangIdx, 'SBY') || 'SBY';
    const keterangan = getCell(ketIdx, '-');

    if (nik || nama || (tanggal && kodeToko)) {
      rawEntries.push({
        id: `import-${i}-${Date.now()}`,
        sheetCode: mapTrainingToSheetCode(jenisTraining),
        nik,
        nama: nama.toUpperCase(),
        jabatan,
        kodeToko: kodeToko.toUpperCase(),
        toko: toko.toUpperCase(),
        as: asVal.toUpperCase(),
        am: amVal.toUpperCase(), // Exactly reads AM (e.g. JARWANTO, ABDURROHMAN)
        tanggalAwal: tanggal,
        jenisTraining,
        batch: batchVal,
        cabang: cabang.toUpperCase(),
        keterangan: keterangan || '-',
        tanggalH1: h1Idx >= 0 ? getCell(h1Idx) : undefined,
        tanggalH2: h2Idx >= 0 ? getCell(h2Idx) : undefined,
        tanggalH3: h3Idx >= 0 ? getCell(h3Idx) : undefined,
        tanggalH4: h4Idx >= 0 ? getCell(h4Idx) : undefined,
        tanggalH5: h5Idx >= 0 ? getCell(h5Idx) : undefined,
        tanggalH6: h6Idx >= 0 ? getCell(h6Idx) : undefined,
        tanggalH7: h7Idx >= 0 ? getCell(h7Idx) : undefined,
        tanggalH8: h8Idx >= 0 ? getCell(h8Idx) : undefined,
        tanggalH9: h9Idx >= 0 ? getCell(h9Idx) : undefined,
        tanggalH10: h10Idx >= 0 ? getCell(h10Idx) : undefined,
      });
    }
  }

  return validateAndEnrichRecords(rawEntries);
}

/**
 * Parses XLSX / XLS array buffer with full multi-type fidelity
 */
export function parseSpreadsheetBuffer(buffer: ArrayBuffer): TrainingRecord[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Extract raw rows as 2D array
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, 
    defval: '', 
    raw: false 
  }) as any[][];

  return parseTableRows(rawRows);
}

/**
 * Parses CSV text content
 */
export function parseCsvText(csvText: string): TrainingRecord[] {
  const workbook = XLSX.read(csvText, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false }) as any[][];
  return parseTableRows(rawRows);
}

/**
 * Generates CSV string matching the complete retail standard structure
 */
export function exportToCsv(records: TrainingRecord[]): string {
  const headers = [
    'NIK',
    'NAMA',
    'JABATAN',
    'KODE TOKO',
    'TOKO',
    'AS',
    'AM',
    'TANGGAL',
    'JENIS TRAINING',
    'BATCH',
    'CABANG',
    'TANGGAL H1',
    'TANGGAL H2',
    'TANGGAL H3',
    'TANGGAL H4',
    'TANGGAL H5',
    'STATUS',
    'BERDASARKAN NIK',
    'BERDASARKAN KODE TOKO',
    'PENGGABUNGAN',
    'KETERANGAN'
  ];

  const rows = records.map(r => [
    `"${r.nik}"`,
    `"${r.nama.replace(/"/g, '""')}"`,
    `"${r.jabatan || 'Crew Toko'}"`,
    `"${r.kodeToko}"`,
    `"${r.toko || ''}"`,
    `"${r.as || '-'}"`,
    `"${r.am || '-'}"`,
    `"${r.tanggalAwal}"`,
    `"${r.jenisTraining}"`,
    `"${r.batch || 'Batch 1'}"`,
    `"${r.cabang}"`,
    `"${r.tanggalH1 || ''}"`,
    `"${r.tanggalH2 || ''}"`,
    `"${r.tanggalH3 || ''}"`,
    `"${r.tanggalH4 || ''}"`,
    `"${r.tanggalH5 || ''}"`,
    `"${r.status}"`,
    r.berdasarkanNik,
    r.berdasarkanKodeToko,
    `"${r.penggabungan}"`,
    `"${r.keterangan || '-'}"`
  ].join(','));

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Downloads records as an Excel .xlsx workbook
 */
export function exportToXlsx(records: TrainingRecord[], filename = 'Master_Sinkronisasi_Training.xlsx'): void {
  const data = records.map(r => ({
    'NIK': r.nik,
    'NAMA': r.nama,
    'JABATAN': r.jabatan || 'Crew Toko',
    'KODE TOKO': r.kodeToko,
    'TOKO': r.toko || '',
    'AS': r.as || '-',
    'AM': r.am || '-',
    'TANGGAL': r.tanggalAwal,
    'JENIS TRAINING': r.jenisTraining,
    'BATCH': r.batch || 'Batch 1',
    'CABANG': r.cabang,
    'TANGGAL H1': r.tanggalH1 || '',
    'TANGGAL H2': r.tanggalH2 || '',
    'TANGGAL H3': r.tanggalH3 || '',
    'TANGGAL H4': r.tanggalH4 || '',
    'TANGGAL H5': r.tanggalH5 || '',
    'STATUS': r.status,
    'BERDASARKAN NIK': r.berdasarkanNik,
    'BERDASARKAN KODE TOKO': r.berdasarkanKodeToko,
    'PENGGABUNGAN': r.penggabungan,
    'KETERANGAN': r.keterangan || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Sinkronisasi');
  XLSX.writeFile(workbook, filename);
}

/**
 * Triggers CSV file download in browser
 */
export function downloadCsv(records: TrainingRecord[], filename = 'Master_Sinkronisasi_Training.csv'): void {
  const csvStr = exportToCsv(records);
  const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
