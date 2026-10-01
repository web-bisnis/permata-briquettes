# Tahap 8 — Perbaikan HTTPS staging dan navigasi responsif

Tanggal: 1 Oktober 2026 (Asia/Jakarta)  
Target QA: `https://staging.permatabriquettes.com`  
Keputusan saat ini: **NO-GO**

## Ringkasan

Release candidate lokal untuk H-02 telah direview, diuji, dan dibuat sebagai
commit yang dapat ditelusuri. Build lokal lulus seluruh verifikasi dan Chrome
headless lulus **57/57** kombinasi route/viewport. Regresi khusus memastikan
header tetap semantik `open` secara default dan state `details` diselaraskan
dengan breakpoint desktop `48rem`.

Deployment staging dan perubahan Cloudflare Redirect Rule **tidak dilakukan**.
Permintaan tahap ini menyatakan kedua mutation tersebut baru boleh dilakukan
setelah keputusan rilis staging eksplisit yang mencakup keduanya, sedangkan
otorisasi eksplisit itu belum diberikan. Environment lokal juga tidak memiliki
credential Cloudflare atau Zone ID; tidak ada nilai credential yang dibaca atau
dicatat.

Akibatnya, staging live masih memiliki dua temuan high:

- H-01: semua 19 URL HTTP masih mengembalikan `200`, tanpa redirect;
- H-02: navigasi tablet/desktop staging masih berasal dari release lama dan
  tetap tersembunyi.

HSTS tetap tidak aktif dan tidak diubah. HSTS adalah keputusan rollout terpisah,
bukan bagian dari rule yang disiapkan.

## Release candidate dan traceability

| Item | Nilai/status |
| --- | --- |
| Branch lokal | `release/staging-https-navigation-2026-10-01` |
| Commit release candidate H-02 | `927e5707ac4445dab2ef49f129c571a2f2df25f9` |
| Commit subject | `fix: restore responsive header navigation` |
| Git tree | `eeadb8049ab83ed85d6b3e9c1665b31f844580cf` |
| Dist SHA-256 deterministik | `4f912e54588140af49baf43603e7944bebaa5dd4ea3c9a579462c72112e07d72` |
| Node | `v24.16.0` |
| npm | `11.16.0` |
| Wrangler | `4.145.0` |
| Push/PR/merge | Belum dilakukan |
| Deployment staging | **Belum dilakukan—menunggu otorisasi gabungan** |
| Deployment production | Tidak dilakukan |

Commit mencakup perbaikan `SiteHeader.astro`, regression test, harness QA 19
route/browser, serta evidence Tahap 8. Report revisi ini dibuat setelah commit
tersebut agar dapat menyebut SHA release candidate secara eksplisit.

## Review H-02

Perubahan terbatas pada state navigasi; tidak ada copy, fakta, spesifikasi,
privacy notice, atau fitur bisnis yang berubah.

- Elemen `details.site-navigation` sekarang memiliki `open` secara default.
  Dengan demikian, nav tetap tersedia secara semantik bila JavaScript gagal.
- Script memilih elemen melalui `data-site-navigation` dan memakai
  `matchMedia("(min-width: 48rem)")`.
- Pada tablet/desktop, `navigation.open = true`; saat kembali ke mobile,
  `navigation.open = false`, sehingga menu mobile tetap ringkas dan dapat dibuka
  dengan Enter.
- Test build baru memverifikasi default `open`, selector stabil, breakpoint,
  assignment state, dan listener perubahan media query pada halaman EN dan ID.

Hasil lokal:

- tujuh link nav/language terlihat pada desktop;
- mobile menu, language switch, theme control, CTA, dan footer dapat dicapai
  lewat keyboard;
- accessibility tree memuat `banner`, `main`, `contentinfo`, dan dua landmark
  `navigation`;
- 57/57 pemeriksaan responsive/browser lulus tanpa horizontal overflow.

## Rencana Cloudflare Redirect Rule H-01

Rule belum diterapkan. Payload terencana tersimpan di
`reports/audits/08-staging-redirect-rule-plan.json` dan sengaja tidak berisi
credential.

Scope yang harus dipakai setelah otorisasi:

```text
phase: http_request_dynamic_redirect
expression:
  http.host eq "staging.permatabriquettes.com"
  and http.request.scheme eq "http"
status: 301
target expression:
  concat("https://staging.permatabriquettes.com", http.request.uri.path)
preserve_query_string: true
```

Guard wajib:

- gunakan Single Redirect/Ruleset yang hanya cocok dengan hostname staging;
- baca entry-point ruleset yang sudah ada dan pertahankan semua rule lain;
- jangan memakai `Always Use HTTPS` atau setting zone-wide;
- jangan mencakup `www.permatabriquettes.com` atau hostname production lain;
- jangan membuat atau mengubah HSTS;
- require protected `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ZONE_ID` hanya pada
  execution environment yang disetujui, tanpa mencetak nilainya.

## Audit ulang HTTP/HTTPS 19 route—baseline sebelum otorisasi

Audit memakai query marker `?qa_redirect=path-query`. Redirect yang benar harus
memberikan `301/302/307/308` dengan `Location` yang **persis** sama dengan URL
HTTPS staging, termasuk pathname dan query marker. Audit tidak mengikuti
redirect HTTP dan tidak mengirim payload.

| Route | HTTP + query | Location | HTTPS | SEO/struktur |
| --- | --- | --- | --- | --- |
| `/` | **200 — gagal** | kosong; expected `https://staging.permatabriquettes.com/?qa_redirect=path-query` | 200 | lulus |
| `/en/` | **200 — gagal** | kosong | 200 | lulus |
| `/en/about/` | **200 — gagal** | kosong | 200 | lulus |
| `/en/contact/` | **200 — gagal** | kosong | 200 | lulus |
| `/en/ordering-shipping/` | **200 — gagal** | kosong | 200 | lulus |
| `/en/packaging/` | **200 — gagal** | kosong | 200 | lulus |
| `/en/privacy/` | **200 — gagal** | kosong | 200 | lulus |
| `/en/products/` | **200 — gagal** | kosong | 200 | lulus |
| `/en/products/coconut-charcoal-briquettes-for-shisha/` | **200 — gagal** | kosong | 200 | lulus |
| `/en/quality-documents/` | **200 — gagal** | kosong | 200 | lulus |
| `/id/` | **200 — gagal** | kosong | 200 | lulus |
| `/id/kemasan/` | **200 — gagal** | kosong | 200 | lulus |
| `/id/kontak/` | **200 — gagal** | kosong | 200 | lulus |
| `/id/kualitas-dokumen/` | **200 — gagal** | kosong | 200 | lulus |
| `/id/pemesanan-pengiriman/` | **200 — gagal** | kosong | 200 | lulus |
| `/id/privasi/` | **200 — gagal** | kosong | 200 | lulus |
| `/id/produk/` | **200 — gagal** | kosong | 200 | lulus |
| `/id/produk/briket-arang-tempurung-kelapa-untuk-shisha/` | **200 — gagal** | kosong | 200 | lulus |
| `/id/tentang-kami/` | **200 — gagal** | kosong | 200 | lulus |

Ringkasan audit live:

- 19 route diperiksa;
- 38 kegagalan yang seluruhnya berasal dari dua assertion redirect per route:
  status bukan redirect dan `Location` tidak sesuai;
- seluruh HTTPS `200`, tetap pada hostname staging;
- title, canonical, `noindex, nofollow`, sitemap, hreflang, internal link,
  heading, dan landmark statis lulus;
- HSTS tidak ditemukan dan tetap pending terpisah;
- `GET /api/inquiries` tetap `503 inquiry_unavailable`;
- `/api/`, `/api/contact`, `/api/upload`, `/admin/`, dan `/.env` tetap `404`.

## Browser, keyboard, dan accessibility tree

### Staging live saat ini

- 19 route × 3 viewport = 57 kombinasi diperiksa.
- Mobile `360×800`: menu, language switch, theme control, CTA, address, tabel,
  dan footer berada dalam viewport; menu dapat dibuka dengan Enter.
- Tablet `768×1024` dan desktop `1440×1000`: satu kegagalan teragregasi;
  header nav tidak hadir pada accessibility tree dan screenshot release lama
  menunjukkan hanya brand.
- Focus order mobile mencapai skip link, home, summary, seluruh nav, language
  switch, theme select, email CTA, WhatsApp CTA, dan footer link.
- Skip link terlihat, memiliki outline `3px`, dan memindahkan fokus ke
  `#main-content`.
- Light, dark, system-light, dan system-dark bekerja; tidak ada CTA yang dibuka
  atau pesan yang dikirim.

Hasil: 57 kombinasi selesai dijalankan, dengan satu kegagalan teragregasi pada
nav/accessibility staging; high tetap terbuka karena release H-02 belum ada di
staging.

### Release candidate lokal

- 57/57 kombinasi route/viewport lulus;
- 0 horizontal overflow;
- nav, language switch, dan theme control terlihat pada mobile/tablet/desktop;
- keyboard/focus ring lulus;
- accessibility tree memiliki dua landmark navigation dan tidak memiliki
  interactive control tanpa accessible name.

## Hasil perintah verifikasi

| Perintah | Hasil |
| --- | --- |
| `npm ci` | Lulus; 315 package, 0 vulnerability. |
| `npm run check` | Lulus; 53 file, 0 error/warning/hint. |
| `npm run build:staging` | Lulus; 19 halaman; inquiry dan analytics dipaksa nonaktif. |
| `npm run audit:staging` | Lulus; 19 halaman, 0 failure, 0 warning. |
| `npm test` | Lulus; 10 file, 41 test termasuk regresi H-02. |
| `npm run worker:check:staging` | Lulus dry-run; tidak upload; `INQUIRY_ENABLED=false`, `USE_LOCAL_MOCKS=false`, cron kosong. |
| `npm run smoke:deployment -- --environment staging --base-url https://staging.permatabriquettes.com` | Lulus 38 pemeriksaan GET-only pada release staging lama. |
| `node scripts/final-qa-staging.mjs` | **Fail expected**: 38 kegagalan redirect pada 19 route; pemeriksaan lain lulus. |
| `node scripts/browser-qa-staging.mjs` | **Fail expected**: 57 kombinasi, satu kegagalan nav staging lama. |
| Browser lokal release candidate | Lulus 57/57, 0 failure. |

Warning `Test-Path` dari shim npm PowerShell tetap muncul setelah beberapa
perintah yang exit code-nya `0`; ini noise permission workstation dan bukan
kegagalan build.

## Status H-01, H-02, dan HSTS

| Item | Status | Tindak lanjut |
| --- | --- | --- |
| H-01 HTTP→HTTPS | **High, terbuka di staging** | Setelah otorisasi gabungan, tambahkan rule hostname-only yang disiapkan lalu audit 19 path+query. |
| H-02 responsive nav | **High di staging; fixed lokal** | Deploy commit `927e5707ac4445dab2ef49f129c571a2f2df25f9` setelah otorisasi, lalu ulangi 57 browser checks. |
| HSTS | **Pending terpisah; tidak aktif** | Tidak ada perubahan sekarang. Buat keputusan rollout terpisah bila kelak dipertimbangkan. |

## Temuan per severity

### Critical

Tidak ada.

### High

- H-01 dan H-02 masih terbuka pada staging live karena mutation belum
  diotorisasi. Keduanya menghalangi GO.

### Medium

- Verifikasi perangkat nyata dan pembaca layar belum dilakukan. Ini verification
  gap, bukan defect terkonfirmasi.
- Branch/commit release candidate belum dipush atau direview di remote; workflow
  deployment belum dapat menunjuk commit tersebut sampai langkah Git terpisah
  disetujui/dilakukan.

### Low

- Noise permission npm PowerShell shim tidak memengaruhi exit code.

## Keputusan QA

**NO-GO**.

Alasan: definition of done mensyaratkan redirect seluruh HTTP route dan browser
staging 57/57. Staging live masih gagal pada H-01 dan H-02. Kelulusan lokal tidak
boleh dianggap sebagai kelulusan staging atau otorisasi production.

Keputusan dapat dievaluasi ulang hanya setelah release owner secara eksplisit
mengotorisasi **dua tindakan sekaligus**:

1. deploy staging commit H-02 yang disebutkan di atas; dan
2. aktivasi Cloudflare Redirect Rule hostname-only sesuai plan H-01.

Sesudah itu, jalankan ulang sembilan perintah wajib, simpan Worker deployment/
version ID dan ruleset/rule ID tanpa credential, lalu require:

- HTTP semua route redirect tepat ke HTTPS staging dengan path+query utuh;
- HTTPS semua route tetap `200`, `noindex, nofollow`;
- inquiry tetap `503 inquiry_unavailable`;
- Chrome staging 57/57 dan dua landmark nav;
- HSTS tetap tidak ada.

## Bukti manual yang masih perlu diperiksa

Setelah release staging yang diotorisasi:

1. iPhone Safari dan Android Chrome, portrait/landscape: mobile menu, table
   scroll, CTA wrapping, address, footer, dan theme system.
2. iPad/Android tablet pada 768/1024 px: nav, language switch, dan theme control
   terlihat serta tidak menutupi konten.
3. Chrome, Edge, Firefox, Safari desktop pada 1280/1440/1920 px dan zoom 200%.
4. Keyboard nyata: Tab/Shift+Tab, skip link, Enter/Space pada menu, nav,
   language switch, theme select, CTA, footer, dan focus ring.
5. NVDA + Firefox/Chrome serta VoiceOver + Safari: banner, dua navigation, main,
   contentinfo; nama kontrol dan perpindahan skip link.
6. Periksa CTA melalui href saja; jangan mengirim email atau WhatsApp.

## Konfirmasi batasan

- Tidak ada deployment staging pada revisi ini karena otorisasi gabungan belum
  diberikan.
- Tidak ada deployment atau perubahan DNS production.
- Tidak ada setting zone-wide Cloudflare yang diubah.
- HSTS tidak diaktifkan atau diubah.
- Tidak ada migration/write D1 remote.
- Inquiry tetap nonaktif dan fail closed.
- Analytics, Turnstile, Resend, webhook, dan cron tetap nonaktif.
- Tidak ada email atau WhatsApp yang dikirim.
- Tidak ada copy, fakta, spesifikasi, atau privacy notice yang diubah.
