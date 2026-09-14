import { CheckCircle2, RefreshCw, WifiOff } from "lucide-react";

export default function LiveStatus({ loading, refreshing, error, lastSync, onRefresh }) {
  const live = !error;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
      <div className={`flex items-center gap-1.5 rounded-full px-3 py-2 ${live ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>
        {live ? <CheckCircle2 size={14} /> : <WifiOff size={14} />}
        {loading ? "Connecting…" : live ? "LIVE" : "Fallback"}
      </div>
      {lastSync && <span className="text-slate-400">Last sync {lastSync.toLocaleTimeString()}</span>}
      <button onClick={onRefresh} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-[#212743] dark:text-slate-300">
        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
      </button>
    </div>
  );
}
