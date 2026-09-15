export const FINANCE_API_URL = import.meta.env.VITE_FINANCE_API_URL || "https://script.google.com/macros/s/AKfycby-qxeXcBbA97HLUPNpPAWLruHUg23MqCtf-fmxE-Nzz2-te0_wQBP8zruzYQjsYdW7OA/exec";
export const REFRESH_MS = 5 * 60 * 1000;
// Retry cepat ketika request gagal. Setelah retry terakhir, dashboard memakai Last Known Good Data.
export const RETRY_DELAYS_MS = [2000, 5000, 10000];
