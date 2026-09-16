import { CheckCircle2, RefreshCw, WifiOff, Cloud, LoaderCircle } from "lucide-react";

const statusMap = {
  LIVE: {
    label: "LIVE",
    icon: CheckCircle2,
    cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  CONNECTING: {
    label: "Connecting…",
    icon: LoaderCircle,
    cls: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  },
  SYNCING: {
    label: "Syncing…",
    icon: LoaderCircle,
    cls: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  },
  RETRYING: {
    label: "Retrying",
    icon: LoaderCircle,
    cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  CACHED: {
    label: "Cached Data",
    icon: Cloud,
    cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  ERROR: {
    label: "API Error",
    icon: WifiOff,
    cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
};

export default function LiveStatus({
  loading,
  refreshing,
  error,
  lastSync,
  cachedAt,
  apiStatus = "LIVE",
  retryCount = 0,
  onRefresh,
}) {
  const status = statusMap[apiStatus] || statusMap.ERROR;
  const Icon = status.icon;
  const syncTime = lastSync || cachedAt;

  const spinning =
    apiStatus === "CONNECTING" ||
    apiStatus === "SYNCING" ||
    apiStatus === "RETRYING" ||
    refreshing;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
      <div
        title={error || "API tersambung"}
        className={`flex items-center gap-1.5 rounded-full px-3 py-2 ${status.cls}`}
      >
        <Icon size={14} className={spinning ? "animate-spin" : ""} />
        {loading && !syncTime ? "Connecting…" : status.label}
        {apiStatus === "RETRYING" && <span>#{retryCount}</span>}
      </div>

      {syncTime && (
        <span className="text-slate-400">
          Last good sync {syncTime.toLocaleTimeString()}
        </span>
      )}

      <button
        onClick={onRefresh}
        disabled={
          refreshing ||
          apiStatus === "RETRYING" ||
          apiStatus === "SYNCING"
        }
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-[#212743] dark:text-slate-300"
      >
        <RefreshCw
          size={14}
          className={refreshing ? "animate-spin" : ""}
        />
        Refresh
      </button>
    </div>
  );
}
