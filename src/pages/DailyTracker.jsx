import { ChevronDown, RotateCcw } from "lucide-react";
import { DatePill, PaginationBar } from "../components/TableControls";
import { useEffect, useMemo, useState } from "react";

const money = (v) => `Rp ${Math.round(Number(v) || 0).toLocaleString("id-ID")}`;
const pct = (v) => `${(Number(v || 0) * 100).toFixed(1)}%`;
const text = (v) => String(v ?? "").trim();

const columns = [
  ["Tanggal", "Date"], ["Bulan", "Month"], ["Brand", "Brand"], ["RGS", "RGS"], ["RD", "RD"], ["AP", "AP"],
  ["Conv DP", "Conv DP"], ["Trans DP", "Trans DP"], ["Trans WD", "Trans WD"], ["Conv TR", "Conv TR"],
  ["Total DP", "Total DP"], ["Total WD", "Total WD"], ["Total TO", "Total TO"],
];

function hasValue(rows, key) { return rows.some((r) => text(r[key]) !== ""); }

export default function DailyTracker({ rows = [], month = "ALL", brand = "ALL", months = [], brands = [], setMonth, setBrand, runningDate }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const sorted = useMemo(() => [...rows].sort((a, b) => (a.Date < b.Date ? 1 : -1)), [rows]);
  useEffect(() => setPage(1), [month, brand, rows.length, pageSize]);
  const visibleColumns = useMemo(() => columns.filter(([, key]) => hasValue(sorted, key)), [sorted]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const shown = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const runningMonthLabel = runningDate ? new Date(`${runningDate}T00:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : "";
  const runningDateLabel = runningDate ? new Date(`${runningDate}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "";

  const cell = (r, label, key) => {
    if (label === "Tanggal") return <DatePill value={r[key]} />;
    if (label === "Bulan") return <span className="whitespace-nowrap font-semibold text-slate-500 dark:text-slate-300">{r.Month} {r.Year}</span>;
    if (label === "Brand") return <span className="font-bold">{r.Brand}</span>;
    if (["Conv DP", "Conv TR"].includes(label)) return pct(r[key]);
    if (["Total DP", "Total WD", "Total TO"].includes(label)) return <span className="font-bold">{money(r[key])}</span>;
    return Number(r[key] || 0).toLocaleString("id-ID");
  };

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743]">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#7088A9]">Daily Tracker</p>
        <h2 className="mt-1 text-xl font-black dark:text-white">DATA SUMMARY DAILY</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{month === "ALL" ? "Menampilkan seluruh histori. " : "Menampilkan data sesuai filter. "}Data langsung dari Google Spreadsheet{runningMonthLabel ? ` — running ${runningMonthLabel} sampai ${runningDateLabel} (H-1 jika data hari ini belum tersedia)` : ""}. Hanya baris yang memiliki data ditampilkan; tanggal setelah running date dan baris kosong/0 otomatis disembunyikan.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {setMonth && <label className="relative"><span className="sr-only">Bulan</span><select value={month} onChange={(e) => setMonth(e.target.value)} className="field-sm"><option value="ALL">Semua bulan</option>{months.map(([n, m]) => <option key={n} value={n}>{m}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-2.5 text-slate-400" size={14} /></label>}
        {setBrand && <label className="relative"><span className="sr-only">Brand</span><select value={brand} onChange={(e) => setBrand(e.target.value)} className="field-sm"><option value="ALL">Semua brand</option>{brands.map((b) => <option key={b} value={b}>{b}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-2.5 text-slate-400" size={14} /></label>}
        {(month !== "ALL" || brand !== "ALL") && setMonth && setBrand && <button onClick={() => { setMonth("ALL"); setBrand("ALL"); }} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-black text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300"><RotateCcw size={13}/> Reset</button>}
      </div>
    </div>
    {!shown.length ? <p className="rounded-xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500 dark:bg-white/5">Tidak ada data untuk filter ini.</p> : <div className="overflow-auto scrollbar-thin"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-white/10">{visibleColumns.map(([label]) => <th key={label} className="whitespace-nowrap px-3 py-3">{label}</th>)}</tr></thead><tbody>{shown.map((r) => <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5">{visibleColumns.map(([label, key]) => <td key={label} className="px-3 py-3">{cell(r, label, key)}</td>)}</tr>)}</tbody></table></div>}
    <PaginationBar page={currentPage} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} total={sorted.length} />
  </section>;
}
