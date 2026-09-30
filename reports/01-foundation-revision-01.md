# Tahap 1 — Koreksi Rencana Implementasi dan Validasi Root Proyek

Tanggal revisi dan verifikasi: 30 September 2026  
Root yang diaudit: `C:\Users\akmal\Documents\PT Web Bisnis Solusi Teknologi\Permata Briquettes`

## Ringkasan koreksi

Dokumentasi Tahap 1 telah dikoreksi agar rencana Tahap 2–8 mengikuti urutan dan ruang lingkup proyek yang disetujui secara persis. Revisi ini hanya mengubah dokumentasi. Tidak ada perubahan pada kode, dependensi, konfigurasi, struktur aplikasi, copy website, atau integrasi; Tahap 2 belum dimulai.

Root yang diaudit adalah tepat di lokasi yang tercantum di atas. Root tersebut **bukan Git worktree**: tidak ada `.git` yang berlaku dan `git status --short` gagal. Pengesahan bahwa lokasi ini memang root yang benar, atau pemberian lokasi repository Git yang benar, diperlukan sebelum pekerjaan tahap berikutnya. Revisi ini tidak menginisialisasi Git, membuat repository, atau menghubungkan remote.

`website_copy_permata_briquettes.md` **belum tersedia pada root yang diaudit**. Dokumen itu merupakan sumber utama konten dan ketiadaannya adalah hambatan Tahap 3. Revisi ini tidak mencari, memigrasikan, atau mengubah copy website.

## File yang diubah

| File | Perubahan |
| --- | --- |
| `reports/01-foundation.md` | Tabel dan alur Tahap 2–8 dikoreksi; dependensi, keputusan pending, bukti manual, dan rekomendasi diselaraskan dengan urutan proyek yang disetujui. |
| `reports/01-foundation-revision-01.md` | Laporan revisi baru yang mencatat koreksi, validasi, hambatan, dan langkah berikutnya. |

Tidak ada file lain yang diedit pada revisi ini. `npm run check` dan `npm run build` dapat menyegarkan artefak lokal terabaikan di `.astro/` dan `dist/`; hal tersebut hanya hasil verifikasi, bukan perubahan implementasi.

## Alasan koreksi

Rencana semula membagi Tahap 2–8 secara berbeda dari urutan proyek yang telah disetujui, terutama pada pemisahan kontak/CTA awal, sistem inquiry, optimasi, deployment, dan QA akhir. Koreksi mempertahankan semua hasil Tahap 1 yang valid, tetapi mengganti pembagian rencana tersebut tanpa memulai pekerjaan apa pun dari tahap selanjutnya.

## Rencana Tahap 2–8 yang disetujui

| Tahap | Keluaran | Dependensi | Keputusan atau bahan pending |
| --- | --- | --- | --- |
| 2 | Design tokens, font, light/dark theme, layout global, navigasi, footer, dan skeleton halaman. | Fondasi Astro Tahap 1 serta pengesahan root/repository yang benar. | Aset dan aturan merek, file/lisensi font, perilaku pilihan theme, struktur navigasi, daftar route, dan referensi visual yang disetujui. |
| 3 | Content Collections serta implementasi seluruh halaman konten dari dokumen copy. | Skeleton Tahap 2 dan dokumen copy kanonis tersedia. | **Hambatan:** `website_copy_permata_briquettes.md` belum tersedia pada root yang diaudit; mapping copy ke route, aturan media, dan keputusan editorial untuk materi yang belum siap dipublikasikan juga diperlukan. |
| 4 | Halaman kontak dan CTA email/WhatsApp yang aman untuk launch awal. | Halaman dan konten Tahap 3 tersedia. | Alamat email dan nomor WhatsApp resmi, format link/pesan yang disetujui, keterangan kontak yang bersumber, serta teks privasi/legal yang diperlukan. |
| 5 | Worker inquiry, Turnstile, D1, Resend, rate limiting, dan anti-abuse. | Jalur kontak Tahap 4, kontrak data inquiry, dan keputusan pemrosesan data disetujui. | Field/validasi final, schema serta retensi D1, domain/kredensial Resend, Turnstile keys, binding/secrets Cloudflare, batas rate, strategi anti-abuse, origin/CORS, tujuan notifikasi, dan persetujuan privasi/legal. |
| 6 | SEO, metadata, sitemap, robots, analytics, aksesibilitas, dan performance. | Konten Tahap 3, kontak Tahap 4, dan inquiry Tahap 5 sudah stabil. | Domain/canonical, metadata dan aturan indexing, pilihan serta consent analytics, target aksesibilitas, performance budget, dan data terstruktur yang didukung konten. |
| 7 | Konfigurasi Cloudflare, deployment, verifikasi staging/production, dan checklist launch. | Tahap 2–6 selesai; root/repository Git yang benar disahkan; akses environment tersedia. | Repository/branch strategy, akun/project Cloudflare, Static Assets/Worker bindings, D1/Turnstile/Resend secrets per environment, domain/DNS, workflow deployment, rollback, dan approval staging/production. |
| 8 | QA akhir serta perbaikan sebelum live. | Hasil deployment dan checklist Tahap 7 tersedia untuk diuji. | Browser/device matrix, acceptance criteria, klasifikasi severity, pemilik sign-off, keputusan go/no-go, kewenangan perbaikan, dan otorisasi live. |

Urutan ini tidak boleh ditukar atau digabung tanpa persetujuan baru: fondasi visual/skeleton → Content Collections dan seluruh halaman konten → kontak/CTA awal → sistem inquiry → optimasi → Cloudflare/deployment → QA akhir dan perbaikan sebelum live.

## Hasil verifikasi revisi

Semua perintah dijalankan dari `C:\Users\akmal\Documents\PT Web Bisnis Solusi Teknologi\Permata Briquettes`.

| Perintah | Hasil sebenarnya | Status |
| --- | --- | --- |
| `git status --short` | Exit code 1: `fatal: not a git repository (or any of the parent directories): .git` | **Terhambat** — root bukan Git worktree. |
| `npm run check` | 3 file diperiksa; 0 error, 0 warning, 0 hint; exit code 0. | **Lulus**. |
| `npm run build` | Output dan mode `static`; `/index.html` dihasilkan; 1 halaman selesai dibangun; exit code 0. | **Lulus**. |

Wrapper PowerShell npm masih mencetak peringatan akses terhadap npm user-level setelah perintah, tetapi kedua proses npm selesai dengan exit code 0 dan keluaran Astro menyatakan sukses. Hambatan Git tidak dilaporkan sebagai kelulusan.

Hasil Tahap 1 lain yang sebelumnya lulus tetap berlaku dan tidak diubah oleh revisi dokumentasi ini: `npm ci` lulus, dev server merespons HTTP 200, HTML awal terbukti diprerender, dan output build tidak memuat marker placeholder mentah. Rincian buktinya tetap tercatat di `reports/01-foundation.md`.

## Bukti manual yang masih perlu diperiksa

- Pemilik proyek harus mengesahkan bahwa root yang diaudit adalah target yang benar, atau memberikan lokasi repository Git yang benar. Kemiripan nama direktori tidak boleh dijadikan dasar asumsi.
- Setelah root/repository disahkan, pemilik proyek perlu menentukan workflow Git/GitHub yang berlaku tanpa menganggap revisi ini sebagai izin untuk menginisialisasi atau menghubungkan repository.
- Versi kanonis `website_copy_permata_briquettes.md` harus ditempatkan atau diberikan secara eksplisit pada root yang disahkan sebelum Tahap 3.
- Kredensial, kontak, keputusan legal, dan akses environment yang dicantumkan sebagai pending harus dikonfirmasi pada tahap masing-masing, bukan diasumsikan.

## Risiko dan keputusan pending

- Root yang belum disahkan dan bukan Git worktree tidak memiliki baseline, branch, remote, atau jejak perubahan yang dapat diverifikasi melalui Git.
- Memulai pekerjaan sebelum root/repository disahkan berisiko menempatkan perubahan pada lokasi proyek yang salah.
- Tahap 3 tidak dapat dimulai tanpa dokumen copy utama pada root yang benar.
- Tahap 4–8 memiliki dependensi bisnis, legal, keamanan, domain, akun, secrets, dan approval yang harus diputuskan pada urutan tahapnya.
- Hasil check/build memvalidasi fondasi teknis saat ini, bukan kelengkapan fitur dari Tahap 2–8.

## Rekomendasi langkah berikutnya

Sahkan dahulu root `C:\Users\akmal\Documents\PT Web Bisnis Solusi Teknologi\Permata Briquettes` atau berikan repository Git yang benar. Jangan memulai Tahap 2 sebelum pengesahan tersebut dan instruksi pelaksanaan terpisah. Sediakan dokumen copy kanonis sebelum Tahap 3. Revisi ini berhenti pada koreksi dokumentasi dan validasi ulang Tahap 1.
