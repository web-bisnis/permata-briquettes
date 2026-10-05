# Operasi

Satu-satunya dokumen operasi. Tanpa nilai secret atau ID akun; semuanya disimpan di GitHub
Environment atau Cloudflare. Staging dan production dirilis dengan form inquiry aktif sejak rilis awal;
tidak ada lagi mode "disabled" untuk rilis.

## Konten dan aset

- **Halaman**: `src/content/pages/{en,id}/*.md`, satu file per bahasa. Route dan metadata ada di frontmatter.
  `en/privacy.md` dan `id/privasi.md` bersumber dari privacy notice yang disetujui; jangan diparafrasa
  tanpa persetujuan baru. Versi notice dan persetujuan marketing dihitung dari isinya
  (`src/config/inquiry-versions.ts`) dan harus sama dengan `PRIVACY_NOTICE_VERSION` dan
  `MARKETING_CONSENT_VERSION` di `wrangler.jsonc`; test akan gagal bila berbeda.
- **Produk dan tim**: YAML di `src/content/products/` dan `src/content/team/`, per bahasa. Skema ketat di
  `src/content.config.ts`; field salah ketik membuat build gagal.
- **Teks antarmuka**: `src/config/` (navigasi, kontak, SEO, copy inquiry).
- **Blog**: `src/content/blog/{en,id}/<nama>.md`, nama file sama di kedua bahasa. Gambar di
  `src/assets/blog/<nama>/`. Frontmatter: `title`, `description`, `date`, `draft` (bawaan `true`), `cover`,
  `coverAlt` (wajib bila ada `cover`), `tags`, `slug` (opsional). Build gagal bila pasangan terjemahan tidak
  ada, hanya satu sisi yang `draft: false`, cover tidak ditemukan, atau slug kembar. Terbitkan dengan
  `draft: false` di kedua file. Pratinjau draft lokal: `PUBLIC_BLOG_PREVIEW_DRAFTS=true npm run dev`
  (hanya `dev`; build mengabaikannya).
- **Aset gambar**: setiap slot didefinisikan di `src/config/media-slots.ts` (nama file, rasio, lebar minimum,
  halaman pemakai). Taruh file di `src/assets/<folder>/` dengan nama persis sesuai tabel di `README.md` folder
  itu; slot yang filenya belum ada tidak menampilkan apa pun. Mengganti foto cukup menimpa file dengan nama
  yang sama. Setelah mengubah `media-slots.ts` jalankan `npm run assets:sync` (README folder dihasilkan,
  jangan diedit tangan; `assets:check` memvalidasinya). `npm run assets:report` menunjukkan slot kosong,
  resolusi rendah, dan rasio yang akan dipotong.
- **Dokumen kualitas**: kartu dan pratinjau di `src/config/documents.ts`, gambar di `src/assets/documents/`.
- **Izin aset**: catat setiap aset baru di `docs/asset-register.md` (sumber, dasar penggunaan, status).
- **i18n**: setiap perubahan konten dibuat di kedua bahasa; `hreflang` dan sitemap dibuat dari pasangan itu.

## Build per environment

| Perintah | Hasil |
| --- | --- |
| `npm run build:staging` | `noindex`; form inquiry aktif bila tiga variable di bawah semuanya diisi. |
| `npm run build:production` | Dapat diindeks; form inquiry aktif bila tiga variable di bawah semuanya diisi; Web Analytics selalu mati. |

Keduanya memaksa `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED=false`, menghapus token analytics dan
`PUBLIC_BLOG_PREVIEW_DRAFTS`, lalu menjalankan `astro build`. Jangan memakai artifact staging untuk
production (direktif indexing berbeda). Variable build form: `PUBLIC_INQUIRY_FORM_ENABLED=true`,
`PUBLIC_INQUIRY_FORM_MODE=live`, `PUBLIC_TURNSTILE_SITE_KEY` (nilai publik). Aturannya di
`scripts/inquiry-activation.mjs`: ketiganya diisi bersama atau tidak sama sekali; setengah terisi, mode selain
`live`, atau site key tidak valid membuat build gagal. Tanpa variable, build tetap menghasilkan situs tanpa
form (dipakai untuk pemeriksaan lokal). Workflow selalu mengirim ketiganya untuk kedua target.

## Deploy

Hanya lewat workflow manual `.github/workflows/cloudflare-deploy.yml` (Actions > Cloudflare manual
deployment > Run workflow). Tidak ada deploy otomatis dari push.

Input: `target` (`staging` atau `production`), `release_confirmation` (frasa persis sesuai target, ditolak bila
berbeda: `DEPLOY_STAGING_INQUIRY_ACTIVE_WITH_CUSTOM_DOMAIN` atau
`DEPLOY_PRODUCTION_INQUIRY_ACTIVE_WITH_CUSTOM_DOMAIN`), `staging_verified` (wajib `true` untuk production). Langkah workflow: validasi konfirmasi, cek secret
ada, cek production Environment punya minimal satu protection rule, `npm ci`, `npm run check`,
`npm run build:<target>`, `npm run audit:<target>`, `npm test`, `npm run prepare:deploy-config`,
dry-run Wrangler, `wrangler deploy --strict`, lalu `npm run smoke:deployment` (GET saja, tanpa payload).

Job memakai `environment: <target>`, jadi GitHub menahan job pada titik persetujuan (required reviewers
`production`) sebelum langkah pertama berjalan. Bila reviewer menolak, job berhenti tanpa menyentuh Cloudflare.
Langkah "cek protection rule" hanya memastikan `production` punya minimal satu aturan perlindungan; hitungannya
mencakup semua jenis aturan (termasuk pembatasan branch), bukan khusus required reviewers.
Dry-run Wrangler memakai `wrangler.deploy.jsonc` hasil generate dan tidak mengunggah apa pun; langkah
Cloudflare yang mengubah keadaan hanya `wrangler deploy --strict`.

Urutan rilis: staging dulu, verifikasi, baru production. Migration D1 tidak pernah dijalankan oleh workflow
(lihat bagian Inquiry). **Untuk production, selesaikan seluruh prasyarat Inquiry (migration, delapan secret
Worker, Turnstile, webhook Resend) sebelum menjalankan workflow.** Deploy mengganti situs langsung dengan form
aktif sejak deploy pertama; bila konfigurasi belum lengkap, Worker menjawab 503 dan smoke test gagal setelah
deploy, padahal pengunjung sudah melihat form. Bila itu terjadi, lengkapi konfigurasi atau lakukan rollback.

Yang dibuat atau diubah deploy di Cloudflare (dari `wrangler.jsonc` env `production`): Worker
`permata-briquettes-production`, Static Assets dari `dist/` (binding `ASSETS`, hanya `/api/*` yang dijalankan
Worker lebih dulu), binding `DB` ke D1 `permata-briquettes-inquiry-production`, dan custom domain
`www.permatabriquettes.com` (`custom_domain: true`, dipasang oleh deploy). Karena itu tidak boleh ada record DNS
`www` manual. `workers.dev` dan preview URL mati. Staging serupa dengan `staging.permatabriquettes.com`.

Verifikasi lokal sebelum rilis:

```powershell
npm ci; npm run check; npm test; npm run assets:check
npm run build:staging;    npm run audit:staging;    npm run worker:check:staging
npm run build:production; npm run audit:production; npm run worker:check:production
```

### Rollback

1. Ambil versi terakhir yang baik: `npx wrangler deployments list --config wrangler.deploy.jsonc --env <target>`
   (buat config dulu dengan `npm run prepare:deploy-config -- <target>`).
2. `npx wrangler rollback <VERSION_ID> --config wrangler.deploy.jsonc --env <target> --message "<alasan>"`.
3. Jalankan ulang `npm run smoke:deployment -- --environment <target> --base-url <url>`.

Belum terverifikasi: tidak ada prosedur di repo untuk melepas custom domain `www` yang sudah terpasang (dampak ke
DNS dan pengalihan apex), dan production belum punya versi sebelum deploy pertama, jadi rollback ke "sebelum
deploy pertama" tidak bisa dijalankan; untuk kasus itu hentikan inquiry (`INQUIRY_ENABLED=false` pada config
generate, deploy ulang) dan perbaiki maju.

Rollback kode tidak me-rollback schema atau data D1. Utamakan perbaikan maju yang aditif. Restore D1
(`wrangler d1 time-travel restore` ke bookmark pra-migrasi) bersifat destruktif: hentikan inquiry dulu
(`INQUIRY_ENABLED=false`), dan lakukan hanya dengan persetujuan pemilik data.

## Konfigurasi yang dibutuhkan

**GitHub Environment `staging` dan `production`**

- Secret: `CLOUDFLARE_API_TOKEN` (scope minimum untuk Workers dan D1), `CLOUDFLARE_ACCOUNT_ID`,
  `CLOUDFLARE_D1_DATABASE_ID` (berbeda per environment).
- Variable: `PUBLIC_TURNSTILE_SITE_KEY` (site key publik Turnstile environment itu; wajib di kedua environment karena build gagal bila kosong).
- `production`: required reviewers dan pembatasan deployment ke branch `main` (pengaturan GitHub, dikonfigurasi
  pemilik; tidak dapat diverifikasi dari repo).

**Cloudflare Worker (per environment)**

- Binding: `ASSETS` (dari `assets` di `wrangler.jsonc`) dan `DB` (D1). `database_id` sengaja tidak ada di Git;
  `prepare:deploy-config` menyisipkannya ke `wrangler.deploy.jsonc` yang diabaikan git.
- Variable non-rahasia di `wrangler.jsonc`: `INQUIRY_ENABLED`, `RUNTIME_MODE`, `USE_LOCAL_MOCKS`,
  `PRIVACY_NOTICE_VERSION`, `MARKETING_CONSENT_VERSION`, dan empat template konfirmasi buyer.
- Secret Worker (`wrangler secret put <NAMA> --config wrangler.deploy.jsonc --env <target>`):
  `TURNSTILE_SECRET`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `RATE_LIMIT_HASH_KEY`,
  `SUPPRESSION_HASH_KEY`, `RESEND_NOTIFICATION_TO`, `RESEND_FROM_ADDRESS`, `RESEND_REPLY_TO`.
  Ketiga alamat Resend harus identik; bila berbeda Worker menolak aktivasi (fail closed, 503).

Template variable lokal: `.env.example` (build) dan `.dev.vars.example` (Worker lokal, salin ke `.dev.vars`).

## Inquiry

Perilaku: `POST /api/inquiries` (same-origin; origin publik hanya dua host resmi, `worker/src/domain.ts`)
dan `POST /api/webhooks/resend` (bounce/complaint, tanda tangan Svix). Selama gate aktivasi belum
lengkap kedua endpoint menjawab `503`. Form di situs hanya dirender bila build mendapat tiga variable form.

### Prasyarat production dengan inquiry aktif

Production dirilis dengan inquiry aktif sejak awal (berubah dari rencana lama "rilis awal disabled", yang
tidak berlaku lagi). Pipeline (build, config deploy, workflow, smoke, audit) mendukungnya. Prasyarat berikut
dikonfigurasi di luar repo lewat dashboard; sumbernya pemilik dan tidak dapat diverifikasi dari repo:

1. Zona Cloudflare `permatabriquettes.com` aktif. Hostname `www` dipasang oleh deploy sebagai custom domain,
   jadi jangan membuat record `www` manual. Apex dialihkan ke `www` lewat record proxied dan Redirect Rule;
   Always Use HTTPS aktif.
2. GitHub Environment `production`: required reviewers, pembatasan ke branch `main`, tiga secret Cloudflare,
   dan variable `PUBLIC_TURNSTILE_SITE_KEY`.
3. D1 production (`permata-briquettes-inquiry-production`) dibuat; bookmark time-travel dicatat; migration
   `worker/migrations` diterapkan manual dan terpisah (bagian di bawah).
4. Turnstile: widget production hanya untuk hostname `www.permatabriquettes.com`, terpisah dari widget staging.
5. Resend: domain terverifikasi; webhook per environment dengan signing secret masing-masing (event
   `email.bounced` dan `email.complained`) ke `https://www.permatabriquettes.com/api/webhooks/resend`
   (production) dan `https://staging.permatabriquettes.com/api/webhooks/resend` (staging). Akun Resend dipakai
   bersama; endpoint tiap environment menerima event dari kedua environment, dan event untuk email yang tidak
   dikenal D1-nya dijawab 204 tanpa efek.
6. Delapan secret Worker production (daftar di atas).
7. Persetujuan legal/privacy dan pemilik retensi data.

Cara kerja aktivasi: `wrangler.jsonc` selalu menyimpan `INQUIRY_ENABLED="false"` dan cron kosong.
`npm run prepare:deploy-config -- <target>` menghasilkan `wrangler.deploy.jsonc` (diabaikan git) dengan
`INQUIRY_ENABLED="true"` untuk staging dan production; cron tetap kosong dan skrip menolak sumber yang
mengubahnya.

### Migration D1

Tidak otomatis dan terpisah dari deploy. Hanya setelah review dan persetujuan; catat bookmark time-travel
(perintah `time-travel info`) lebih dulu, baru terapkan. Perintah `--remote` di bawah mengikuti pola Wrangler
dan belum diuji di repo ini:

```powershell
npx wrangler d1 migrations list DB --remote --config wrangler.deploy.jsonc --env <target>
npx wrangler d1 time-travel info DB --config wrangler.deploy.jsonc --env <target> --timestamp "<RFC3339 sebelum migration>" --json
npx wrangler d1 migrations apply DB --remote --config wrangler.deploy.jsonc --env <target>
```

Lokal: `npm run db:migrate:local` dan `npm run db:migrations:list:local`. Simpan bookmark di catatan
perubahan terlindungi, bukan di repo.

### Perawatan rutin

- **Retensi bulanan**: `worker/maintenance/monthly-maintenance.sql` (template; placeholder `__RUN_ID__` dan
  `__EXECUTOR__` sengaja belum terisi). Angka retensi dari kode (`worker/src/domain.ts`, `service.ts`) dan
  privacy notice: inquiry 12 bulan sejak aktivitas terakhir, bukti consent pemasaran 24 bulan, data keamanan,
  rate-limit, dan event webhook 30 hari, idempotency key 24 jam. Suppression tidak dihapus otomatis (tinjauan
  12 bulan). Salin template ke luar repo, isi dengan ID acak dan identitas operator tanpa PII, tinjau
  transaksinya, jalankan setelah backup terverifikasi dan dengan persetujuan tertulis. Hasil dicatat di tabel
  `maintenance_runs`. Validasi lokal: `npx wrangler d1 execute DB --local --file <salinan>.sql`.
  **Prosedur remote belum teruji:** tidak ada perintah remote yang terverifikasi, tidak ada dry-run (hitungan
  "sebelum" berada di transaksi yang sama dengan DELETE), dan dukungan `BEGIN/COMMIT` lewat
  `wrangler d1 execute --remote --file` belum terbukti, termasuk di staging. Uji di D1 staging dulu sebelum
  data production mendekati batas retensi.
- **Cron retry**: Worker punya handler `scheduled` yang mengirim ulang pengiriman email yang jatuh tempo, tetapi
  `triggers.crons` di `wrangler.jsonc` sengaja kosong dan `buildDeployConfig` menolak cron berisi. Aktifkan
  sebagai perubahan terpisah setelah alur inquiry dan delivery terverifikasi di staging.
- **Turnstile dan Resend**: rotasi secret dengan `wrangler secret put`; jangan menaruh nilainya di command
  line, commit, log, atau screenshot. `wrangler secret list` hanya untuk memastikan nama.
- **Webhook** (`POST /api/webhooks/resend`, tanda tangan Svix, toleransi waktu 5 menit): tanda tangan salah
  atau header hilang `400`; JSON rusak `400`; GET `405`; konfigurasi belum lengkap `503`; event selain
  `email.bounced`/`email.complained`, bounce lunak, email tak dikenal, dan event yang sudah diproses `204`.
  Hard bounce dan complaint pada email buyer membuat entri suppression (tinjau tahunan). Event dicatat setelah
  efeknya berhasil, sehingga kegagalan sesaat (503) diproses ulang saat retry.
- **Analytics**: Cloudflare Web Analytics mati di semua environment; mengaktifkannya adalah perubahan
  terpisah (production saja, tanpa event kustom atau PII).

## Smoke test dan pemeriksaan pascarilis

`npm run smoke:deployment -- --environment <staging|production> --base-url <url>` hanya melakukan `GET`:
meta robots beranda (staging `noindex, nofollow`; production `index, follow`), `robots.txt`, `sitemap.xml`,
halaman kontak EN/ID (form dan Turnstile harus ada di kedua environment), `GET /api/inquiries` dan
`GET /api/webhooks/resend` (harus `405`; `503` berarti secret atau binding belum lengkap). Cek manual
tambahan: `robots.txt` dan `sitemap.xml` (staging: `Disallow: /`, tanpa sitemap; production: sitemap
dengan host `www.permatabriquettes.com`), canonical/hreflang, dan CTA email/WhatsApp.

### Uji manual pascarilis production

Setelah smoke otomatis lulus:

1. `https://www.permatabriquettes.com` terbuka; `http://www…` dialihkan ke https; apex `permatabriquettes.com`
   dialihkan ke `www`.
2. Form tampil di `/en/contact/` dan `/id/kontak/` dan widget Turnstile termuat.
3. Kirim satu inquiry uji: tersimpan, notifikasi sampai ke kotak penerima, dan email tidak ditolak DMARC (cek
   header autentikasi).
4. Webhook Resend production (`POST /api/webhooks/resend`): dari dashboard Resend kirim event uji. Event
   bertanda tangan valid untuk email tak dikenal dibalas `204`; tanda tangan salah atau header hilang `400`
   `invalid_webhook_signature`; `GET` `405`; konfigurasi tidak lengkap `503`. Webhook production memakai signing
   secret sendiri, terpisah dari staging (event `email.bounced` dan `email.complained`).
5. Privacy notice final tampil di `/en/privacy/` dan `/id/privasi/`.
