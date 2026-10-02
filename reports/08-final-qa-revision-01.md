# Tahap 8 — Dokumentasi final staging terverifikasi

Tanggal pembaruan: 1 Oktober 2026 (Asia/Jakarta)  
Target: `https://staging.permatabriquettes.com`  
Status staging: **TERVERIFIKASI**  
Status production: **NO-GO / BELUM DISENTUH**

## Ringkasan keputusan

H-01 dan H-02 telah lulus pada staging. Seluruh 19 route HTTP mengalihkan ke
HTTPS staging dengan path dan query string dipertahankan, seluruh pemeriksaan
HTTPS tetap lulus, dan browser QA lulus 57/57 kombinasi route/viewport.

Website statis dan CTA staging dinyatakan **GO untuk bukti QA staging**. Status
ini tidak mengotorisasi atau menyatakan kesiapan deployment production.
Production tetap **NO-GO** dan memerlukan readiness, approval, deployment, serta
verifikasi tersendiri.

Token Cloudflare staging **belum diubah**. Hardening dihentikan karena identitas
token yang terhubung ke GitHub Environment `staging` tidak dapat dibuktikan
secara aman. Tidak ada nilai token yang dibuka, dibaca, disalin, atau dicetak.

## Bukti verifikasi staging terbaru

| Pemeriksaan | Hasil |
| --- | --- |
| Audit HTTP→HTTPS | **Lulus — 19 route, 0 failure** |
| HTTPS route audit | **Lulus — 19/19 merespons `200`** |
| Smoke GET-only | **Lulus — 38/38 pemeriksaan** |
| Browser/responsive | **Lulus — 57/57 kombinasi route/viewport** |
| Keyboard dan focus | **Lulus pada browser-engine** |
| Accessibility tree | **Lulus; dua landmark navigation tersedia** |
| Worker staging | **Lulus dry-run; tidak ada upload/deployment baru** |
| Inquiry endpoint | **`503 inquiry_unavailable`** |
| HSTS | **Absent; keputusan rollout tetap pending terpisah** |

Perintah yang telah dijalankan untuk bukti terbaru:

```powershell
npm run smoke:deployment -- --environment staging --base-url https://staging.permatabriquettes.com
node scripts/final-qa-staging.mjs
node scripts/browser-qa-staging.mjs
npm run worker:check:staging
```

Hasil aktual:

- smoke: `PASS: staging read-only smoke test; 38 checks.`;
- audit live: `PASS: 19 live routes; 0 failures`;
- browser: `PASS: 57 responsive route/viewport checks; 0 failures`;
- Wrangler: dry-run selesai dengan `--dry-run: exiting now`, tanpa upload.

Seluruh request smoke/audit memakai metode GET read-only. Tidak ada POST,
payload inquiry, PII, email, WhatsApp, webhook, atau mutation request.

## Audit HTTP/HTTPS 19 route

Audit HTTP memakai query marker `?qa_redirect=path-query` dan tidak mengikuti
redirect. Setiap `Location` harus persis memakai hostname staging HTTPS,
pathname yang sama, dan query marker yang sama.

| Route | HTTP | HTTPS | Path/query | SEO staging |
| --- | --- | --- | --- | --- |
| `/` | 301 | 200 | dipertahankan | lulus |
| `/en/` | 301 | 200 | dipertahankan | lulus |
| `/en/about/` | 301 | 200 | dipertahankan | lulus |
| `/en/contact/` | 301 | 200 | dipertahankan | lulus |
| `/en/ordering-shipping/` | 301 | 200 | dipertahankan | lulus |
| `/en/packaging/` | 301 | 200 | dipertahankan | lulus |
| `/en/privacy/` | 301 | 200 | dipertahankan | lulus |
| `/en/products/` | 301 | 200 | dipertahankan | lulus |
| `/en/products/coconut-charcoal-briquettes-for-shisha/` | 301 | 200 | dipertahankan | lulus |
| `/en/quality-documents/` | 301 | 200 | dipertahankan | lulus |
| `/id/` | 301 | 200 | dipertahankan | lulus |
| `/id/kemasan/` | 301 | 200 | dipertahankan | lulus |
| `/id/kontak/` | 301 | 200 | dipertahankan | lulus |
| `/id/kualitas-dokumen/` | 301 | 200 | dipertahankan | lulus |
| `/id/pemesanan-pengiriman/` | 301 | 200 | dipertahankan | lulus |
| `/id/privasi/` | 301 | 200 | dipertahankan | lulus |
| `/id/produk/` | 301 | 200 | dipertahankan | lulus |
| `/id/produk/briket-arang-tempurung-kelapa-untuk-shisha/` | 301 | 200 | dipertahankan | lulus |
| `/id/tentang-kami/` | 301 | 200 | dipertahankan | lulus |

Untuk seluruh route:

- redirect tidak pernah berpindah ke production atau hostname lain;
- HTTPS tetap berada pada `staging.permatabriquettes.com`;
- meta robots tetap `noindex, nofollow`;
- canonical dan sitemap tetap menggunakan production origin yang disetujui;
- hreflang EN/ID/x-default, internal link, heading, dan landmark statis lulus;
- tidak ada form inquiry, file input, Turnstile, atau analytics;
- HSTS tidak ditemukan.

## Browser, responsive, keyboard, dan aksesibilitas

Chrome headless memeriksa 19 route pada:

- mobile `360×800`;
- tablet `768×1024`;
- desktop `1440×1000`.

Hasil 57/57:

- tidak ada horizontal page overflow;
- nav, language switch, dan theme control tampil pada mobile, tablet, dan
  desktop;
- tabel tetap berada dalam horizontal scroll container bila diperlukan;
- CTA, alamat, dan footer berada di dalam viewport;
- menu mobile dapat dibuka melalui keyboard;
- skip link menjadi fokus pertama dan memindahkan fokus ke `#main-content`;
- urutan fokus mencapai nav, language switch, theme select, CTA, dan footer;
- focus ring tersedia pada kontrol yang diperiksa;
- light, dark, system-light, dan system-dark menghasilkan theme yang sesuai;
- accessibility tree memiliki `banner`, dua `navigation`, `main`, dan
  `contentinfo`;
- tidak ada interactive control tanpa accessible name.

CTA hanya diverifikasi melalui href dan tab order. Email dan WhatsApp tidak
dibuka atau dikirim.

## Status H-01, H-02, dan HSTS

| Item | Status staging | Bukti/catatan |
| --- | --- | --- |
| H-01 HTTP→HTTPS | **Closed/lulus** | 19/19 HTTP = 301; hostname, path, dan query dipertahankan. |
| H-02 responsive navigation | **Closed/lulus** | Browser 57/57; nav/language/theme tampil; dua nav landmark tersedia. |
| HSTS | **Absent/pending** | Tidak diaktifkan atau diubah; memerlukan keputusan rollout terpisah. |

Redirect yang terverifikasi hanya berlaku untuk
`staging.permatabriquettes.com`. Audit perilaku membuktikan bahwa request tidak
diarahkan ke hostname production. Tidak ada setting zone-wide atau HSTS yang
diubah dalam pekerjaan dokumentasi ini.

## Traceability release staging

| Item | Bukti/status |
| --- | --- |
| Branch source | `release/staging-https-navigation-2026-10-01` |
| Commit perbaikan H-02 | `927e5707ac4445dab2ef49f129c571a2f2df25f9` |
| Commit dokumentasi/rule plan lokal | `2a83bd5` |
| Redirect | Hostname-only staging; perilaku 301 terverifikasi pada 19 route |
| Deployment staging | Release yang memuat H-02 aktif secara fungsional dan lulus browser QA |
| Worker version/deployment ID | Belum tersedia dalam evidence aman pembaruan ini; tidak direka |
| Redirect ruleset/rule ID | Belum tersedia dalam evidence aman pembaruan ini; tidak direka |

Bukti fungsional staging cukup untuk status QA staging terverifikasi, tetapi
Worker version, workflow run URL/ID, deployed commit metadata, serta redirect
rule ID masih perlu ditambahkan ke change record bila tersedia dari pembacaan
metadata administratif yang aman.

## Status layanan dan activation gate

| Layanan/gate | Status |
| --- | --- |
| Static website staging | Aktif dan terverifikasi |
| HTTP→HTTPS staging | Aktif dan terverifikasi |
| Robots/indexing | `noindex, nofollow`; crawling diblokir |
| Inquiry form | Nonaktif/tidak dirender |
| `GET /api/inquiries` | `503 inquiry_unavailable` |
| D1 migration/write | Tidak dilakukan |
| Cloudflare Web Analytics | Nonaktif |
| Turnstile | Nonaktif |
| Resend/email | Nonaktif; tidak ada email dikirim |
| Webhook | Nonaktif |
| Cron retry | Nonaktif/kosong |
| HSTS | Tidak aktif; pending keputusan terpisah |
| Production | Tidak disentuh; tetap NO-GO |

Worker dry-run membaca konfigurasi staging dengan:

- `INQUIRY_ENABLED="false"`;
- `RUNTIME_MODE="staging"`;
- `USE_LOCAL_MOCKS="false"`;
- cron kosong;
- tidak ada upload atau deployment dari perintah dry-run.

## Token staging — belum diubah

Hardening token tidak dilakukan. Upaya membaca metadata dashboard dihentikan
karena automation tidak dapat menentukan URL browser Cloudflare dengan tingkat
kepastian yang diperlukan. Akibatnya, identitas token yang benar-benar dipakai
oleh secret GitHub Environment `staging` tidak dapat dibuktikan.

Sesuai batasan least privilege:

- tidak ada token yang dipilih atau diedit;
- tidak ada permission yang ditambah/dihapus;
- tidak ada token yang dibuat, diputar, disalin, atau dihapus;
- tidak ada nilai credential yang dibaca atau dicetak;
- tidak ada screenshot dashboard yang disimpan.

Status: **TOKEN HARDENING PENDING — TOKEN BELUM DIUBAH**.

## Materi non-secret yang dibutuhkan sebelum hardening

Hardening berikutnya hanya boleh dimulai setelah tersedia evidence yang
menghubungkan satu token Cloudflare tertentu dengan GitHub Environment
`staging` secara tidak ambigu.

Evidence minimum:

1. metadata Cloudflare token tanpa nilainya:
   - nama token;
   - token ID/identifier non-secret;
   - account owner;
   - waktu dibuat/diperbarui dan, bila tersedia, last-used metadata;
2. scope token saat ini:
   - seluruh permission group;
   - resource/account/zone restriction untuk setiap permission;
3. bukti keterkaitan dengan GitHub Environment `staging`, misalnya change
   record resmi yang memetakan token ID tersebut ke secret bernama
   `CLOUDFLARE_API_TOKEN`, atau audit metadata deployment yang menghubungkan
   token ID, workflow run staging, dan waktu penggunaan;
4. metadata GitHub non-secret:
   - repository dan Environment `staging`;
   - nama secret `CLOUDFLARE_API_TOKEN`;
   - waktu update secret;
   - workflow run/deployment yang memakai Environment tersebut;
5. akses dashboard melalui tab yang dapat ditargetkan secara aman, sudah login,
   tanpa membuka halaman yang menampilkan nilai credential.

Nama token atau kemiripan timestamp saja tidak cukup bila terdapat lebih dari
satu kandidat. Bila mapping tetap ambigu, hardening harus dihentikan.

Scope akhir yang kelak diizinkan hanya:

- **Individual Workers > Editor** untuk
  `permata-briquettes-staging`;
- **Zone > Workers Routes > Write** untuk zone
  `permatabriquettes.com`.

Permission `Admin`, `Content Read-Only`, `Metadata Read-Only`, izin
redirect-rule, dan permission lain harus dihapus hanya setelah identitas token
terbukti. Verifikasi sesudah hardening harus membaca metadata permission tanpa
nilai token dan menjalankan pemeriksaan read-only/dry-run yang relevan; jangan
melakukan deployment hanya untuk menguji token.

## Temuan per severity

### Critical

Tidak ada.

### High

Tidak ada issue high terbuka untuk jalur website statis dan CTA staging.

### Medium

- QA perangkat nyata dan pembaca layar masih pending; ini verification gap,
  bukan defect terkonfirmasi.
- Traceability administratif deployment/version/rule ID belum lengkap.
- Token staging belum di-harden karena identitasnya belum terbukti secara aman.

### Low

- Warning permission dari npm PowerShell shim dapat muncul meskipun command
  berakhir dengan exit code `0`; tidak memengaruhi hasil website.

## Pemeriksaan manual yang masih pending

1. iPhone Safari dan Android Chrome, portrait/landscape: menu, table scroll,
   wrapping CTA, alamat, footer, dan theme system.
2. iPad/Android tablet pada 768/1024 px: nav, language switch, dan theme control.
3. Chrome, Edge, Firefox, dan Safari desktop pada beberapa lebar serta zoom
   200%.
4. Keyboard nyata: Tab/Shift+Tab, skip link, Enter/Space pada menu, theme,
   language, CTA, dan footer.
5. NVDA + Firefox/Chrome dan VoiceOver + Safari: landmark, accessible name,
   focus order, dan skip link.
6. Tambahkan workflow run URL/ID, deployed commit, Worker version, dan redirect
   rule ID ke change record melalui metadata read-only yang aman.

## Keputusan akhir

- **Staging website QA: TERVERIFIKASI.**
- **Token hardening: PENDING, token belum diubah.**
- **Production: NO-GO / belum diverifikasi dan belum disentuh.**
- **HSTS: absent/pending keputusan rollout terpisah.**

Status staging terverifikasi tidak dianggap sebagai otorisasi deployment
production atau aktivasi layanan server.

## Konfirmasi batasan

- Tidak ada perubahan token atau permission Cloudflare.
- Tidak ada browser Cloudflare yang dibuka atau dikendalikan kembali.
- Tidak ada deployment baru dalam pekerjaan dokumentasi ini.
- Production dan DNS production tidak diubah.
- HSTS tidak diaktifkan atau diubah.
- D1 tidak dimigrasi atau ditulis.
- Inquiry, analytics, Turnstile, Resend, webhook, dan cron tetap nonaktif.
- Tidak ada email atau WhatsApp dikirim.
- Tidak ada nilai credential atau screenshot credential yang dicatat.

