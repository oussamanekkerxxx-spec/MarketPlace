'use client';

import { Download } from 'lucide-react';

interface CSVExporterProps {
  data: Array<Record<string, unknown>>;
  filename?: string;
}

const DANGEROUS_FORMULA_PREFIX = /^[=+\-@]/;
const LEADING_SPREADSHEET_WHITESPACE = /^[\t\r\n ]+/;

function sanitizeForSpreadsheet(cell: unknown): string {
  const str = cell === null || cell === undefined ? '' : String(cell);

  if (typeof cell !== 'string') {
    return str;
  }

  const trimmedLeading = str.replace(LEADING_SPREADSHEET_WHITESPACE, '');
  const startsWithControlWhitespace = /^[\t\r\n]/.test(str);

  if (startsWithControlWhitespace || DANGEROUS_FORMULA_PREFIX.test(trimmedLeading)) {
    return `'${str}`;
  }

  return str;
}

export function CSVExporter({ data, filename = 'export.csv' }: CSVExporterProps) {
  const downloadCSV = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);

    const rows = data.map((row) =>
      headers.map((header) => {
        const str = sanitizeForSpreadsheet(row[header]);
        const escaped = str.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r') ? `"${escaped}"` : escaped;
      })
    );

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <button
      onClick={downloadCSV}
      disabled={data.length === 0}
      className="inline-flex items-center gap-2 px-3 lg:px-4 py-2 border bg-white rounded-lg text-xs lg:text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
      aria-label="Exporter CSV"
      title="Exporter CSV"
    >
      <Download className="w-4 h-4 shrink-0" />
      <span className="hidden sm:inline">Exporter CSV</span>
      <span className="sm:hidden">CSV</span>
    </button>
  );
}
