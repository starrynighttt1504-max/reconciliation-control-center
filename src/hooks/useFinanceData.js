import { useCallback, useEffect, useMemo, useState } from "react";
import { FINANCE_API_URL, REFRESH_MS } from "../config";

const num = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  return raw.includes("%") ? n / 100 : n;
};

const dateOnly = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const iso = raw.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2, "0")}-${String(iso[3]).padStart(2, "0")}`;
  const dmy = raw.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, "0")}-${String(dmy[1]).padStart(2, "0")}`;
  return raw.slice(0, 10);
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function normalizeDaily(row, index) {
  const date = dateOnly(row.TANGGAL || row.Tanggal || row.Date);
  const d = date ? new Date(`${date}T00:00:00`) : null;
  const validDate = d && !Number.isNaN(d.getTime());
  const year = validDate ? d.getFullYear() : num(row.Year);
  const monthNumber = validDate ? d.getMonth() + 1 : num(row["Num Month"]);
  const month = validDate ? d.toLocaleString("en-US", { month: "short" }) : String(row.BULAN || row.Month || "");
  const transDp = num(row["Trans DP"]);
  const transWd = num(row["Trans WD"]);

  return {
    ...row,
    _id: `${date}-${row.BRAND || row.Brand || ""}-${index}`,
    Date: date,
    Year: year,
    Month: month,
    "Num Month": monthNumber,
    Brand: String(row.BRAND || row.Brand || "Unknown").trim() || "Unknown",
    RGS: num(row.RGS),
    RD: num(row.RD),
    AP: num(row.AP),
    "Conv DP": num(row["Conv DP"]),
    "Trans DP": transDp,
    "Trans WD": transWd,
    "Total Transaksi": transDp + transWd,
    "Conv TR": num(row["Conv TR"]),
    "Total DP": num(row["Total DP"]),
    "Total WD": num(row["Total WD"]),
    "Total TO": num(row["Total TO"]),
    "Total DP RD": num(row["Total DP RD"]),
    "Total": num(row.Total),
  };
}

function normalizeRows(section) {
  return Array.isArray(section?.rows) ? section.rows : [];
}

function loadJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `financeApiCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("API timeout"));
    }, 30000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    };
    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("API script gagal dimuat"));
    };
    const separator = url.includes("?") ? "&" : "?";
    script.src = `${url}${separator}action=all&callback=${encodeURIComponent(callbackName)}&_=${Date.now()}`;
    document.body.appendChild(script);
  });
}

export function useFinanceData() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const json = await loadJsonp(FINANCE_API_URL);
      if (!json?.success) throw new Error(json?.error || "API mengembalikan error.");
      setPayload(json);
      setError("");
      setLastSync(new Date());
    } catch (e) {
      setError(`Live API gagal diakses. ${e.message || "Silakan cek deployment Apps Script."}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
    const timer = setInterval(() => fetchData(true), REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchData]);

  const dailyRows = useMemo(() => normalizeRows(payload?.daily).map(normalizeDaily), [payload]);
  const mustangDepoRows = useMemo(() => normalizeRows(payload?.mustangDepo), [payload]);
  const mutasiBankDepoRows = useMemo(() => normalizeRows(payload?.mustangWD?.mutasiBankDepo), [payload]);
  const mutasiBankWDRows = useMemo(() => normalizeRows(payload?.mustangWD?.mutasiBankWD), [payload]);
  const mistakeRows = useMemo(() => normalizeRows(payload?.mustangWD?.mistake), [payload]);
  const botLogRows = useMemo(() => normalizeRows(payload?.botLog), [payload]);

  const today = todayKey();

  // Ignore future/formula placeholder rows and zero-only rows when deciding the
  // operational running date. This prevents prefilled future dates such as
  // 31 Dec from being treated as today's live data.
  const usableDailyRows = useMemo(() => dailyRows.filter((r) => {
    if (!r.Date || r.Date > today) return false;
    return [r.RGS, r.RD, r.AP, r["Trans DP"], r["Trans WD"], r["Total DP"], r["Total WD"], r["Total TO"]].some((v) => Number(v) !== 0);
  }), [dailyRows, today]);

  const latestDate = useMemo(() => {
    const dates = usableDailyRows.map((r) => r.Date).filter(Boolean).sort();
    return dates.length ? dates[dates.length - 1] : "";
  }, [usableDailyRows]);

  const yesterday = useMemo(() => {
    const d = new Date(`${today}T00:00:00`);
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [today]);

  const runningStatus = latestDate === today ? "LIVE" : latestDate === yesterday ? "H-1 FALLBACK" : latestDate ? "DATA DELAY" : "NO DATA";
  const runningDate = latestDate || "";

  const config = payload?.dashboard || {
    name: "RECONCILIATION CONTROL CENTER",
    year: 2026,
    refreshMinutes: 5,
    currency: "IDR",
    includeDanaGantungDaily: false,
  };

  const years = useMemo(() => [...new Set(dailyRows.map((r) => Number(r.Year)).filter(Boolean))].sort((a, b) => a - b), [dailyRows]);
  const brands = useMemo(() => [...new Set(dailyRows.map((r) => r.Brand).filter(Boolean))].sort(), [dailyRows]);

  return {
    dailyRows,
    usableDailyRows,
    mustangDepoRows,
    mutasiBankDepoRows,
    mutasiBankWDRows,
    mistakeRows,
    botLogRows,
    latestDate,
    runningDate,
    runningStatus,
    today,
    years,
    brands,
    config,
    loading,
    refreshing,
    error,
    lastSync,
    refresh: () => fetchData(true),
    apiUrl: FINANCE_API_URL,
  };
}
