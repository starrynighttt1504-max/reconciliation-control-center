import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const safeRows = (rows) => Array.isArray(rows) ? rows.filter(r => r && typeof r === 'object') : [];
const download = (blob, filename) => { const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); };

export default function ExportButtons({ rows=[], filename='reconciliation-export' }) {
  const data = safeRows(rows);
  const csv = () => {
    if (!data.length) return alert('Tidak ada data untuk di-export.');
    const headers=[...new Set(data.flatMap(r=>Object.keys(r)))];
    const esc=v=>{const s=String(v??''); return /[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};
    const body=[headers.map(esc).join(','), ...data.map(r=>headers.map(h=>esc(r[h])).join(','))].join('\r\n');
    download(new Blob(['\uFEFF'+body],{type:'text/csv;charset=utf-8;'}), `${filename}.csv`);
  };
  const excel = () => {
    if (!data.length) return alert('Tidak ada data untuk di-export.');
    const ws=XLSX.utils.json_to_sheet(data); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Data'); XLSX.writeFile(wb,`${filename}.xlsx`);
  };
  return <div className="flex items-center gap-2">
    <button type="button" onClick={csv} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"><Download size={14}/> CSV</button>
    <button type="button" onClick={excel} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1473E6] px-3 py-2 text-xs font-black text-white shadow-sm hover:opacity-90"><Download size={14}/> Excel</button>
  </div>;
}
