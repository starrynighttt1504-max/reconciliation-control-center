import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Database, LayoutDashboard, Table2, WalletCards, Settings as SettingsIcon, ChevronRight, Bot } from "lucide-react";
import ThemeToggle from "./components/ThemeToggle";
import LiveStatus from "./components/LiveStatus";
import { useFinanceData } from "./hooks/useFinanceData";
import LiveDashboard from "./pages/LiveDashboard";
import DailyTracker from "./pages/DailyTracker";
import ReconciliationData from "./pages/ReconciliationData";
import SettingsPage from "./pages/Settings";
import BotAutomation from "./pages/BotAutomation";
import Login, { seedAdmin } from "./pages/Login";


// CSV export helper
const exportToCSV = (rows, filename = 'reconciliation-export.csv') => {
  if (!rows || !rows.length) {
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

  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const tabs = [
  ["Dashboard", LayoutDashboard],
  ["Daily Tracker", Table2],
  ["Mutasi Antar Rekening WD", Database],
  ["Bot Automation", Bot],
];

export default function App({ dark, setDark }) {
  const {
    dailyRows, usableDailyRows, mutasiBankWDRows, mistakeRows, botLogRows,
    latestDate, runningDate, runningStatus, years, brands, config, loading, refreshing, error, lastSync, cachedAt, apiStatus, retryCount, refresh,
  } = useFinanceData();
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem("recon_session") || "null"); } catch { return null; } });
  useEffect(() => { seedAdmin(); }, []);
  const [tab, setTab] = useState("Dashboard");
  const defaultYear = years.includes(Number(config.year)) ? Number(config.year) : (years[years.length - 1] || new Date().getFullYear());
  const [year, setYear] = useState(defaultYear);
  useEffect(() => { if (years.length && !years.includes(Number(year))) setYear(defaultYear); }, [years, defaultYear, year]);
  // Daily Tracker / Daily Check should default to the current running month
  // (e.g. September) so the user sees live data immediately without having
  // to touch any filter first. "ALL" stays available for historical review.
  const [month, setMonth] = useState("ALL");
  const [monthAutoApplied, setMonthAutoApplied] = useState(false);
  useEffect(() => {
    if (monthAutoApplied || !runningDate) return;
    const runningMonthNumber = Number(runningDate.slice(5, 7));
    if (runningMonthNumber) { setMonth(runningMonthNumber); setMonthAutoApplied(true); }
  }, [runningDate, monthAutoApplied]);
  const [brand, setBrand] = useState("ALL");
  const pageTitle = tab === "Bot Automation" ? "BOT AUTOMATION" : "RECONCILIATION CONTROL CENTER";
  const pageDescription = tab === "Bot Automation"
    ? "Monitoring keberhasilan, kegagalan, dan detail proses otomatis DEPO dan WD dari LOG BOT."
    : "Historical data Januari sampai latest month tetap tersedia untuk ranking. Daily Running mengikuti tanggal database terbaru; jika hari ini belum diinput, sistem memakai H-1. Monthly Running menggunakan MTD sampai tanggal running.";
  const trackerRows = usableDailyRows || dailyRows;
  const months = useMemo(() => [...new Map(trackerRows.filter(r=>Number(r.Year)===Number(year)).map(r=>[Number(r["Num Month"]), r.Month])).entries()].sort((a,b)=>a[0]-b[0]), [trackerRows, year]);
  const trackerBrands = useMemo(() => [...new Set(trackerRows.filter(r => Number(r.Year)===Number(year)).map(r => r.Brand).filter(Boolean))].sort(), [trackerRows, year]);
  const filteredDaily = useMemo(() => trackerRows.filter(r => Number(r.Year)===Number(year) && (month==="ALL" || Number(r["Num Month"])===Number(month)) && (brand==="ALL" || r.Brand===brand)), [trackerRows,year,month,brand]);

  const sideTabs = [
    ["Dashboard", LayoutDashboard],
    ["Daily Check", Table2],
    ["Reconciliation", Database],
    ["Bot Automation", Bot],
    ["Pengaturan", SettingsIcon],
  ];

  if (!session) return <Login onLogin={(user)=>setSession(user)} />;

  return <div className="app-bg min-h-screen text-[#181C3B] dark:text-white">
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm glass dark:border-white/10 dark:bg-[#181C3B]/95">
      <div className="flex h-[72px] items-center justify-between gap-4 px-5 lg:px-7">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-[#181C3B] p-2.5 text-white shadow-sm dark:bg-white dark:text-[#181C3B]"><WalletCards size={20}/></div><div><p className="text-sm font-black tracking-tight">{config.name || "RECONCILIATION CONTROL CENTER"}</p><p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">Google Spreadsheet • Live Reconciliation Control</p></div></div>
        <div className="flex items-center gap-3"><LiveStatus loading={loading} refreshing={refreshing} error={error} lastSync={lastSync} cachedAt={cachedAt} apiStatus={apiStatus} retryCount={retryCount} onRefresh={refresh}/><ThemeToggle dark={dark} setDark={setDark}/></div>
      </div>
    </header>
    <div className="flex min-h-[calc(100vh-72px)]">
      <aside className="sidebar-shell sticky top-[72px] hidden h-[calc(100vh-72px)] w-[255px] shrink-0 border-r border-slate-200 bg-white lg:block dark:border-white/10 dark:bg-[#171B36]">
        <div className="flex h-full flex-col p-4">
          <div className="mb-6 flex items-center gap-3 px-2 pt-2"><div className="rounded-xl bg-gradient-to-br from-[#0D7895] to-[#1B5CA8] p-2.5 text-white shadow-md"><WalletCards size={20}/></div><div><p className="text-sm font-black leading-5">Reconciliation<br/>Operations</p></div></div>
          <p className="px-2 text-[11px] font-black uppercase tracking-[.2em] text-[#7088A9]">Operations</p>
          <nav className="mt-3 space-y-1.5">
            {sideTabs.map(([t,Icon]) => <button key={t} onClick={()=>setTab(t === "Daily Check" ? "Daily Tracker" : t)} className={`side-nav ${((t === "Daily Check" && tab === "Daily Tracker") || t === tab) ? "active" : ""}`}><Icon size={18}/><span>{t}</span>{t === "Reconciliation" && <ChevronRight size={15} className="ml-auto"/>}</button>)}
          </nav>
          <div className="mt-auto"/>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-3 py-5 sm:px-4 lg:px-6 lg:py-6">
        <div className="mx-auto max-w-[1550px]">
          <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-end"><div className="min-w-0"><p className="text-xs font-black uppercase tracking-[.22em] text-[#7088A9]">{tab === "Bot Automation" ? "Operations Log" : "Reconciliation Operations"}</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{pageTitle}</h1><p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500 dark:text-slate-400">{pageDescription}</p></div><div className="grid grid-cols-[100px_1fr_1fr] gap-2"><label className="relative min-w-0"><select value={year} onChange={e=>{setYear(Number(e.target.value));setMonth("ALL");setMonthAutoApplied(true)}} className="field w-full rounded-2xl"><option value="">Year</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-3 text-slate-400" size={16}/></label><label className="relative min-w-0"><select value={month} onChange={e=>{setMonth(e.target.value);setMonthAutoApplied(true)}} className="field w-full rounded-2xl"><option value="ALL">Semua bulan</option>{months.map(([n,m])=><option key={n} value={n}>{m}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-3 text-slate-400" size={16}/></label><label className="relative min-w-0"><select value={brand} onChange={e=>setBrand(e.target.value)} className="field w-full rounded-2xl"><option value="ALL">Semua brand</option>{brands.map(b=><option key={b} value={b}>{b}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-3 text-slate-400" size={16}/></label></div></div>
          <div className="mb-5 flex overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm lg:hidden dark:border-white/10 dark:bg-[#212743]">{tabs.map(([t,Icon])=><button key={t} onClick={()=>setTab(t)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition ${tab===t?"bg-[#181C3B] text-white":"text-slate-500"}`}><Icon size={16}/>{t}</button>)}</div>
          {error && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">{error}</div>}
          {loading && !dailyRows.length ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center font-bold dark:border-white/10 dark:bg-[#212743]">Menghubungkan ke Google Sheets API…</div> : tab === "Dashboard" ? <LiveDashboard rows={dailyRows} year={year} month={month} brand={brand} latestDate={latestDate} runningDate={runningDate} runningStatus={runningStatus}/> : tab === "Daily Tracker" ? <DailyTracker rows={filteredDaily} allRows={dailyRows} year={year} month={month} brand={brand} months={months} brands={trackerBrands} setMonth={(m)=>{setMonth(m);setMonthAutoApplied(true)}} setBrand={setBrand} runningDate={runningDate}/> : tab === "Bot Automation" ? <BotAutomation rows={botLogRows} year={year} month={month} brand={brand} refreshing={refreshing} onRefresh={refresh}/> : tab === "Pengaturan" ? <SettingsPage session={session} onLogout={()=>{localStorage.removeItem("recon_session");setSession(null);}}/> : <ReconciliationData mutasiBankWDRows={mutasiBankWDRows} mistakeRows={mistakeRows} year={year} month={month} brand={brand}/>} 
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743]"><div className="grid gap-3 sm:grid-cols-5"><div><p className="text-xs text-slate-400">Daily rows</p><p className="mt-1 text-lg font-black">{dailyRows.length.toLocaleString("id-ID")}</p></div><div><p className="text-xs text-slate-400">Latest DB date</p><p className="mt-1 text-lg font-black">{latestDate || "-"}</p></div><div><p className="text-xs text-slate-400">Running status</p><p className="mt-1 text-lg font-black">{runningStatus}</p></div><div><p className="text-xs text-slate-400">Mutasi WD rows</p><p className="mt-1 text-lg font-black">{mutasiBankWDRows.length.toLocaleString("id-ID")}</p></div><div><p className="text-xs text-slate-400">Source</p><p className="mt-1 truncate text-sm font-bold">Google Sheets API</p></div></div></section>
          <footer className="py-8 text-center text-xs text-slate-400">Reconciliation Control Center • Google Sheets Live Data • Auto Refresh {config.refreshMinutes || 5} Minutes</footer>
        </div>
      </main>
    </div>
  </div>;
}