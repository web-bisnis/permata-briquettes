# Laporan Tahap 6 — SEO, Aksesibilitas, dan Performance

Tanggal implementasi: 1 Oktober 2026  
Domain produksi: `https://www.permatabriquettes.com`  
Status: **SELESAI, TIDAK DIAKTIFKAN, DAN TIDAK DI-DEPLOY**

## Ringkasan hasil

Konfigurasi SEO typed dan terpusat, canonical, tiga alternate language link,
sitemap, kontrol indexing berbasis environment, serta komponen Cloudflare Web
Analytics yang fail closed sudah diterapkan. Seluruh 19 halaman statis lulus
audit metadata, route, tautan internal, landmark, heading, skip link, kontrol
form yang ada, gambar, placeholder mentah, sitemap, robots, dan analytics marker.

Build default tetap dianggap `local`: seluruh halaman menghasilkan
`noindex, nofollow`, `robots.txt` berisi `Disallow: /`, dan tidak ada URL beacon,
atribut beacon, atau token analytics di `dist/`. Build production eksplisit
menghasilkan `index, follow` dan merujuk sitemap. Build staging tetap
`noindex, nofollow` dan memblokir crawler, termasuk ketika flag analytics dan
token dummy sengaja diberikan untuk menguji fail-closed gate.

Perbaikan aksesibilitas yang terbukti secara statis adalah label kontrol tema
pada halaman English. Sebelumnya komponen memakai label Indonesia sebagai
default; sekarang label mengikuti locale halaman. Tidak ada copy produk,
privacy notice, fakta, klaim, spesifikasi, form, Worker, schema D1, konfigurasi
inquiry, atau event kontak yang diubah.

## File yang dibuat atau diubah

| File | Perubahan |
| --- | --- |
| `.env.example` | Menambahkan `SITE_ENV` dan dua variable Cloudflare Web Analytics dengan default nonaktif/kosong. |
| `astro.config.ts` | Menetapkan origin produksi Astro. |
| `package.json` | Menambahkan perintah audit output lokal. |
| `vitest.config.ts` | Memasukkan test TypeScript di folder `tests/`. |
| `src/env.d.ts` | Mengetik variable environment Tahap 6. |
| `src/config/seo.ts` | Sumber typed untuk origin, locale, root SEO, canonical, robots, alternate, environment, dan analytics gate. |
| `src/content.config.ts` | Menambahkan status `indexable` typed dengan default `true`. |
| `src/components/SeoHead.astro` | Merender description, robots, canonical, dan tiga `hreflang`. |
| `src/components/CloudflareWebAnalytics.astro` | Beacon Cloudflare yang hanya dirender jika ketiga gate terpenuhi. |
| `src/components/SiteHeader.astro` | Memperbaiki label kontrol tema agar mengikuti locale EN/ID. |
| `src/layouts/BaseLayout.astro` | Menggunakan metadata terpusat dan analytics gate untuk halaman lokal. |
| `src/layouts/LanguageGatewayLayout.astro` | Menggunakan metadata root netral dan analytics gate. |
| `src/pages/index.astro` | Menghapus duplikasi metadata root dari page. |
| `src/pages/[...slug].astro` | Meneruskan route dan status indexability typed ke layout. |
| `src/pages/sitemap.xml.ts` | Menghasilkan sitemap dari root dan content collection indexable. |
| `src/pages/robots.txt.ts` | Menghasilkan robots production atau non-production sesuai environment. |
| `scripts/audit-static-build.mjs` | Audit seluruh output build dan menghasilkan bukti JSON. |
| `tests/seo-config.test.ts` | Test unit canonical, robots fail-closed, dan analytics gate. |
| `tests/seo-build.test.mjs` | Test build default, production, staging, dan rendering beacon dengan token dummy. |
| `reports/audits/06-default.json` | Bukti audit build default/local. |
| `reports/audits/06-production.json` | Bukti audit build production. |
| `reports/audits/06-staging.json` | Bukti audit build staging. |
| `reports/06-seo-accessibility-performance.md` | Laporan implementasi ini. |

## Matriks route, canonical, locale, indexing, dan hreflang

Semua route pada tabel berstatus indexable secara konten. Directive aktualnya
adalah `index, follow` hanya pada build production, serta `noindex, nofollow`
pada build staging, local, atau environment yang tidak dikenali. Semua baris
memiliki `x-default` yang sama, yaitu `https://www.permatabriquettes.com/`.

| Route | Locale | Canonical | `hreflang=en` | `hreflang=id` |
| --- | --- | --- | --- | --- |
| `/` | `mul` | `https://www.permatabriquettes.com/` | `https://www.permatabriquettes.com/en/` | `https://www.permatabriquettes.com/id/` |
| `/en/` | `en` | `https://www.permatabriquettes.com/en/` | `https://www.permatabriquettes.com/en/` | `https://www.permatabriquettes.com/id/` |
| `/id/` | `id` | `https://www.permatabriquettes.com/id/` | `https://www.permatabriquettes.com/en/` | `https://www.permatabriquettes.com/id/` |
| `/en/about/` | `en` | `https://www.permatabriquettes.com/en/about/` | `https://www.permatabriquettes.com/en/about/` | `https://www.permatabriquettes.com/id/tentang-kami/` |
| `/id/tentang-kami/` | `id` | `https://www.permatabriquettes.com/id/tentang-kami/` | `https://www.permatabriquettes.com/en/about/` | `https://www.permatabriquettes.com/id/tentang-kami/` |
| `/en/contact/` | `en` | `https://www.permatabriquettes.com/en/contact/` | `https://www.permatabriquettes.com/en/contact/` | `https://www.permatabriquettes.com/id/kontak/` |
| `/id/kontak/` | `id` | `https://www.permatabriquettes.com/id/kontak/` | `https://www.permatabriquettes.com/en/contact/` | `https://www.permatabriquettes.com/id/kontak/` |
| `/en/ordering-shipping/` | `en` | `https://www.permatabriquettes.com/en/ordering-shipping/` | `https://www.permatabriquettes.com/en/ordering-shipping/` | `https://www.permatabriquettes.com/id/pemesanan-pengiriman/` |
| `/id/pemesanan-pengiriman/` | `id` | `https://www.permatabriquettes.com/id/pemesanan-pengiriman/` | `https://www.permatabriquettes.com/en/ordering-shipping/` | `https://www.permatabriquettes.com/id/pemesanan-pengiriman/` |
| `/en/packaging/` | `en` | `https://www.permatabriquettes.com/en/packaging/` | `https://www.permatabriquettes.com/en/packaging/` | `https://www.permatabriquettes.com/id/kemasan/` |
| `/id/kemasan/` | `id` | `https://www.permatabriquettes.com/id/kemasan/` | `https://www.permatabriquettes.com/en/packaging/` | `https://www.permatabriquettes.com/id/kemasan/` |
| `/en/privacy/` | `en` | `https://www.permatabriquettes.com/en/privacy/` | `https://www.permatabriquettes.com/en/privacy/` | `https://www.permatabriquettes.com/id/privasi/` |
| `/id/privasi/` | `id` | `https://www.permatabriquettes.com/id/privasi/` | `https://www.permatabriquettes.com/en/privacy/` | `https://www.permatabriquettes.com/id/privasi/` |
| `/en/products/` | `en` | `https://www.permatabriquettes.com/en/products/` | `https://www.permatabriquettes.com/en/products/` | `https://www.permatabriquettes.com/id/produk/` |
| `/id/produk/` | `id` | `https://www.permatabriquettes.com/id/produk/` | `https://www.permatabriquettes.com/en/products/` | `https://www.permatabriquettes.com/id/produk/` |
| `/en/products/coconut-charcoal-briquettes-for-shisha/` | `en` | `https://www.permatabriquettes.com/en/products/coconut-charcoal-briquettes-for-shisha/` | `https://www.permatabriquettes.com/en/products/coconut-charcoal-briquettes-for-shisha/` | `https://www.permatabriquettes.com/id/produk/briket-arang-tempurung-kelapa-untuk-shisha/` |
| `/id/produk/briket-arang-tempurung-kelapa-untuk-shisha/` | `id` | `https://www.permatabriquettes.com/id/produk/briket-arang-tempurung-kelapa-untuk-shisha/` | `https://www.permatabriquettes.com/en/products/coconut-charcoal-briquettes-for-shisha/` | `https://www.permatabriquettes.com/id/produk/briket-arang-tempurung-kelapa-untuk-shisha/` |
| `/en/quality-documents/` | `en` | `https://www.permatabriquettes.com/en/quality-documents/` | `https://www.permatabriquettes.com/en/quality-documents/` | `https://www.permatabriquettes.com/id/kualitas-dokumen/` |
| `/id/kualitas-dokumen/` | `id` | `https://www.permatabriquettes.com/id/kualitas-dokumen/` | `https://www.permatabriquettes.com/en/quality-documents/` | `https://www.permatabriquettes.com/id/kualitas-dokumen/` |

## Keputusan teknis dan alasan

1. `SITE_ENV` memakai allowlist `local | staging | production`; nilai kosong atau
   tidak dikenali menjadi `local`. Ini mencegah build tanpa konfigurasi dianggap
   production secara tidak sengaja.
2. Canonical dan seluruh alternate selalu menunjuk origin produksi approved.
   Build staging tidak membuat canonical staging.
3. Root memakai `lang="mul"` karena isinya sengaja bilingual, tetapi tidak
   mengklaim locale bisnis baru. Root tetap menjadi `x-default` netral dan
   mengarahkan alternate ke `/en/` dan `/id/`.
4. Title dan description halaman lokal tetap bersumber dari front matter approved
   yang sudah ada. Konfigurasi terpusat hanya mengetik, memvalidasi, dan
   merendernya; tidak ada klaim SEO atau copy bisnis baru.
5. Sitemap membaca content collection yang sama dengan static paths dan hanya
   mengambil entry `indexable`. Root ditambahkan dari konfigurasi root typed.
   Tidak ada tanggal modifikasi yang diasumsikan.
6. Production `robots.txt` mengizinkan crawl dan merujuk sitemap. Staging/local
   memblokir semua crawl dan tidak mengiklankan sitemap; meta robots tetap menjadi
   lapisan kontrol utama untuk `noindex, nofollow`.
7. Cloudflare Web Analytics memerlukan environment production, flag literal
   `true`, dan token nonkosong. Tidak ada custom event, PII, fingerprinting,
   cookie banner, atau analytics pihak ketiga.
8. Structured data dan Open Graph image tidak dibuat karena tidak ada sumber
   approved yang mendukung penambahan tersebut.

## Hasil perintah wajib

| Perintah | Hasil |
| --- | --- |
| `npm ci` | Lulus; 315 package dipasang, 316 diaudit, 0 vulnerability. npm memberi warning bahwa install scripts untuk dua versi esbuild dan workerd belum masuk `allowScripts`; tidak ada approval script yang dilakukan. |
| `npm run check` | Lulus; 47 file, 0 error, 0 warning, 0 hint; Worker TypeScript juga lulus. |
| `npm run build` | Lulus; 19 halaman statis plus `robots.txt` dan `sitemap.xml`. |
| `npm test` | Lulus; 9 test file, 40 test. |

Pada `check`, `build`, dan `test`, wrapper PowerShell npm menampilkan pesan
pasca-proses bahwa jalur npm global di `AppData\Roaming` tidak dapat dibaca oleh
sandbox. Perintah proyek sendiri selesai dengan exit code `0`. `npm ci` semula
terhalang cache global Windows, lalu berhasil setelah akses cache yang diminta
secara eksplisit diberikan.

## Hasil audit build

| Mode | Robots meta | `robots.txt` | Analytics | Halaman | Failure | Warning |
| --- | --- | --- | --- | ---: | ---: | ---: |
| Default/local | `noindex, nofollow` | `Disallow: /`, tanpa sitemap reference | Tidak ada | 19 | 0 | 0 |
| Staging | `noindex, nofollow` | `Disallow: /`, tanpa sitemap reference | Tidak ada, walau flag `true` dan token dummy diberikan | 19 | 0 | 0 |
| Production | `index, follow` | `Allow: /` dan sitemap produksi | Tidak ada karena flag `false` dan token tidak diberikan | 19 | 0 | 0 |

Bukti machine-readable tersedia di:

- `reports/audits/06-default.json`
- `reports/audits/06-staging.json`
- `reports/audits/06-production.json`

Audit memeriksa semua file HTML, bukan sampel. Pemeriksaan mencakup satu title
dan description nonkosong, canonical unik dan sesuai route, `html[lang]`, robots
meta, tepat tiga alternate (`en`, `id`, `x-default`), pasangan alternate yang
reciprocal, satu `h1`, urutan heading tanpa level terlewat, landmark, skip link
dan target, ID duplikat, accessible name tautan/tombol/kontrol, header tabel,
alt dan dimensi gambar bila ada, target tautan internal, marker placeholder,
marker konten internal, serta tidak adanya marker analytics.

Hasil khusus:

- 19 canonical unik dan 19 URL sitemap cocok tepat satu-ke-satu;
- sitemap tidak memuat `/api/`, staging host, localhost, file `.html`, endpoint,
  atau artefak internal;
- seluruh pasangan EN/ID reciprocal dan seluruh `x-default` menunjuk root;
- seluruh internal link memiliki target build;
- tidak ada ID duplikat, tautan tanpa accessible name, kontrol tanpa label,
  heading jump, atau placeholder mentah;
- output saat ini tidak memiliki elemen gambar, sehingga tidak ada alt image
  yang perlu diperbaiki;
- tidak ada endpoint atau artefak build tak dikenal di luar HTML,
  `robots.txt`, `sitemap.xml`, dan `_astro/`.

## Audit ukuran output dan performance

Build default terakhir menghasilkan 32 file dengan total 420.534 byte:

| Jenis | Jumlah | Ukuran |
| --- | ---: | ---: |
| HTML | 19 | 127.327 byte |
| CSS | 1 | 15.700 byte |
| JavaScript asset eksternal | 0 | 0 byte |
| JavaScript inline dalam HTML | 19 salinan | 13.262 byte total; maksimum 698 byte per halaman |
| Font WOFF2 | 10 | 275.940 byte |
| XML sitemap | 1 | 1.541 byte |
| TXT robots | 1 | 26 byte |

Font adalah bagian terbesar, sekitar 65,6% dari total output. Asset terbesar
adalah subset Inter Latin Extended sebesar 85.068 byte. Build juga mengeluarkan
subset Cyrillic, Greek, dan Vietnamese dari import Fontsource yang sudah ada.
Ini dicatat sebagai kandidat evaluasi performance berikutnya, tetapi tidak
dihapus pada tahap ini karena perubahan subset font perlu verifikasi coverage,
rendering, dan fallback di browser/perangkat nyata; tidak dilakukan optimasi
spekulatif dan tidak ada library baru.

Tidak ada bundle JavaScript eksternal. JavaScript inline yang ada adalah
inisialisasi theme dan kontrol theme. Tidak ada budget formal atau target Core
Web Vitals approved, sehingga laporan tidak mengklaim skor performance. Tidak
ada Lighthouse/network trace karena tidak ada browser runtime atau deployment
yang dijalankan pada verifikasi ini.

## Status Cloudflare Web Analytics

Status: **DISIAPKAN, NONAKTIF SECARA DEFAULT, BELUM DIAKTIFKAN**.

Bukti:

- `.env.example` menyimpan flag `false` dan token kosong;
- helper dan test build mensyaratkan production + flag literal `true` + token;
- build default/local lulus scan seluruh `dist/` tanpa
  `static.cloudflareinsights.com`, `data-cf-beacon`, atau token;
- build production audit juga bebas beacon karena flag dimatikan dan token tidak
  diberikan;
- build staging diberi flag `true` dan token dummy
  `audit-token-must-not-render`, tetapi seluruh output tetap bebas URL beacon,
  atribut beacon, dan token tersebut;
- test positive-path hanya membangun output temporary memakai token dummy untuk
  memastikan komponen dapat dirender bila seluruh gate terpenuhi; output
  temporary dihapus oleh test dan tidak pernah dilayani atau mengirim request.

Komponen hanya memuat beacon standar Cloudflare Web Analytics tanpa custom
event. Tidak ada PII, payload inquiry, event kontak, atau sumber hitungan inquiry
yang dialihkan ke analytics. D1 tetap menjadi sumber jumlah inquiry.

## Pemeriksaan manual yang masih diperlukan

Pemeriksaan berikut belum dapat dijalankan aman sebagai audit statis dan perlu
dilakukan manual sebelum aktivasi/deployment:

1. Browser desktop Chrome, Firefox, Edge, dan Safari: navigation/menu, skip link,
   focus visible, theme light/dark/system, zoom 200%–400%, dan reflow 320 CSS px.
2. Browser mobile iOS Safari dan Android Chrome pada perangkat nyata: tap target,
   orientasi, wrapping navigation, tabel horizontal, serta font loading/fallback.
3. Pembaca layar: NVDA + Firefox/Chrome dan VoiceOver + Safari untuk urutan
   heading, nama landmark/navigation, skip link, language switching, tabel,
   alamat, serta pengumuman kontrol tema.
4. Pemeriksaan kontras aktual pada kedua theme dan forced-colors/high-contrast
   mode memakai tooling browser.
5. Lighthouse atau WebPageTest terhadap server preview yang dikontrol, lalu
   terhadap production setelah ada otorisasi deployment, untuk LCP, CLS, INP,
   caching, compression, dan waterfall font.
6. Validasi search-engine pascadeploy untuk robots, sitemap fetch, canonical,
   dan hreflang. Tahap ini tidak boleh dilakukan sebelum deployment diotorisasi.
7. Uji target eksternal email/WhatsApp pada perangkat nyata; audit statis hanya
   memastikan href dan accessible name, bukan membuka layanan eksternal.

## Risiko, batasan, dan keputusan pending

- Audit statis berbasis output HTML tidak menggantikan axe, browser accessibility
  tree, pembaca layar, atau pengujian keyboard/perangkat nyata.
- Sepuluh file font mendominasi ukuran output. Pengurangan subset atau perubahan
  strategi font ditunda sampai coverage glyph dan rendering dapat diuji.
- Root memakai kode bahasa BCP 47 `mul` karena isinya bilingual. Perilaku
  pengucapan per-frasa dibantu atribut `lang="en"` dan `lang="id"`, tetapi tetap
  perlu diverifikasi dengan pembaca layar nyata.
- Sitemap tetap dibuat saat staging/local agar artefaknya dapat diaudit, tetapi
  seluruh URL di dalamnya adalah canonical production; staging/local tidak
  mengiklankannya lewat robots dan seluruh halaman tetap `noindex, nofollow`.
- Nilai Cloudflare Web Analytics production belum disediakan dan aktivasi tetap
  menjadi keputusan terpisah yang memerlukan otorisasi.
- `git` executable tidak tersedia di shell verifikasi, sehingga status/diff
  worktree tidak dapat diperiksa lewat Git CLI. Daftar file di laporan disusun
  dari perubahan yang dilakukan pada tahap ini.

## Konfirmasi batas tahap

Tidak ada deployment, perubahan DNS, resource Cloudflare, request ke Cloudflare
Web Analytics, token production, analytics pihak ketiga, cookie banner,
fingerprinting, custom event, atau event PII yang dibuat. Form inquiry tidak
diaktifkan; Worker, schema D1, privacy notice, konfigurasi inquiry, dan sumber
hitungan inquiry tidak diubah. Tidak ada pekerjaan Tahap 7 atau Tahap 8 yang
dilakukan.
