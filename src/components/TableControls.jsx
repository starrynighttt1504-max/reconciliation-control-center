import { useEffect, useMemo, useState } from "react";

export function useRowLimit(totalRows, initial = 50) {
  const [limit, setLimit] = useState(initial);
  useEffect(() => setLimit(initial), [totalRows, initial]);
  return [limit, setLimit];
}

export function PaginationBar({ page, setPage, pageSize, setPageSize, total }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const pages = useMemo(() => {
    const out = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, current + 2);
    if (start > 1) out.push(1, "ellipsis-left");
    for (let i = start; i <= end; i++) out.push(i);
    if (end < totalPages) out.push("ellipsis-right", totalPages);
    return out;
  }, [current, totalPages]);
  if (!total) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-400">
      <span>
        Menampilkan <b className="text-slate-600 dark:text-slate-200">{Math.min(total, (current - 1) * pageSize + 1).toLocaleString("id-ID")}</b>
        {total > 1 ? <>–<b className="text-slate-600 dark:text-slate-200">{Math.min(total, current * pageSize).toLocaleString("id-ID")}</b></> : null}
        {" "}dari <b className="text-slate-600 dark:text-slate-200">{total.toLocaleString("id-ID")}</b> data
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="field-sm">
          {[25, 50, 100].map((n) => <option key={n} value={n}>{n} / halaman</option>)}
        </select>
        <button disabled={current === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/5 dark:text-slate-300">‹</button>
        {pages.map((p, i) => typeof p === "string" ? <span key={`${p}-${i}`} className="px-1">…</span> : <button key={p} onClick={() => setPage(p)} className={`min-w-8 rounded-lg px-2.5 py-1.5 font-black ${p === current ? "bg-[#181C3B] text-white dark:bg-white dark:text-[#181C3B]" : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300"}`}>{p}</button>)}
        <button disabled={current === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/5 dark:text-slate-300">›</button>
      </div>
    </div>
  );
}

export function formatDisplayDate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  let d = null;
  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  const dmy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (iso) d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  else if (dmy) d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  else {
    const asNum = Number(raw);
    if (Number.isFinite(asNum) && asNum > 20000 && asNum < 60000) d = new Date(Date.UTC(1899, 11, 30) + asNum * 86400000);
  }
  if (!d || Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function DatePill({ value }) {
  const label = formatDisplayDate(value);
  if (!label) return <span className="text-slate-400">-</span>;
  return <span className="date-pill">{label}</span>;
}
