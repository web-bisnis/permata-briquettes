# Operasi

Satu-satunya dokumen operasi. Tanpa nilai secret atau ID akun; semuanya disimpan di GitHub
Environment atau Cloudflare. Bagian bertanda **[BERUBAH]** mengikuti rencana baru: production
dirilis dengan form inquiry aktif sejak rilis awal.

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
| `npm run build:staging` | `noindex`; form inquiry hanya bila tiga variable di bawah semuanya diisi. |
| `npm run build:production` | Dapat diindeks; Web Analytics selalu mati. |

Keduanya memaksa `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED=false`, menghapus token analytics dan
`PUBLIC_BLOG_PREVIEW_DRAFTS`, lalu menjalankan `astro build`. Jangan memakai artifact staging untuk
production (direktif indexing berbeda). Variable build form: `PUBLIC_INQUIRY_FORM_ENABLED=true`,
`PUBLIC_INQUIRY_FORM_MODE=live`, `PUBLIC_TURNSTILE_SITE_KEY` (nilai publik). Ketiganya diatur di
`scripts/inquiry-activation.mjs`.

## Deploy

Hanya lewat workflow manual `.github/workflows/cloudflare-deploy.yml` (Actions > Cloudflare manual
deployment > Run workflow). Tidak ada deploy otomatis dari push.

Input: `target` (`staging` atau `production`), `release_confirmation` (frasa persis sesuai target, ditolak bila
berbeda), `staging_verified` (wajib `true` untuk production). Langkah workflow: validasi konfirmasi, cek secret
ada, cek production Environment punya minimal satu protection rule, `npm ci`, `npm run check`,
`npm run build:<target>`, `npm run audit:<target>`, `npm test`, `npm run prepare:deploy-config`,
dry-run Wrangler, `wrangler deploy --strict`, lalu `npm run smoke:deployment` (GET saja, tanpa payload).

Urutan rilis: staging dulu, verifikasi, baru production. Migration D1 tidak pernah dijalankan oleh workflow
(lihat bagian Inquiry).

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

Rollback kode tidak me-rollback schema atau data D1. Utamakan perbaikan maju yang aditif. Restore D1
(`wrangler d1 time-travel restore` ke bookmark pra-migrasi) bersifat destruktif: hentikan inquiry dulu
(`INQUIRY_ENABLED=false`), dan lakukan hanya dengan persetujuan pemilik data.

## Konfigurasi yang dibutuhkan

**GitHub Environment `staging` dan `production`**

- Secret: `CLOUDFLARE_API_TOKEN` (scope minimum untuk Workers dan D1), `CLOUDFLARE_ACCOUNT_ID`,
  `CLOUDFLARE_D1_DATABASE_ID` (berbeda per environment).
- Variable: `PUBLIC_TURNSTILE_SITE_KEY` (site key publik Turnstile environment itu).
- `production`: required reviewers.

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

### **[BERUBAH]** Prasyarat production dengan inquiry aktif

Dokumen lama menyebut rilis awal "disabled". Rencana sekarang: production aktif sejak awal. Prasyarat
konfigurasi (belum dikerjakan, bukan bagian pembersihan repo):

1. GitHub Environment `production` dengan required reviewers; tiga secret Cloudflare dan variable
   `PUBLIC_TURNSTILE_SITE_KEY` production.
2. D1 production (nama `permata-briquettes-inquiry-production`) dibuat; bookmark/backup dicatat; migration
   `worker/migrations` diterapkan secara terpisah.
3. Turnstile: widget untuk `www.permatabriquettes.com`; secret dan site key.
4. Resend: domain/sender terverifikasi, webhook ke `https://www.permatabriquettes.com/api/webhooks/resend`,
   delapan secret Worker.
5. Domain `www.permatabriquettes.com` dan DNS.
6. Persetujuan legal/privacy dan pemilik retensi data.

**Perubahan kode/workflow yang masih diperlukan.** Pipeline saat ini sengaja menahan production tetap
nonaktif, sehingga rilis aktif belum bisa dijalankan sebelum item berikut diubah lewat PR terpisah:

- `scripts/inquiry-activation.mjs`: `ACTIVATABLE_ENVIRONMENTS` hanya `staging`; build production gagal bila variable
  form diisi, dan `buildDeployConfig` menolak `INQUIRY_ENABLED=true` untuk production.
- `.github/workflows/cloudflare-deploy.yml`: frasa konfirmasi production masih
  `DEPLOY_PRODUCTION_DISABLED_WITH_CUSTOM_DOMAIN`, dan variable form hanya diteruskan untuk `staging`.
- `scripts/smoke-deployment.mjs` / `smoke-checks.mjs`: production masih mengharapkan form absen dan
  `503 inquiry_unavailable`.
- Tes yang mengunci perilaku itu (`tests/inquiry-activation.test.mjs`, `tests/smoke-checks.test.mjs`,
  `tests/inquiry-build.test.mjs`).

### Migration D1

Tidak otomatis. Hanya setelah review, backup/bookmark, dan persetujuan:

```powershell
npx wrangler d1 migrations list DB --remote --config wrangler.deploy.jsonc --env <target>
npx wrangler d1 time-travel info DB --config wrangler.deploy.jsonc --env <target> --timestamp "<RFC3339 sebelum migration>" --json
npx wrangler d1 migrations apply DB --remote --config wrangler.deploy.jsonc --env <target>
```

Lokal: `npm run db:migrate:local` dan `npm run db:migrations:list:local`. Simpan bookmark di catatan
perubahan terlindungi, bukan di repo.

### Perawatan rutin

- **Retensi bulanan**: `worker/maintenance/monthly-maintenance.sql` (template; placeholder `__RUN_ID__` dan
  `__EXECUTOR__` sengaja belum terisi). Salin ke luar repo, isi dengan ID acak dan identitas operator tanpa
  PII, tinjau transaksinya, jalankan setelah backup terverifikasi dan dengan persetujuan tertulis. Ia menghapus
  idempotency key, consent, rate-limit, event webhook, dan inquiry yang kedaluwarsa; data suppression tidak
  pernah dihapus otomatis (hanya dihitung bila jatuh tempo tinjauan tahunan). Catatan operasional ada di tabel
  `maintenance_runs`. Validasi lokal: `npx wrangler d1 execute DB --local --file <salinan>.sql`.
- **Cron retry**: Worker punya handler `scheduled` yang mengirim ulang pengiriman email yang jatuh tempo, tetapi
  `triggers.crons` di `wrangler.jsonc` sengaja kosong dan `buildDeployConfig` menolak cron berisi. Aktifkan
  sebagai perubahan terpisah setelah alur inquiry dan delivery terverifikasi di staging.
- **Turnstile dan Resend**: rotasi secret dengan `wrangler secret put`; jangan menaruh nilainya di command
  line, commit, log, atau screenshot. `wrangler secret list` hanya untuk memastikan nama.
- **Webhook**: event hard bounce dan complaint membuat entri suppression; tinjau tahunan.
- **Analytics**: Cloudflare Web Analytics mati di semua environment; mengaktifkannya adalah perubahan
  terpisah (production saja, tanpa event kustom atau PII).

## Smoke test dan pemeriksaan pascarilis

`npm run smoke:deployment -- --environment <staging|production> --base-url <url>` hanya melakukan `GET`:
halaman kontak EN/ID, form dan Turnstile (bila diharapkan ada), `GET /api/inquiries` dan
`GET /api/webhooks/resend` (harus `405`; `503` berarti secret atau binding belum lengkap). Cek manual
tambahan: `robots.txt` dan `sitemap.xml` (staging: `Disallow: /`, tanpa sitemap; production: sitemap
dengan host `www.permatabriquettes.com`), canonical/hreflang, dan CTA email/WhatsApp.
