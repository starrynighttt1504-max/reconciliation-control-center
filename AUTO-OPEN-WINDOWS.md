# Membuka Dashboard Tanpa VS Code

## Opsi A — Web/Hosting (disarankan)

1. Jalankan `npm install` lalu `npm run build`.
2. Upload project ke Vercel atau Netlify.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Setelah deploy, dashboard dapat dibuka langsung melalui URL hosting tanpa VS Code.

## Opsi B — Auto-open di PC Windows

1. Pastikan Node.js sudah terinstall.
2. Jalankan `npm install` satu kali.
3. Double-click `START-DASHBOARD.bat`.
4. Browser akan membuka `http://127.0.0.1:5173/` dan Vite berjalan di proses terpisah.
5. Untuk otomatis saat Windows login, buat shortcut `START-DASHBOARD.bat` di folder Startup Windows (`Win + R` → `shell:startup`).

Catatan: Opsi B tetap membutuhkan PC menyala dan Node.js. Untuk akses dari mana saja, gunakan Opsi A.
