// Shared parsing logic for both the CSV (PapaParse) and XLSX (SheetJS)
// import paths — both end up as raw `Record<string, unknown>[]` rows keyed
// by header text, which this module turns into participants with a
// bilingual, typo-tolerant header match, a manual override step, and
// per-row validation. Nothing here commits to the participants map by
// itself — see ImportWizard.tsx for the "never import silently" flow.

import Papa from "papaparse";

export type ParticipantField =
  | "name"
  | "address"
  | "phone"
  | "hint"
  | "notes"
  | "wishlistUrl"
  | "groupId";

export const PARTICIPANT_FIELDS: ParticipantField[] = [
  "name",
  "address",
  "phone",
  "hint",
  "notes",
  "wishlistUrl",
  "groupId",
];

// English and Indonesian header spellings, already normalized (see
// normalizeHeader) — lowercase, accent-stripped, single-spaced.
const FIELD_ALIASES: Record<ParticipantField, string[]> = {
  name: ["name", "nama"],
  address: ["address", "alamat"],
  phone: ["phone", "phone number", "no hp", "no. hp", "nomor hp", "telepon", "no telepon", "hp"],
  hint: ["gift hint", "hint", "petunjuk kado", "petunjuk hadiah"],
  notes: ["notes", "catatan"],
  wishlistUrl: ["wishlist url", "wishlist", "link wishlist", "url wishlist"],
  groupId: ["group", "grup"],
};

// Unicode combining diacritical marks (U+0300-U+036F) — stripping these
// after NFD normalization turns e.g. an accented header into a
// plain-ASCII comparable form. Built from explicit char codes (rather than
// a /.../ literal or a \u escape) so no literal combining characters sit
// in this source file.
const COMBINING_MARKS_START = 0x0300;
const COMBINING_MARKS_END = 0x036f;
const COMBINING_MARKS = new RegExp(
  "[" + String.fromCharCode(COMBINING_MARKS_START) + "-" + String.fromCharCode(COMBINING_MARKS_END) + "]",
  "g"
);

export function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function matchColumnToField(header: string): ParticipantField | null {
  const normalized = normalizeHeader(header);
  for (const field of PARTICIPANT_FIELDS) {
    if (FIELD_ALIASES[field].includes(normalized)) {
      return field;
    }
  }
  return null;
}

export type ColumnMapping = Record<string, ParticipantField | null>;

// Best-effort automatic mapping; the caller always shows this for
// confirmation/adjustment rather than trusting it blindly.
export function guessColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const claimedFields = new Set<ParticipantField>();

  for (const header of headers) {
    const field = matchColumnToField(header);
    if (field && !claimedFields.has(field)) {
      mapping[header] = field;
      claimedFields.add(field);
    } else {
      mapping[header] = null;
    }
  }

  return mapping;
}

// A cell that survived a round-trip through Excel as a "number" format
// (common for phone numbers) prints via toFixed(0) without exponential
// notation for any realistic phone number — but a leading zero typed into
// a numeric cell is gone before we ever see the file; that loss can't be
// recovered, only flagged (see looksLikeNumericPhoneCell).
export function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toFixed(0) : "";
  }
  return String(value).trim();
}

export function looksLikeNumericPhoneCell(value: unknown, field: ParticipantField): boolean {
  return field === "phone" && typeof value === "number";
}

export interface ParsedRow {
  rowNumber: number; // 1-based, counting the header as row 1 (matches what a spreadsheet shows)
  values: Partial<Record<ParticipantField, string>>;
  warningKeys: string[];
  errorKeys: string[];
}

export interface ParseSpreadsheetResult {
  rows: ParsedRow[];
  validCount: number;
  skippedBlankCount: number;
}

export function parseSpreadsheetRows(
  rawRows: Record<string, unknown>[],
  columnMapping: ColumnMapping,
  existingNames: Iterable<string> = []
): ParseSpreadsheetResult {
  const seenNames = new Set<string>();
  for (const name of existingNames) {
    seenNames.add(name.trim().toLowerCase());
  }
  const rows: ParsedRow[] = [];
  let skippedBlankCount = 0;

  rawRows.forEach((rawRow, index) => {
    const values: Partial<Record<ParticipantField, string>> = {};
    const warningKeys: string[] = [];

    for (const [header, field] of Object.entries(columnMapping)) {
      if (!field) continue;
      const raw = rawRow[header];
      const strValue = cellToString(raw);
      if (!strValue) continue;

      values[field] = strValue;
      if (looksLikeNumericPhoneCell(raw, field)) {
        warningKeys.push("import.warningNumericPhone");
      }
    }

    const hasAnyValue = Object.keys(values).length > 0;
    if (!hasAnyValue) {
      skippedBlankCount++;
      return;
    }

    const errorKeys: string[] = [];
    const trimmedName = values.name?.trim();
    if (!trimmedName) {
      errorKeys.push("import.errorMissingName");
    } else {
      const key = trimmedName.toLowerCase();
      if (seenNames.has(key)) {
        errorKeys.push("import.errorDuplicateName");
      } else {
        seenNames.add(key);
      }
    }

    rows.push({
      rowNumber: index + 2, // +1 for header row, +1 for 1-based indexing
      values,
      warningKeys,
      errorKeys,
    });
  });

  return {
    rows,
    validCount: rows.filter(r => r.errorKeys.length === 0).length,
    skippedBlankCount,
  };
}

export interface RawSheet {
  headers: string[];
  rows: Record<string, unknown>[];
}

// Turns a raw grid (first row = headers) into the header/row-objects shape
// the rest of this module works with. Exported and pure so it's testable
// without a real File — the CSV/XLSX readers below just produce a grid and
// hand it here.
export function gridToRawSheet(grid: unknown[][]): RawSheet {
  if (grid.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = grid[0].map(cell => cellToString(cell));
  const rows = grid.slice(1).map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });

  return { headers, rows };
}

function parseCSVFile(file: File): Promise<RawSheet> {
  return new Promise((resolve, reject) => {
    Papa.parse<unknown[]>(file, {
      skipEmptyLines: true,
      complete: results => resolve(gridToRawSheet(results.data)),
      error: reject,
    });
  });
}

async function parseXLSXFile(file: File): Promise<RawSheet> {
  // Loaded on demand — xlsx is a large dependency and most imports are CSV,
  // so there's no reason to make everyone pay for it in the main bundle.
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: "" });
  return gridToRawSheet(grid);
}

export function isXlsxFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".xlsx") || file.type.includes("spreadsheetml");
}

export function parseSpreadsheetFile(file: File): Promise<RawSheet> {
  return isXlsxFile(file) ? parseXLSXFile(file) : parseCSVFile(file);
}
