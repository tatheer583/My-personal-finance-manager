import type { Category, Transaction } from '@/types';

/**
 * CSV helpers.
 *
 * Excel on Windows is picky: it expects CRLF row endings and a UTF-8 BOM to
 * read non-ASCII characters correctly, so both are applied here.
 */

const BOM = '\uFEFF';

function escapeCell(value: string | number): string {
  const str = String(value);
  // Guard against CSV injection in spreadsheet software (leading =, +, -, @).
  const needsGuard = /^[=+\-@]/.test(str);
  const escaped = /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  return needsGuard ? `"'${escaped}"` : escaped;
}

export interface CsvOptions {
  categories: Category[];
  currency: string;
}

/** Serialises transactions into an Excel-friendly CSV string. */
export function transactionsToCsv(
  transactions: Transaction[],
  options: CsvOptions,
): string {
  const nameById = new Map(options.categories.map((c) => [c.id, c.name]));
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];

  const rows = transactions.map((t) => [
    t.date,
    t.type === 'income' ? 'Income' : 'Expense',
    nameById.get(t.categoryId) ?? 'Uncategorised',
    t.amount,
    t.note ?? '',
  ]);

  const lines = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCell(cell)).join(','))
    .join('\r\n');

  return BOM + lines + '\r\n';
}

/**
 * Parses a CSV string into row arrays.
 * Handles quoted fields, escaped quotes and both LF and CRLF line endings.
 */
export function parseCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\r') {
      // handled by the '\n' branch
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/** Triggers a browser download for the given content. */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
