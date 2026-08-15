import { describe, it, expect } from 'vitest';
import {
  normalizeHeader,
  matchColumnToField,
  guessColumnMapping,
  cellToString,
  looksLikeNumericPhoneCell,
  parseSpreadsheetRows,
  gridToRawSheet,
} from './spreadsheetImport';

describe('normalizeHeader', () => {
  it('lowercases, trims, and collapses whitespace', () => {
    expect(normalizeHeader('  Nama   Lengkap  ')).toBe('nama lengkap');
    expect(normalizeHeader('PHONE')).toBe('phone');
  });

  it('strips accents', () => {
    expect(normalizeHeader('Nómor')).toBe('nomor');
  });
});

describe('matchColumnToField / guessColumnMapping', () => {
  it('matches English and Indonesian header spellings', () => {
    expect(matchColumnToField('Name')).toBe('name');
    expect(matchColumnToField('Nama')).toBe('name');
    expect(matchColumnToField('Address')).toBe('address');
    expect(matchColumnToField('Alamat')).toBe('address');
    expect(matchColumnToField('No HP')).toBe('phone');
    expect(matchColumnToField('Phone')).toBe('phone');
    expect(matchColumnToField('Petunjuk Kado')).toBe('hint');
    expect(matchColumnToField('Gift Hint')).toBe('hint');
    expect(matchColumnToField('Grup')).toBe('groupId');
    expect(matchColumnToField('Group')).toBe('groupId');
    expect(matchColumnToField('Catatan')).toBe('notes');
    expect(matchColumnToField('Notes')).toBe('notes');
  });

  it('is case-insensitive and whitespace-tolerant', () => {
    expect(matchColumnToField('  nama  ')).toBe('name');
    expect(matchColumnToField('NAMA')).toBe('name');
  });

  it('returns null for unrecognized headers', () => {
    expect(matchColumnToField('Favorite Color')).toBeNull();
  });

  it('does not map two columns to the same field', () => {
    const mapping = guessColumnMapping(['Nama', 'Name', 'Alamat']);
    const mappedFields = Object.values(mapping).filter(Boolean);
    expect(mappedFields).toEqual(['name', 'address']);
    expect(mapping['Name']).toBeNull(); // second "name"-like column left for manual mapping
  });
});

describe('cellToString / looksLikeNumericPhoneCell', () => {
  it('stringifies numbers without scientific notation', () => {
    expect(cellToString(628123456789)).toBe('628123456789');
    expect(cellToString(81234567890123)).not.toMatch(/e/i);
  });

  it('trims string values', () => {
    expect(cellToString('  Budi  ')).toBe('Budi');
  });

  it('treats null/undefined as empty', () => {
    expect(cellToString(null)).toBe('');
    expect(cellToString(undefined)).toBe('');
  });

  it('flags a phone value that arrived as a spreadsheet number', () => {
    expect(looksLikeNumericPhoneCell(81234567890, 'phone')).toBe(true);
    expect(looksLikeNumericPhoneCell('081234567890', 'phone')).toBe(false);
    expect(looksLikeNumericPhoneCell(81234567890, 'name')).toBe(false);
  });
});

describe('gridToRawSheet', () => {
  it('turns the first row into headers and the rest into keyed row objects', () => {
    const sheet = gridToRawSheet([
      ['Nama', 'Alamat'],
      ['Budi', 'Jl. Merdeka'],
      ['Ani', 'Jl. Sudirman'],
    ]);
    expect(sheet.headers).toEqual(['Nama', 'Alamat']);
    expect(sheet.rows).toEqual([
      { Nama: 'Budi', Alamat: 'Jl. Merdeka' },
      { Nama: 'Ani', Alamat: 'Jl. Sudirman' },
    ]);
  });

  it('returns empty headers/rows for an empty grid', () => {
    expect(gridToRawSheet([])).toEqual({ headers: [], rows: [] });
  });

  it('stringifies non-string header cells', () => {
    const sheet = gridToRawSheet([[1, 'Alamat'], ['Budi', 'x']]);
    expect(sheet.headers).toEqual(['1', 'Alamat']);
  });
});

describe('parseSpreadsheetRows', () => {
  const mapping = { Nama: 'name', Alamat: 'address', 'No HP': 'phone' } as const;

  it('parses valid rows', () => {
    const result = parseSpreadsheetRows(
      [{ Nama: 'Budi', Alamat: 'Jl. Merdeka', 'No HP': '0812' }],
      mapping
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].values).toEqual({ name: 'Budi', address: 'Jl. Merdeka', phone: '0812' });
    expect(result.rows[0].errorKeys).toEqual([]);
    expect(result.validCount).toBe(1);
  });

  it('skips fully blank rows without reporting them as errors', () => {
    const result = parseSpreadsheetRows(
      [{ Nama: '', Alamat: '', 'No HP': '' }, { Nama: 'Budi' }],
      mapping
    );
    expect(result.skippedBlankCount).toBe(1);
    expect(result.rows).toHaveLength(1);
  });

  it('flags a missing name', () => {
    const result = parseSpreadsheetRows([{ Alamat: 'Jl. Merdeka' }], mapping);
    expect(result.rows[0].errorKeys).toContain('import.errorMissingName');
    expect(result.validCount).toBe(0);
  });

  it('flags duplicate names (case-insensitively)', () => {
    const result = parseSpreadsheetRows(
      [{ Nama: 'Budi' }, { Nama: 'budi' }],
      mapping
    );
    expect(result.rows[0].errorKeys).toEqual([]);
    expect(result.rows[1].errorKeys).toContain('import.errorDuplicateName');
    expect(result.validCount).toBe(1);
  });

  it('warns when a phone number arrived as a spreadsheet number (possible lost leading zero)', () => {
    const result = parseSpreadsheetRows([{ Nama: 'Budi', 'No HP': 81234567890 }], mapping);
    expect(result.rows[0].warningKeys).toContain('import.warningNumericPhone');
  });

  it('flags a name that collides with an existing participant', () => {
    const result = parseSpreadsheetRows([{ Nama: 'Budi' }], mapping, ['Budi']);
    expect(result.rows[0].errorKeys).toContain('import.errorDuplicateName');
  });

  it('assigns spreadsheet-matching row numbers (header is row 1)', () => {
    const result = parseSpreadsheetRows(
      [{ Nama: 'Budi' }, { Nama: 'Ani' }],
      mapping
    );
    expect(result.rows[0].rowNumber).toBe(2);
    expect(result.rows[1].rowNumber).toBe(3);
  });

  it('handles a large number of rows without choking', () => {
    const rawRows = Array.from({ length: 250 }, (_, i) => ({ Nama: `Person ${i}` }));
    const result = parseSpreadsheetRows(rawRows, mapping);
    expect(result.validCount).toBe(250);
  });

  it('ignores columns that are not mapped to a field', () => {
    const result = parseSpreadsheetRows(
      [{ Nama: 'Budi', 'Favorite Color': 'Blue' }],
      { Nama: 'name', 'Favorite Color': null }
    );
    expect(result.rows[0].values).toEqual({ name: 'Budi' });
  });
});
