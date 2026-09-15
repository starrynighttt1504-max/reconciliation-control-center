import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FINANCE_API_URL, REFRESH_MS, RETRY_DELAYS_MS } from "../config";

const CACHE_KEY = "reconciliation_control_center_last_good_data_v1";

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
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("API timeout (30 detik)"));
    }, 30000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    };
    window[callbackName] = (data) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("API script gagal dimuat"));
    };
    const separator = url.includes("?") ? "&" : "?";
    script.src = `${url}${separator}action=all&callback=${encodeURIComponent(callbackName)}&_=${Date.now()}`;
    document.body.appendChild(script);
  });
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.payload?.success) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(payload) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ payload, cachedAt: new Date().toISOString() }));
  } catch {
    // Cache is best-effort. A quota/private-mode error must never break live API.
  }
}

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function useFinanceData() {
  const initialCacheRef = useRef(readCache());
  const [payload, setPayload] = useState(initialCacheRef.current?.payload || null);
  const [loading, setLoading] = useState(!initialCacheRef.current?.payload);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState(null);
  const [cachedAt, setCachedAt] = useState(initialCacheRef.current?.cachedAt ? new Date(initialCacheRef.current.cachedAt) : null);
  const [refreshing, setRefreshing] = useState(false);
  const [apiStatus, setApiStatus] = useState(initialCacheRef.current?.payload ? "CACHED" : "CONNECTING");
  const [retryCount, setRetryCount] = useState(0);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (mountedRef.current) {
      if (silent) setRefreshing(true); else setLoading(true);
      setApiStatus("SYNCING");
      setRetryCount(0);
    }

    let lastError = null;
    try {
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
        if (attempt > 0) {
          const delay = RETRY_DELAYS_MS[attempt - 1];
          if (mountedRef.current) {
            setApiStatus("RETRYING");
            setRetryCount(attempt);
          }
          await sleep(delay);
        }
        try {
          const json = await loadJsonp(FINANCE_API_URL);
          if (!json?.success) throw new Error(json?.error || "API mengembalikan error.");
          if (!mountedRef.current) return;
          setPayload(json);
          setError("");
          setLastSync(new Date());
          setCachedAt(new Date());
          setApiStatus("LIVE");
          setRetryCount(0);
          writeCache(json);
          return;
        } catch (e) {
          lastError = e;
        }
      }

      if (!mountedRef.current) return;
      const cached = readCache();
      if (cached?.payload) {
        setPayload(cached.payload);
        setCachedAt(cached.cachedAt ? new Date(cached.cachedAt) : null);
        setApiStatus("CACHED");
        setError(`API belum merespons. Menampilkan data terakhir yang berhasil${cached.cachedAt ? ` (${new Date(cached.cachedAt).toLocaleTimeString()})` : ""}.`);
      } else {
        setApiStatus("ERROR");
        setError(`Live API gagal diakses setelah ${RETRY_DELAYS_MS.length + 1} percobaan. ${lastError?.message || "Silakan cek deployment Apps Script."}`);
      }
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
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
    dailyRows, usableDailyRows, mustangDepoRows, mutasiBankDepoRows, mutasiBankWDRows, mistakeRows, botLogRows,
    latestDate, runningDate, runningStatus, today, years, brands, config,
    loading, refreshing, error, lastSync, cachedAt, apiStatus, retryCount,
    refresh: () => fetchData(true), apiUrl: FINANCE_API_URL,
  };
}
