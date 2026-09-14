import React from 'react';

export default function ExportCSVButton({ rows = [], filename = 'reconciliation-export.csv', label = 'Export ke CSV' }) {
  const exportCSV = () => {
    if (!rows?.length) {
      alert('Tidak ada data untuk di-export.');
      return;
    }

    const headers = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row || {}).forEach((key) => set.add(key));
        return set;
      }, new Set())
    );

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value).replace(/"/g, '""');
      return /[",\n\r]/.test(str) ? `"${str}"` : str;
    };

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => headers.map((h) => escapeCSV(row?.[h])).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" onClick={exportCSV} title="Export data ke CSV">
      {label}
    </button>
  );
}
