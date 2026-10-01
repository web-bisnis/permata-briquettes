# Tahap 8 — QA akhir dan perbaikan sebelum live

Tanggal QA: 1 Oktober 2026 (Asia/Jakarta)  
Target: `https://staging.permatabriquettes.com`  
Keputusan: **NO-GO**

## Ringkasan hasil

Staging live belum memenuhi syarat untuk menjadi bukti persetujuan production.
Tidak ada temuan critical, tetapi ada dua temuan **high** yang masih terbuka pada
staging:

1. seluruh 19 route tersedia langsung melalui HTTP dengan status `200`, bukan
   redirect ke HTTPS; respons HTTPS juga tidak mengirim header HSTS;
2. navigasi utama, language switch, dan theme control hilang pada viewport
   tablet/desktop karena panel berada dalam elemen `details` yang tertutup secara
   semantik.

Temuan navigasi telah diperbaiki dan diverifikasi pada build lokal. Perbaikan
lokal lulus 57 kombinasi route/viewport dan accessibility tree lokal memiliki dua
landmark navigasi. Perbaikan tersebut **belum dirilis ke staging**, sesuai batasan
bahwa release staging baru memerlukan keputusan eksplisit. Temuan HTTP memerlukan
konfigurasi redirect/transport Cloudflare yang terpisah dan tidak diubah dalam QA
ini.

Bagian statis lain lulus: 19 route HTTPS merespons `200`, title/canonical/robots/
hreflang/sitemap konsisten, tidak ada internal link rusak, heading dan landmark
statis valid, tidak ada placeholder mentah, form, file input, analytics, atau
Turnstile. CTA email dan WhatsApp hanya diperiksa dari `href` dan tab order; tidak
ada CTA eksternal yang dibuka dan tidak ada pesan yang dikirim. `GET
/api/inquiries` tetap `503 inquiry_unavailable`.

Keputusan **NO-GO** adalah hasil QA, bukan otorisasi deploy atau perubahan
production.

## Metode dan batas pengujian

- Semua pemeriksaan jaringan memakai GET read-only. Tidak ada POST, payload PII,
  D1 write/migration, email, WhatsApp, webhook, atau mutation request.
- Staging live diperiksa dengan audit HTTP berbasis Node, smoke test, dan Google
  Chrome headless melalui DevTools Protocol.
- Viewport browser: mobile `360×800`, tablet `768×1024`, desktop `1440×1000`.
- Browser plugin interaktif tidak menyediakan browser pada sesi ini
  (`listBrowsers()` kosong). Chrome headless yang telah terpasang dipakai sebagai
  fallback aman. Perangkat nyata dan pembaca layar tetap berstatus manual pending.
- Build lokal memakai mode staging yang memaksa inquiry form dan Cloudflare Web
  Analytics nonaktif.

## Matriks QA 19 route staging

Legenda:

- C = canonical production dengan pathname route yang sama.
- R = meta `noindex, nofollow`.
- SM/HL = route ada tepat satu kali di sitemap production-origin dan memiliki
  tiga alternate (`en`, `id`, `x-default`) yang sesuai/reciprocal.
- Internal = jumlah link root-relative / jumlah rusak.
- LM = jumlah `header/nav/main/footer`.
- IQ = probe global `GET /api/inquiries` menghasilkan `503
  inquiry_unavailable`.

| Route | HTTPS dan title | HTTP | C | R | SM/HL | Internal | CTA href | Heading; LM | IQ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | `200` — Choose a language / Pilih bahasa | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 2/0 | N/A | `h1`; 1/1/1/0 | ✓ |
| `/en/` | `200` — Coconut Charcoal Briquettes Supplier \| Permata Briquettes | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 17/0 | N/A | `h1,h2×6`; 2/2/1/1 | ✓ |
| `/en/about/` | `200` — About Permata Briquettes \| PT Permata Bara Globalindo | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 16/0 | N/A | `h1,h2×5`; 2/2/1/1 | ✓ |
| `/en/contact/` | `200` — Contact Permata Briquettes \| Email and WhatsApp | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 15/0 | email 1; WA 1 | `h1,h2×2`; 2/2/1/1 | ✓ |
| `/en/ordering-shipping/` | `200` — Order & Ship Coconut Charcoal Briquettes \| Permata Briquettes | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 15/0 | N/A | `h1,h2×6`; 2/2/1/1 | ✓ |
| `/en/packaging/` | `200` — Packaging & Private Label Charcoal \| Permata Briquettes | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 15/0 | N/A | `h1,h2×5`; 2/2/1/1 | ✓ |
| `/en/privacy/` | `200` — Privacy Notice | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 15/0 | N/A | `h1,h2×9`; 2/2/1/1 | ✓ |
| `/en/products/` | `200` — Coconut Charcoal Briquettes for Shisha \| Products | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 16/0 | N/A | `h1,h2,h3×3,h2×3`; 2/2/1/1 | ✓ |
| `/en/products/coconut-charcoal-briquettes-for-shisha/` | `200` — Coconut Charcoal Briquettes for Shisha \| Specifications | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 16/0 | N/A | `h1,h2×6`; 2/2/1/1 | ✓ |
| `/en/quality-documents/` | `200` — Charcoal Quality Documents \| Permata Briquettes | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 15/0 | N/A | `h1,h2×5`; 2/2/1/1 | ✓ |
| `/id/` | `200` — Supplier Briket Arang Tempurung Kelapa \| Permata Briquettes | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 17/0 | N/A | `h1,h2×6`; 2/2/1/1 | ✓ |
| `/id/kemasan/` | `200` — Kemasan & Private Label Briket Arang \| Permata Briquettes | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 15/0 | N/A | `h1,h2×5`; 2/2/1/1 | ✓ |
| `/id/kontak/` | `200` — Kontak Permata Briquettes \| Email dan WhatsApp | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 15/0 | email 1; WA 1 | `h1,h2×2`; 2/2/1/1 | ✓ |
| `/id/kualitas-dokumen/` | `200` — Dokumen Kualitas Briket Arang \| Permata Briquettes | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 15/0 | N/A | `h1,h2×5`; 2/2/1/1 | ✓ |
| `/id/pemesanan-pengiriman/` | `200` — Pemesanan & Pengiriman Briket Arang \| Permata Briquettes | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 15/0 | N/A | `h1,h2×6`; 2/2/1/1 | ✓ |
| `/id/privasi/` | `200` — Pemberitahuan Privasi | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 15/0 | N/A | `h1,h2×9`; 2/2/1/1 | ✓ |
| `/id/produk/` | `200` — Produk Briket Arang untuk Shisha \| Permata Briquettes | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 16/0 | N/A | `h1,h2,h3×3,h2×3`; 2/2/1/1 | ✓ |
| `/id/produk/briket-arang-tempurung-kelapa-untuk-shisha/` | `200` — Spesifikasi Briket Arang Tempurung Kelapa untuk Shisha | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 16/0 | N/A | `h1,h2×6`; 2/2/1/1 | ✓ |
| `/id/tentang-kami/` | `200` — Tentang Permata Briquettes \| PT Permata Bara Globalindo | **`200` body; gagal redirect** | ✓ | ✓ | ✓ | 16/0 | N/A | `h1,h2×5`; 2/2/1/1 | ✓ |

Hasil yang berlaku untuk seluruh matriks:

- HTTPS tetap pada hostname staging dan mengembalikan HTML yang sesuai.
- Semua HTTP mengembalikan `200 text/html`, body halaman yang sama, tanpa header
  `Location`; HTTPS tidak memiliki `Strict-Transport-Security`.
- Sitemap berisi tepat 19 canonical production, tanpa staging, localhost, API,
  atau `.html` URL.
- `robots.txt` staging memiliki `User-agent: *` dan `Disallow: /`, serta tidak
  mengiklankan sitemap.
- Semua link internal mengarah ke route yang dibangun; target fragment lokal
  tersedia.
- Tidak ada form aktif atau input file pada route mana pun.

## Responsif, theme, dan pemeriksaan visual

### Staging live

Browser memeriksa 19 route pada tiga viewport, total 57 kombinasi.

- Mobile: tidak ada horizontal page overflow; menu, language switch, theme
  control, CTA, tabel, alamat, dan footer tetap di dalam viewport.
- Tablet/desktop: konten, tabel, alamat, CTA, dan footer tidak overflow, tetapi
  navigasi header tidak terlihat karena `details` tertutup. Screenshot tablet dan
  desktop mengonfirmasi header hanya memuat brand.
- Tabel pada halaman spesifikasi/dokumen memakai scroll container saat lebar
  konten melebihi viewport; tidak memperlebar halaman.
- CTA panjang memakai wrapping dan tetap berada dalam card/viewport.
- Theme `system-light`, `system-dark`, `light`, dan `dark` menghasilkan token
  warna yang berbeda sesuai mode. Explicit theme tersimpan di `localStorage`;
  mode system menghapus override.
- Rasio kontras token utama hasil hitung statis: ink/paper `14.43:1`,
  ink/white `16.67:1`, accent/white `5.10:1`, accent/paper `4.41:1`,
  paper/charcoal `12.43:1`, white/charcoal `14.35:1`.

Screenshot bukti ada di `reports/audits/08-browser-screenshots/`, termasuk menu
mobile, bagian alamat/footer mobile, tabel tablet, dan halaman desktop.

### Build lokal setelah perbaikan

- 57/57 kombinasi route/viewport lulus tanpa overflow atau elemen keluar
  viewport.
- Tablet dan desktop menampilkan tujuh link nav/language dan theme control.
- Accessibility tree memiliki `banner`, `main`, `contentinfo`, serta dua
  landmark `navigation`.
- Screenshot lokal ada di `reports/audits/08-browser-local-screenshots/`.

## Keyboard dan aksesibilitas

### Hasil staging

- Skip link menjadi fokus pertama, terlihat, memiliki outline `3px`, dan Enter
  memindahkan URL/fokus ke `#main-content`.
- Pada mobile, urutan fokus mencapai home, summary menu, seluruh nav, language
  switch, theme select, email CTA, WhatsApp CTA, lalu footer links.
- Enter membuka menu mobile; semua kontrol fokus yang diperiksa terlihat dan
  memiliki focus ring.
- CTA tidak diaktifkan; hanya `href` dan keterjangkauan keyboard yang diperiksa.
- Static accessibility audit menemukan tepat satu `h1`, tidak ada heading skip,
  accessible name kontrol/link, label theme select, skip target, dan landmark
  HTML yang diharapkan.
- Accessibility tree staging pada desktop hanya memiliki satu landmark nav,
  mengonfirmasi nav header tersembunyi secara semantik.

### Hasil lokal setelah perbaikan

- Mobile menu tetap tertutup pada awal load dan bisa dibuka melalui keyboard.
- Breakpoint `min-width: 48rem` menyetel `details.open = true`; kembali ke mobile
  menutupnya agar state responsif deterministik.
- Markup default memakai `open` supaya nav tetap tersedia bila JavaScript tidak
  berjalan; script kemudian menyelaraskan state dengan breakpoint.
- Regresi keyboard, focus ring, language switch, theme control, CTA, dan dua
  landmark nav lulus pada Chrome headless.

Pemeriksaan source/static dan browser-engine tidak menggantikan pembaca layar
atau perangkat nyata; checklist pending dicatat di bawah.

## Audit permukaan yang harus nonaktif

| Area | Hasil | Bukti |
| --- | --- | --- |
| Placeholder mentah | Lulus | Tidak ada TODO/TBD/FIXME/lorem/template marker pada HTML staging. |
| Form aktif | Lulus | 0 elemen `form` pada 19 route. |
| Input file | Lulus | 0 input `type=file`. |
| Analytics | Lulus/nonaktif | Tidak ada `static.cloudflareinsights.com` atau `data-cf-beacon`; build memaksa analytics off. |
| Turnstile | Lulus/nonaktif | Tidak ada script/widget `challenges.cloudflare.com`/Turnstile. |
| Inquiry | Lulus/fail closed | `GET /api/inquiries` = `503` dan body memuat `inquiry_unavailable`; form tidak dirender. |
| Endpoint lain | Lulus | `/api/`, `/api/contact`, `/api/upload`, `/admin/`, dan `/.env` = `404`. |
| Resend/email | Nonaktif | Tidak ada submit/request email; `INQUIRY_ENABLED=false`; tests lulus. |
| Webhook | Nonaktif | Tidak ada event dikirim/diproses; inquiry fail closed; tests lulus. |
| Cron retry | Nonaktif | `triggers.crons` kosong pada staging; Wrangler hanya dry-run. |
| D1 remote | Tidak disentuh | Tidak ada migration atau write remote. |

## Temuan per severity

### Critical

Tidak ada.

### High

#### H-01 — HTTP tidak dialihkan ke HTTPS

- Status: **terbuka pada staging**.
- Dampak: koneksi awal dapat melayani seluruh halaman lewat plaintext; tidak ada
  redirect ke HTTPS maupun HSTS sebagai perlindungan transport.
- Bukti: seluruh 19 request `http://staging.../<route>` = `200 text/html`, tanpa
  `Location`; response HTTPS root tidak memiliki `Strict-Transport-Security`.
- Tindak lanjut: konfigurasi redirect HTTP→HTTPS pada Cloudflare/custom domain,
  kemudian ulangi audit seluruh 19 route. Evaluasi HSTS secara terpisah agar
  scope dan rollout aman. Jangan mengubah DNS/production dalam tindak lanjut ini.

#### H-02 — Navigasi tablet/desktop staging hilang

- Status: **diperbaiki lokal; menunggu keputusan rilis staging**.
- Dampak: pengguna mouse/keyboard tablet dan desktop tidak memperoleh navigasi
  utama, language switch, atau theme control di header.
- Akar masalah: CSS mencoba menampilkan isi `details` yang tetap tertutup secara
  semantik; browser menyembunyikannya dari rendering/accessibility tree.
- Perbaikan: `SiteHeader.astro` memberi default `open` dan menyelaraskan state
  dengan media query `48rem`.
- Regresi lokal: 57/57 route/viewport lulus, tujuh nav/language link terlihat,
  dan accessibility tree memiliki dua landmark nav.
- Tindak lanjut: review perubahan, buat keputusan rilis staging eksplisit,
  release terpisah, lalu ulangi smoke, audit live, keyboard, visual, dan
  accessibility tree. Tidak ada release yang dilakukan dalam tahap ini.

### Medium

#### M-01 — Verifikasi perangkat nyata dan pembaca layar belum dilakukan

- Status: **manual pending; bukan defect terkonfirmasi**.
- Dampak: perbedaan Safari/iOS, Android, NVDA, VoiceOver, zoom, dan input touch
  belum dapat dieliminasi hanya dari Chrome headless.
- Tindak lanjut: jalankan checklist manual setelah H-02 tersedia di staging.

### Low

#### L-01 — Noise permission dari npm PowerShell shim

- Status: terbuka pada environment QA; tidak memengaruhi exit code akhir.
- Bukti: beberapa perintah npm yang lulus tetap mencetak warning `Test-Path`
  terhadap instalasi npm user. `npm ci` awal dan Wrangler awal juga terblokir
  sandbox, lalu lulus setelah dijalankan dengan izin yang tepat.
- Tindak lanjut: rapikan PATH/permission npm pada workstation bila ingin log CI
  yang bersih. Ini bukan issue website.

#### L-02 — Git CLI tidak tersedia dalam environment

- Status: limitation pencatatan lokal; bukan issue website.
- Dampak: `git status/diff` tidak dapat dipakai untuk membuktikan daftar file.
  Daftar di laporan ini berasal dari file yang dibuat/diubah langsung selama QA.

## Perbaikan dan status regresi

| Perubahan | Verifikasi lokal | Status staging |
| --- | --- | --- |
| Sinkronisasi `details.open` pada header dengan breakpoint `48rem`; default `open` untuk fallback tanpa JS | Check/build/audit/test lulus; Chrome 57/57; dua nav landmark | Belum dirilis; staging masih gagal |
| Audit live 19 route yang reproducible | Menemukan tepat 38 kegagalan transport (dua assertion per route) dan tidak menemukan kegagalan lain | Artifact tersedia |
| Harness Chrome untuk responsive/keyboard/theme/AX/screenshot | Staging mengisolasi satu kegagalan nav; build lokal 0 kegagalan | Artifact tersedia |

## Hasil perintah verifikasi wajib

| Perintah | Hasil akhir |
| --- | --- |
| `npm ci` | Lulus; 315 package dipasang, 0 vulnerability. Percobaan sandbox pertama gagal EPERM pada cache npm, lalu pengulangan berizin lulus. Ada warning allow-scripts untuk tiga postinstall dependency; build/test tetap lulus. |
| `npm run check` | Lulus; 52 file, 0 error, 0 warning, 0 hint. |
| `npm run build:staging` | Lulus; 19 halaman; inquiry form dan Cloudflare Web Analytics dipaksa nonaktif. |
| `npm run audit:staging` | Lulus; 19 halaman, 32 output file, 0 failure, 0 warning. |
| `npm test` | Lulus; 9 test file, 40 test. |
| `npm run worker:check:staging` | Lulus sebagai Wrangler dry-run; 51 asset dibaca, tidak upload; `INQUIRY_ENABLED=false`, `RUNTIME_MODE=staging`, `USE_LOCAL_MOCKS=false`, D1 binding terbaca. |
| `npm run smoke:deployment -- --environment staging --base-url https://staging.permatabriquettes.com` | Lulus; 38 pemeriksaan GET-only. |

Verifikasi tambahan:

| Pemeriksaan | Hasil |
| --- | --- |
| `node scripts/final-qa-staging.mjs` | Fail yang diharapkan: 19 route diperiksa, 38 assertion transport gagal karena status HTTP `200` dan tidak ada redirect. Semua assertion HTTPS/SEO/link/CTA/struktur/service lulus. |
| Chrome staging | 57 kombinasi route/viewport; satu kegagalan teragregasi: nav accessibility desktop hilang. Visual tablet/desktop mengonfirmasi. |
| Chrome build lokal | Lulus 57/57, 0 kegagalan. |

## File yang dibuat atau diubah

Source/perbaikan:

- `src/components/SiteHeader.astro` — perbaikan state navigasi responsif.
- `scripts/final-qa-staging.mjs` — audit read-only 19 route dan endpoint.
- `scripts/browser-qa-staging.mjs` — QA Chrome untuk responsive, keyboard,
  theme, accessibility tree, dan screenshot.

Laporan dan bukti:

- `reports/08-final-qa.md`.
- `reports/audits/07-staging.json` — diregenerasi oleh audit staging wajib.
- `reports/audits/08-staging-live.json`.
- `reports/audits/08-browser.json`.
- `reports/audits/08-browser-local.json`.
- `reports/audits/08-browser-screenshots/*.png`.
- `reports/audits/08-browser-local-screenshots/*.png`.

Generated build/dry-run (`dist/`, `.astro/`, `.wrangler/dry-run-staging/`) juga
diperbarui oleh perintah verifikasi, bukan sebagai release atau deployment.

## Checklist manual yang masih perlu diperiksa

Semua item berikut berseverity **medium verification gap** sampai selesai dan
harus dilakukan setelah perbaikan H-02 dirilis ke staging dengan persetujuan:

1. iPhone Safari dan Android Chrome pada lebar 360/390/412 px, portrait dan
   landscape: menu, focus/touch target, wrapping email, alamat, footer, table
   scroll, serta tidak ada horizontal page scroll.
2. iPad/Safari atau tablet Android pada 768 dan 1024 px, kedua orientasi:
   pastikan nav, language switch, dan theme control terlihat, dapat disentuh, dan
   tidak menutupi konten.
3. Chrome, Edge, Firefox, dan Safari desktop pada 1280/1440/1920 px: nav aktif,
   footer, tabel, zoom 200%, dan reflow.
4. Keyboard nyata: Tab/Shift+Tab dari address bar, skip link, menu mobile dengan
   Enter dan Space, seluruh nav, language switch, theme select, CTA, dan footer;
   periksa focus ring tidak tertutup sticky/overlay.
5. NVDA + Firefox/Chrome serta VoiceOver + Safari: landmark list harus berisi
   banner, dua navigation, main, contentinfo; nama menu/theme/language/CTA harus
   diumumkan; skip link memindahkan virtual dan keyboard focus secara masuk akal.
6. Light/dark/system pada OS nyata: ganti preferensi sistem ketika mode System
   aktif, lalu reload/navigasi antarbahasa untuk memeriksa persistensi dan tidak
   ada flash yang mengganggu.
7. CTA: inspeksi target `mailto:marketing@permatabriquettes.com` dan
   `https://wa.me/6281130887797` melalui href/status browser saja. Jangan kirim
   email atau WhatsApp.

## Risiko dan blocker production yang tersisa

- **H-01:** redirect HTTP→HTTPS belum ada pada staging dan tidak dapat diperbaiki
  hanya oleh patch statis yang belum dirilis.
- **H-02:** perbaikan navigasi masih hanya lokal; staging live belum merefleksikan
  release candidate yang lulus browser QA.
- Checklist perangkat nyata/pembaca layar belum selesai.
- Production tidak pernah diuji atau diubah dalam tahap ini. Keputusan release,
  resource/DNS/HTTPS production, protected credentials, rollback target, dan
  production smoke test tetap merupakan gate terpisah.

Untuk mengubah keputusan menjadi GO atau GO DENGAN CATATAN, minimum:

1. setujui dan lakukan release staging terpisah untuk H-02;
2. aktifkan redirect HTTPS pada staging melalui perubahan yang disetujui;
3. ulangi matriks 19 route, browser/keyboard/AX, dan smoke; pastikan tidak ada
   critical/high issue terbuka;
4. selesaikan atau terima secara eksplisit verification gap perangkat nyata dan
   pembaca layar;
5. lakukan readiness/approval production sebagai proses terpisah.

## Konfirmasi batasan dan status layanan

- Tidak ada deployment staging baru dan tidak ada deployment production.
- DNS production tidak diubah.
- Tidak ada migration atau write D1 remote.
- Inquiry tetap nonaktif dan fail closed; `GET /api/inquiries` tetap `503
  inquiry_unavailable`.
- Cloudflare Web Analytics tetap nonaktif.
- Turnstile, Resend, webhook, dan cron tetap nonaktif.
- Tidak ada email atau WhatsApp yang dikirim.
- Tidak ada fakta, spesifikasi, privacy notice, atau copy yang diubah.

