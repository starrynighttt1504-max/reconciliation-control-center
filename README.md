# RECONCILIATION CONTROL CENTER — Revised Dashboard

Dashboard React/Vite yang membaca data live dari Google Apps Script API. Struktur UI dan data mengikuti dokumen **REVISI DASHBROAD VER2**.

## Revisi utama
- **Running Trend** memakai hitungan `Trans DP` (DEPO) dan `Trans WD` (WD), bukan nominal uang. Brand dengan total transaksi tertinggi ditampilkan pada area trend.
- **Monthly Brand Ranking** hanya menampilkan metric yang dipilih: `Trans DP`, `Trans WD`, `RGS`, atau `RD`. Jika Brand dipilih pada filter utama, chart dan tabel hanya menampilkan brand tersebut.
- **Overall Ranking** di dashboard utama diganti menjadi **Bot Automation Success vs Failed** berbentuk donut berdasarkan `LOG BOT`.
- **Monthly Brand Ranking History** menggunakan `DATA SUMMARY DAILY`, dengan DEPO chart ke atas dan WD chart ke bawah, plus label brand.
- **Daily Tracker** otomatis menyembunyikan kolom yang seluruh datanya kosong dan mempunyai filter Bulan + Brand serta pagination 25 / 50 / 100 dengan nomor halaman.
<<<<<<< HEAD
- **Bot Automation** tersedia sebagai menu khusus untuk monitoring `LOG BOT`, sekaligus tetap mempertahankan ringkasan Success vs Failed pada dashboard utama.
=======
- **Bot Automation** dihapus dari halaman reconciliation karena sudah ada di dashboard utama.
>>>>>>> b48c8946a473829eb03098d58d72ec3c720cea5a
- **Mutasi Antar Rekening WD** menggantikan nama Reconciliation WD, dengan filter tanggal transaksi, filter status, pencarian, warna nominal debit merah, serta pagination 25 / 50 / 100.
- Tabel **Reconciliation Depo & Mutasi Depo** dihapus dari menu reconciliation.

## Menjalankan lokal
```bash
npm install
npm run dev
```

Buka alamat Vite yang muncul, biasanya `http://localhost:5173`.

## Build production
```bash
npm install
npm run build
npm run preview
```

## Data API
Default API ada di `src/config.js`. Jika ingin mengganti API tanpa mengubah source, buat `.env.local` berdasarkan `.env.example`:

```env
VITE_FINANCE_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

<<<<<<< HEAD
Dashboard melakukan refresh otomatis setiap 5 menit dan tetap memiliki tombol refresh manual. Menu Bot Automation memakai data `botLog` dari payload API yang sama, dengan filter DEPO/WD, status, pencarian, Failure Source, dan pagination 50 baris per halaman.
=======
Dashboard melakukan refresh otomatis setiap 5 menit dan tetap memiliki tombol refresh manual.
>>>>>>> b48c8946a473829eb03098d58d72ec3c720cea5a

## Deploy agar bisa dibuka melalui web
Project ini sudah berbasis Vite sehingga siap dideploy ke **Vercel, Netlify, atau GitHub Pages**. Untuk Vercel/Netlify cukup upload repository/project ini dan gunakan:

- Build command: `npm run build`
- Output directory: `dist`

Jika API Google Apps Script menggunakan URL yang berbeda pada environment production, set `VITE_FINANCE_API_URL` pada environment variables platform tersebut.

## Catatan
Data tidak di-hardcode ke dashboard. Dashboard tetap mengambil data dari Google Sheets melalui Google Apps Script API yang sudah ada pada project.
