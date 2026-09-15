import { useMemo, useState } from "react";
import { AlertCircle, Bot, ChevronLeft, ChevronRight, Clock3, FileWarning, RefreshCw } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const text = (v) => String(v ?? "").trim();
const integer = (v) => Math.round(Number(v) || 0).toLocaleString("id-ID");

const statusOf = (row) => text(row?.Status || row?.STATUS || row?.status).toUpperCase();
const isSuccess = (row) => ["SUCCESS", "SUCCEED", "SUCCEEDED", "OK", "DONE"].includes(statusOf(row));
const isFailed = (row) => ["FAILED", "FAIL", "ERROR", "FAILED ", "FAILURE"].includes(statusOf(row));

function parseDate(value) {
  const raw = text(value);
  if (!raw) return "";
  const iso = raw.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2, "0")}-${String(iso[3]).padStart(2, "0")}`;
  const dmy = raw.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, "0")}-${String(dmy[1]).padStart(2, "0")}`;
  return raw.slice(0, 10);
}

function sectionOf(row) {
  // LOG BOT: kategori harus berasal dari kolom Section/Selection pada sheet, bukan ditebak dari kolom lain.
  const direct = row?.Section ?? row?.SECTION ?? row?.section ?? row?.Selection ?? row?.SELECTION ?? row?.selection;
  const value = text(direct).toUpperCase().replace(/[^A-Z]/g, "");
  if (value === "WD" || value.includes("WITHDRAW")) return "WD";
  if (value === "DEPO" || value.includes("DEPOSIT")) return "DEPO";
  return "";
}

function firstField(row, candidates) {
  const keys = Object.keys(row || {});
  const key = keys.find((k) => candidates.some((pattern) => pattern.test(k)));
  return key ? text(row[key]) : "";
}

function timestampOf(row) {
  return firstField(row, [/timestamp/i, /^time$/i, /datetime/i, /date.?time/i, /^tanggal$/i, /^date$/i]);
}

function sourceOf(row) {
  return firstField(row, [/bank/i, /file/i, /source/i, /sheet/i, /account/i, /channel/i]) || "Sumber tidak tercatat";
}

function errorOf(row) {
  return firstField(row, [/error/i, /reason/i, /remark/i, /message/i, /keterangan/i, /note/i, /detail/i]) || "-";
}

function brandOf(row) {
  return text(row?.Brand || row?.BRAND || firstField(row, [/brand/i])) || "-";
}

function detailOf(row) {
  const preferred = ["Detail", "DETAIL", "Message", "MESSAGE", "Remarks", "REMARKS", "Keterangan", "KETERANGAN", "Error", "ERROR"];
  const key = preferred.find((k) => text(row?.[k]));
  if (key) return text(row[key]);
  return Object.entries(row || {})
    .filter(([k, v]) => text(v) && !/status|category|kategori|type|jenis|brand/i.test(k))
    .slice(0, 7)
    .map(([k, v]) => `${k}: ${text(v)}`)
    .join(" • ") || "-";
}

function SummaryCard({ label, value, rate, tone }) {
  return <div className={`rounded-xl p-4 ${tone === "success" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
    <p className={`text-xs font-black ${tone === "success" ? "text-emerald-500" : "text-rose-500"}`}>{label}</p>
    <p className="mt-1 text-2xl font-black dark:text-white">{integer(value)}</p>
    <p className={`mt-1 text-xs font-black ${tone === "success" ? "text-emerald-500" : "text-rose-500"}`}>{rate.toFixed(1)}%</p>
  </div>;
}

export default function BotAutomation({ rows = [], year, month, brand, refreshing, onRefresh }) {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const prepared = useMemo(() => rows.map((row, index) => ({ ...row, _index: index, _category: sectionOf(row), _timestamp: timestampOf(row), _source: sourceOf(row), _error: errorOf(row), _brand: brandOf(row) })), [rows]);

  const baseRows = useMemo(() => prepared.filter((row) => {
    // Abaikan baris selain DEPO/WD. Tidak ada kategori OTHER pada halaman Bot Automation.
    if (!row._category) return false;
    const d = parseDate(row._timestamp || row.Date || row.Tanggal);
    if (year && d && !d.startsWith(String(year))) return false;
    if (month !== "ALL" && month && d && Number(d.slice(5, 7)) !== Number(month)) return false;
    if (brand !== "ALL" && brand && row._brand.toLowerCase() !== String(brand).toLowerCase()) return false;
    return true;
  }), [prepared, year, month, brand]);

  const filteredRows = useMemo(() => baseRows.filter((row) => {
    if (typeFilter !== "ALL" && row._category !== typeFilter) return false;
    if (statusFilter === "SUCCESS" && !isSuccess(row)) return false;
    if (statusFilter === "FAILED" && !isFailed(row)) return false;
    if (search) {
      const haystack = Object.values(row).map(text).join(" ").toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [baseRows, typeFilter, statusFilter, search]);

  const totals = useMemo(() => {
    const success = baseRows.filter(isSuccess).length;
    const failed = baseRows.filter(isFailed).length;
    const other = Math.max(baseRows.length - success - failed, 0);
    return { success, failed, other, total: baseRows.length, rate: baseRows.length ? success / baseRows.length * 100 : 0 };
  }, [baseRows]);

  const summaries = useMemo(() => ["DEPO", "WD"].map((category) => {
    const group = baseRows.filter((row) => row._category === category);
    const success = group.filter(isSuccess).length;
    const failed = group.filter(isFailed).length;
    return { category, success, failed, total: group.length, rate: group.length ? success / group.length * 100 : 0 };
  }), [baseRows]);

  const failures = useMemo(() => {
    const map = new Map();
    baseRows.filter(isFailed).forEach((row) => {
      const key = `${row._category}|||${row._source}`;
      const item = map.get(key) || { category: row._category, source: row._source, count: 0, example: row._error };
      item.count += 1;
      if (!item.example || item.example === "-") item.example = row._error;
      map.set(key, item);
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [baseRows]);

  const visibleRows = filteredRows;
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = visibleRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const donutData = [{ name: "Berhasil", value: totals.success }, { name: "Gagal", value: totals.failed }];
  const monthLabel = month === "ALL" ? "Semua bulan" : new Date(Number(year), Number(month) - 1, 1).toLocaleString("id-ID", { month: "long" });

  return <div className="w-full min-w-0 space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl bg-[#1473E6]/10 p-2.5 text-[#1473E6] dark:bg-[#1473E6]/15"><Bot size={22}/></div>
          <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#7088A9]">Operations Log</p><h2 className="text-2xl font-black dark:text-white">Bot Automation</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Monitoring keberhasilan dan kegagalan berdasarkan kolom Section pada LOG BOT (DEPO dan WD).</p></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-bold text-slate-400 sm:inline">{monthLabel} · {year}</span>
          <button onClick={onRefresh} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/> Sync</button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[310px_minmax(0,1fr)_minmax(320px,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#18233f]">
          <div className="relative h-[220px]"><ResponsiveContainer><PieChart><Pie data={donutData} dataKey="value" nameKey="name" innerRadius={66} outerRadius={94} paddingAngle={3}>{donutData.map((item, index) => <Cell key={item.name} fill={index === 0 ? "#10B981" : "#EF4444"}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-black dark:text-white">{totals.rate.toFixed(0)}%</span><span className="text-sm font-semibold text-slate-400">Success Rate</span></div></div>
          <div className="grid grid-cols-2 gap-2"><SummaryCard label="Berhasil" value={totals.success} rate={totals.rate} tone="success"/><SummaryCard label="Gagal" value={totals.failed} rate={totals.total ? totals.failed / totals.total * 100 : 0} tone="failed"/></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#18233f]">
          <p className="text-sm font-black uppercase tracking-wide text-slate-400">Ringkasan Proses (berdasarkan Section)</p>
          <div className="mt-3 space-y-2">{summaries.map((item) => <div key={item.category} className="rounded-xl bg-slate-100 px-4 py-3 dark:bg-white/5"><div className="flex items-center justify-between"><span className="font-black dark:text-white">{item.category}</span><span className="font-black dark:text-white">{item.total ? `${item.rate.toFixed(1)}%` : "-"}</span></div><div className="mt-1 flex items-center justify-between text-xs font-semibold"><span className="text-emerald-500">Berhasil {integer(item.success)}</span><span className="text-rose-500">Gagal {integer(item.failed)}</span></div></div>)}</div>
          {!baseRows.length && <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs font-semibold text-slate-500 dark:border-white/10">LOG BOT tidak memiliki data untuk filter yang dipilih.</div>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#18233f]">
          <div className="flex items-center justify-between"><p className="text-sm font-black uppercase tracking-wide text-slate-400">Failure Source</p><AlertCircle size={17} className="text-rose-500"/></div>
          <div className="mt-3 max-h-[270px] space-y-2 overflow-y-auto pr-1 scrollbar-thin">{failures.slice(0, 8).map((item, index) => <div key={`${item.category}-${item.source}`} className="flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 dark:bg-white/5"><span className="w-5 shrink-0 text-center text-xs font-black text-slate-400">{index + 1}.</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black dark:text-white">{item.source}</p><p className="text-[10px] font-bold text-slate-400">{item.category} · {item.example || "-"}</p></div><span className="font-black text-rose-500">{integer(item.count)}</span></div>)}{!failures.length && <p className="rounded-xl bg-slate-100 p-4 text-center text-xs font-semibold text-slate-500 dark:bg-white/5">Belum ada failure source.</p>}</div>
        </div>
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#7088A9]">Activity</p><h3 className="mt-1 text-xl font-black dark:text-white">Bot Process Log</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Menampilkan {pageSize} data per halaman dari LOG BOT.</p></div>
        <div className="flex flex-wrap gap-2">
          {[['ALL','Semua'],['DEPO','DEPO'],['WD','WD']].map(([key,label]) => <button key={key} onClick={() => { setTypeFilter(key); setPage(1); }} className={`rounded-full border px-4 py-2 text-xs font-black ${typeFilter === key ? "border-[#1473E6] bg-[#1473E6] text-white" : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"}`}>{label}</button>)}
          <button onClick={() => { setStatusFilter(statusFilter === "FAILED" ? "ALL" : "FAILED"); setPage(1); }} className={`rounded-full border px-4 py-2 text-xs font-black ${statusFilter === "FAILED" ? "border-rose-500 bg-rose-500 text-white" : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"}`}>Failed</button>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Cari log..." className="field min-w-[180px] rounded-full py-2 pl-4"/>
        </div>
      </div>

      <div className="table-shell mt-4 w-full min-w-0 overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead><tr className="border-b text-left text-[11px] font-black uppercase tracking-wider text-slate-400 dark:border-white/10"><th className="px-3 py-3">Timestamp</th><th className="px-3 py-3">Kategori</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Brand</th><th className="px-3 py-3">Source / Bank</th><th className="px-3 py-3">Detail</th></tr></thead>
            <tbody>{pageRows.map((row) => <tr key={row._index} className="border-b border-slate-100 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/[.025]"><td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-500 dark:text-slate-300">{row._timestamp || row.Date || row.Tanggal || "-"}</td><td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black dark:bg-white/10 dark:text-slate-100">{row._category}</span></td><td className="px-3 py-3">{isSuccess(row) ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">SUCCESS</span> : isFailed(row) ? <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-black text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">FAILED</span> : <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">{statusOf(row) || "UNKNOWN"}</span>}</td><td className="px-3 py-3 font-bold dark:text-white">{row._brand}</td><td className="max-w-[250px] truncate px-3 py-3 font-semibold dark:text-slate-200">{row._source}</td><td className="max-w-[520px] truncate px-3 py-3 text-slate-500 dark:text-slate-300" title={detailOf(row)}>{detailOf(row)}</td></tr>)}</tbody>
          </table>
          {!pageRows.length && <div className="p-10 text-center text-sm font-semibold text-slate-500">Tidak ada log yang sesuai filter.</div>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-400">
        <span>Menampilkan {visibleRows.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, visibleRows.length)} dari {integer(visibleRows.length)} log</span>
        <div className="flex items-center gap-2"><button disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="calendar-nav border border-slate-200 disabled:opacity-30 dark:border-white/10"><ChevronLeft size={15}/></button><span>Halaman {safePage} / {totalPages}</span><button disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="calendar-nav border border-slate-200 disabled:opacity-30 dark:border-white/10"><ChevronRight size={15}/></button></div>
      </div>
    </section>

    <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#212743]"><div className="flex items-center gap-2 text-slate-400"><Clock3 size={15}/><span className="text-xs font-black uppercase">Total Log</span></div><p className="mt-2 text-2xl font-black dark:text-white">{integer(totals.total)}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#212743]"><div className="flex items-center gap-2 text-emerald-500"><Bot size={15}/><span className="text-xs font-black uppercase">Success</span></div><p className="mt-2 text-2xl font-black dark:text-white">{integer(totals.success)}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#212743]"><div className="flex items-center gap-2 text-rose-500"><FileWarning size={15}/><span className="text-xs font-black uppercase">Failed</span></div><p className="mt-2 text-2xl font-black dark:text-white">{integer(totals.failed)}</p></div></div>
  </div>;
}
