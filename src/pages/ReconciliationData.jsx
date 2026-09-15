import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, XCircle, AlertTriangle } from "lucide-react";
import ExportButtons from "../components/ExportButtons";
import DatePicker from "../components/DatePicker";
import { PaginationBar, DatePill, formatDisplayDate } from "../components/TableControls";

const text = (v) => String(v ?? "").trim();
const money = (v) => `Rp ${Math.abs(Math.round(Number(v) || 0)).toLocaleString("id-ID")}`;
const cleanKey = (v) => text(v).toLowerCase().replace(/[\s_()-]+/g, "");

function cleanRows(rows) {
  return (Array.isArray(rows) ? rows : []).filter((row) => Object.values(row || {}).some((v) => text(v) !== ""));
}
function findHeaderLike(headers, needles) { return headers.find((h) => needles.some((n) => cleanKey(h).includes(cleanKey(n)))); }
function findField(row, aliases) {
  const keys = Object.keys(row || {});
  for (const alias of aliases) { const exact = keys.find((k) => cleanKey(k) === cleanKey(alias)); if (exact) return row[exact]; }
  for (const alias of aliases) { const partial = keys.find((k) => cleanKey(k).includes(cleanKey(alias))); if (partial) return row[partial]; }
  return "";
}
function parseDate(value) {
  const raw = text(value);
  if (!raw) return "";
  const iso = raw.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2,"0")}-${String(iso[3]).padStart(2,"0")}`;
  const dmy = raw.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2,"0")}-${String(dmy[1]).padStart(2,"0")}`;
  const shown = formatDisplayDate(raw);
  const parsed = new Date(shown);
  return Number.isNaN(parsed.getTime()) ? raw.slice(0,10) : `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,"0")}-${String(parsed.getDate()).padStart(2,"0")}`;
}
function isDateHeader(h) { return /tanggal|date|time/i.test(h); }
function visibleHeaders(rows, preferred = []) {
  const cleaned = cleanRows(rows); if (!cleaned.length) return [];
  const all = [...new Set(cleaned.flatMap((r) => Object.keys(r || {})))];
  const useful = all.filter((h) => h && !/^unnamed/i.test(h) && !/^column\d+$/i.test(h) && cleaned.some((r) => text(r[h]) !== ""));
  const ordered = preferred.map((p) => useful.find((u) => cleanKey(u) === cleanKey(p))).filter(Boolean);
  return [...ordered, ...useful.filter((h) => !ordered.includes(h))];
}

function applyGlobalFilters(rows, { year, month, brand }) {
  const cleaned = cleanRows(rows); if (!cleaned.length) return [];
  const headers = [...new Set(cleaned.flatMap((r) => Object.keys(r || {})))];
  const dateHeader = findHeaderLike(headers, ["tanggal", "date"]);
  const brandHeader = findHeaderLike(headers, ["brand"]);
  return cleaned.filter((r) => {
    if (brand !== "ALL" && brandHeader && text(r[brandHeader]).toLowerCase() !== text(brand).toLowerCase()) return false;
    if (dateHeader) {
      const d = parseDate(r[dateHeader]);
      if (year && d && !d.startsWith(String(year))) return false;
      if (month !== "ALL" && d && Number(d.slice(5,7)) !== Number(month)) return false;
    }
    return true;
  });
}

function SectionHeader({ title, count, children }) {
  return <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#7088A9]">RECONCILIATION WD</p><h2 className="mt-1 text-xl font-black dark:text-white">{title}</h2><p className="mt-1 text-xs font-semibold text-slate-400">{count.toLocaleString("id-ID")} data tampil</p></div>{children}</div>;
}

export default function ReconciliationData({ mutasiBankWDRows = [], mistakeRows = [], year, month, brand }) {
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const baseRows = useMemo(() => applyGlobalFilters(mutasiBankWDRows, { year, month, brand }), [mutasiBankWDRows, year, month, brand]);
  const headers = useMemo(() => visibleHeaders(baseRows, ["TANGGAL", "Withdrawal Acc (WD)", "Holding Acc (PEN)", "NOMINAL", "Status", "Remarks"]), [baseRows]);
  const dateHeader = useMemo(() => findHeaderLike(headers, ["tanggal", "date"]), [headers]);
  const statuses = useMemo(() => [...new Set(baseRows.map((r) => text(findField(r, ["Status"]))).filter(Boolean))].sort(), [baseRows]);

  const filtered = useMemo(() => baseRows.filter((row) => {
    const rowStatus = text(findField(row, ["Status"]));
    const d = parseDate(dateHeader ? row[dateHeader] : findField(row, ["Tanggal", "Date"]));
    const hay = Object.values(row).map(text).join(" ").toLowerCase();
    if (status !== "ALL" && rowStatus.toLowerCase() !== status.toLowerCase()) return false;
    if (fromDate && d && d < fromDate) return false;
    if (toDate && d && d > toDate) return false;
    if (search && !hay.includes(search.toLowerCase())) return false;
    return true;
  }), [baseRows, status, fromDate, toDate, search, dateHeader]);

  useEffect(() => setPage(1), [status, fromDate, toDate, search, year, month, brand, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const shown = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const reset = () => { setStatus("ALL"); setSearch(""); setFromDate(""); setToDate(""); setPage(1); };
  const mistakeClean = useMemo(() => applyGlobalFilters(mistakeRows, { year, month, brand }), [mistakeRows, year, month, brand]);
  const mistakeHeaders = useMemo(() => { const all=[...new Set(mistakeClean.flatMap(r=>Object.keys(r||{})))]; return all.filter(h=>mistakeClean.some(r=>text(r[h])!=="")); }, [mistakeClean]);
  const mistakeReasonHeader = useMemo(() => mistakeHeaders.find(h=>/mistake|error|reason|remark|keterangan|message|note/i.test(h)) || mistakeHeaders[1], [mistakeHeaders]);
  const mistakeGroups = useMemo(() => { const m=new Map(); mistakeClean.forEach(r=>{const k=text(r[mistakeReasonHeader])||"Tidak ada keterangan";m.set(k,(m.get(k)||0)+1)});return [...m.entries()].sort((a,b)=>b[1]-a[1]); }, [mistakeClean,mistakeReasonHeader]);
  const mistakeTop = mistakeGroups[0];

  const renderValue = (row, h) => {
    if (isDateHeader(h)) return <DatePill value={row[h]} />;
    if (/nominal|amount/i.test(h)) {
      const n = Number(String(row[h] ?? "").replace(/[^0-9.-]/g, "")) || 0;
      const s = text(findField(row, ["Status"])).toLowerCase();
      const isDebit = s.includes("ke rek") || s.includes("penampung") || s.includes("biaya adm");
      return <span className={`font-black ${isDebit ? "text-rose-600" : s.includes("dari rek wd") ? "text-emerald-600" : "text-slate-700 dark:text-slate-200"}`}>{money(n)}</span>;
    }
    if (/status/i.test(h)) {
      const s = text(row[h]).toLowerCase();
      const isDebit = s.includes("ke rek") || s.includes("penampung") || s.includes("biaya adm");
      const isIn = s.includes("dari rek wd");
      return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${isDebit ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" : isIn ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>{text(row[h]) || "-"}</span>;
    }
    return <span className="block max-w-[360px] truncate">{text(row[h]) || "-"}</span>;
  };

  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743]">
      <SectionHeader title="Mutasi Antar Rekening WD" count={filtered.length}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-slate-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Cari account / remarks..." className="field-sm w-56 pl-9"/>{search && <button onClick={()=>setSearch("")} className="absolute right-2 top-2 text-slate-400"><XCircle size={15}/></button>}</div>
          <ExportButtons rows={filtered} filename={`mutasi-wd-${year}-${month}`} /><button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 dark:bg-white/5 dark:text-slate-300"><SlidersHorizontal size={14}/> Reset</button>
        </div>
      </SectionHeader>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Filter berdasarkan tanggal transaksi dan status mutasi. Nominal ke rekening penampung / rekening tujuan yang bersifat debit ditampilkan merah.</p>
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label><span className="mb-1 block text-xs font-bold text-slate-400">Dari tanggal</span><DatePicker value={fromDate} onChange={setFromDate} max={toDate || undefined}/></label>
        <label><span className="mb-1 block text-xs font-bold text-slate-400">Sampai tanggal</span><DatePicker value={toDate} onChange={setToDate} min={fromDate || undefined}/></label>
        <label><span className="mb-1 block text-xs font-bold text-slate-400">Status mutasi</span><select value={status} onChange={(e)=>setStatus(e.target.value)} className="field w-full"><option value="ALL">Semua status</option>{statuses.map((s)=><option key={s} value={s}>{s}</option>)}</select></label>
        <div className="flex items-end"><div className="w-full rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-300">Periode: <span className="font-black text-[#181C3B] dark:text-white">{fromDate || "awal"}</span> → <span className="font-black text-[#181C3B] dark:text-white">{toDate || "akhir"}</span></div></div>
      </div>
      {!shown.length ? <p className="rounded-xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500 dark:bg-white/5">Tidak ada transaksi untuk filter ini.</p> : <div className="overflow-auto scrollbar-thin"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-white/10">{headers.map((h)=><th key={h} className="whitespace-nowrap px-3 py-3">{h}</th>)}</tr></thead><tbody>{shown.map((row,i)=><tr key={`${i}-${text(row[dateHeader])}`} className="border-b border-slate-100 dark:border-white/5">{headers.map((h)=><td key={h} className="px-3 py-3">{renderValue(row,h)}</td>)}</tr>)}</tbody></table></div>}
      <PaginationBar page={currentPage} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} total={filtered.length}/>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743]">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500"/><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#7088A9]">Mistake Analysis</p><h2 className="mt-1 text-xl font-black dark:text-white">Kesalahan Berulang</h2><p className="mt-1 text-xs font-semibold text-slate-400">{mistakeClean.length.toLocaleString("id-ID")} data mistake terdeteksi dari sumber LOG/Mistake.</p></div></div><ExportButtons rows={mistakeClean} filename={`mistake-${year}-${month}`} /></div>
      <div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-500/10"><p className="text-xs font-bold text-amber-700">Total mistake</p><p className="mt-1 text-2xl font-black">{mistakeClean.length.toLocaleString("id-ID")}</p></div><div className="rounded-xl bg-rose-50 p-4 dark:bg-rose-500/10"><p className="text-xs font-bold text-rose-700">Mistake berulang tertinggi</p><p className="mt-1 text-lg font-black dark:text-white">{mistakeTop?.[0]||"-"}</p></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5"><p className="text-xs font-bold text-slate-500">Keterangan</p><p className="mt-1 text-sm font-black dark:text-white">{mistakeTop?`${mistakeTop[1]} kejadian (${((mistakeTop[1]/Math.max(1,mistakeClean.length))*100).toFixed(1)}%)`:"Belum ada data"}</p></div></div>
      {!mistakeClean.length ? <p className="mt-4 rounded-xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500 dark:bg-white/5">Tidak ada data mistake pada filter saat ini.</p> : <div className="mt-4 overflow-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-white/10"><th className="px-3 py-3">Mistake / Keterangan</th><th className="px-3 py-3 text-right">Jumlah</th><th className="px-3 py-3 text-right">Persentase</th><th className="px-3 py-3">Analisis</th></tr></thead><tbody>{mistakeGroups.map(([reason,count])=><tr key={reason} className="border-b border-slate-100 dark:border-white/5"><td className="px-3 py-3 font-bold">{reason}</td><td className="px-3 py-3 text-right font-black">{count}</td><td className="px-3 py-3 text-right font-black">{((count/mistakeClean.length)*100).toFixed(1)}%</td><td className="px-3 py-3 text-slate-500">{count>1?"Terjadi berulang — perlu investigasi root cause.":"Terjadi satu kali pada data yang tersedia."}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
