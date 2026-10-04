# Runbook Cloudflare deployment

## Ruang lingkup dan invariant

Runbook ini mencakup Cloudflare Workers + Static Assets, D1, Turnstile, Resend,
DNS, dan GitHub Actions. Tidak ada perintah mutasi eksternal di bawah yang boleh
dijalankan tanpa pemilik rilis, target environment, change window, akses, dan
keputusan rilis eksplisit yang tercatat.

Invariant rilis awal:

- `INQUIRY_ENABLED=false` pada Worker;
- `PUBLIC_INQUIRY_FORM_ENABLED=false` dan `PUBLIC_INQUIRY_FORM_MODE=off` pada
  build statis;
- `triggers.crons=[]`;
- Cloudflare Web Analytics tidak dirender;
- tidak ada secret atau ID riil di Git;
- migration D1 tidak menjadi bagian dari perintah deploy Worker;
- staging wajib lulus sebelum production dapat dipertimbangkan.

## Model konfigurasi

`wrangler.jsonc` adalah sumber konfigurasi yang dapat di-commit. Environment
`staging` dan `production` mendeklarasikan Worker, custom domain, binding
`ASSETS`, binding `DB`, variable non-rahasia, dan cron kosong. `database_id`
sengaja tidak ada, sehingga file tersebut aman di repository dan tidak dapat
menjadi konfigurasi deploy final.

Sebelum dry-run final atau deploy, jalankan:

```powershell
$env:CLOUDFLARE_D1_DATABASE_ID = "<ID D1 target dari secret store>"
npm run prepare:deploy-config -- staging
```

Script menghasilkan `wrangler.deploy.jsonc`, memasukkan hanya ID D1 target,
memastikan inquiry/cron tetap mati, dan menghapus environment lain dari hasil.
File ini diabaikan Git. Ganti `staging` dengan `production` untuk target
production. `CLOUDFLARE_ACCOUNT_ID` dan `CLOUDFLARE_API_TOKEN` tetap diberikan
sebagai environment variable dan tidak pernah ditulis ke file.

| Target | Worker | Custom domain | D1 name | Indexing build | Inquiry / cron / analytics |
| --- | --- | --- | --- | --- | --- |
| local | `permata-briquettes-inquiry` | tidak ada | `permata-briquettes-inquiry-local` | noindex | mati / kosong / mati |
| staging | `permata-briquettes-staging` | `staging.permatabriquettes.com` | `permata-briquettes-staging` | noindex | mati / kosong / mati |
| production | `permata-briquettes-production` | `www.permatabriquettes.com` | `permata-briquettes-inquiry-production` | index | mati / kosong / mati pada rilis awal |

`ASSETS` berasal dari `assets.binding`; `DB` berasal dari `d1_databases`. Static
Assets menangani semua path selain `/api/*`; API selalu melewati Worker.

## Inventory konfigurasi

### GitHub Environment secrets untuk deploy

Nama berikut diperlukan per GitHub Environment (`staging` dan `production`),
tanpa menyalin nilainya ke repository atau log:

- `CLOUDFLARE_API_TOKEN` — token minimum-scope untuk Workers script/route dan
  pembacaan D1 target;
- `CLOUDFLARE_ACCOUNT_ID` — akun yang memiliki zone dan resource target;
- `CLOUDFLARE_D1_DATABASE_ID` — ID database khusus environment.

Environment `production` harus memakai required reviewers. Branch protection,
approval deployment, dan secret isolation harus diverifikasi di GitHub sebelum
workflow dipakai.

### Worker variables non-rahasia

Nilai berikut ada per environment di `wrangler.jsonc`: `INQUIRY_ENABLED`,
`RUNTIME_MODE`, `USE_LOCAL_MOCKS`, `PRIVACY_NOTICE_VERSION`,
`MARKETING_CONSENT_VERSION`, serta empat template konfirmasi buyer. Rilis awal
selalu memakai `INQUIRY_ENABLED=false` dan `USE_LOCAL_MOCKS=false` untuk
environment publik.

### Worker secrets untuk aktivasi inquiry yang terpisah

Jangan provision atau gunakan nilai ini untuk rilis awal. Setelah approval
aktivasi, masukkan secara interaktif dengan `wrangler secret put <NAME>
--config wrangler.deploy.jsonc --env <target>`:

- `TURNSTILE_SECRET`;
- `RESEND_API_KEY`;
- `RESEND_WEBHOOK_SECRET`;
- `RATE_LIMIT_HASH_KEY`;
- `SUPPRESSION_HASH_KEY`;
- `RESEND_NOTIFICATION_TO`;
- `RESEND_FROM_ADDRESS`;
- `RESEND_REPLY_TO`.

Tiga alamat Resend diperlakukan sebagai protected configuration. Kode menolak
aktivasi bila ketiganya berbeda. Jangan menyertakan nilainya pada command line,
commit, artifact, screenshot, atau laporan.

### Public build variables

- `SITE_ENV`: `staging` atau `production`;
- `PUBLIC_INQUIRY_FORM_ENABLED`: default `false`;
- `PUBLIC_INQUIRY_FORM_MODE`: default `off`;
- `PUBLIC_TURNSTILE_SITE_KEY`: kosong sampai aktivasi inquiry disetujui;
- `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED`: default `false`;
- `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN`: kosong sampai token dan approval
  analytics tersedia.

`npm run build:staging` dan `npm run build:production` sengaja menimpa flags
dengan nilai aman serta menghapus site key/token dari environment build.

`PUBLIC_BLOG_PREVIEW_DRAFTS` hanya untuk `npm run dev` lokal (meninjau artikel
`draft: true`). Build apa pun mengabaikannya dan kedua skrip build di atas
menghapusnya; jangan menyetelnya di Cloudflare. Artikel baru terbit dengan
`draft: false` pada file `en/` dan `id/` (lihat `src/content/blog/README.md`).

## Urutan provisioning

1. Verifikasi `git --version`, clean/known worktree, remote, current branch,
   protected `main`, commit SHA, dan akses repository GitHub.
2. Catat keputusan rilis, target, release owner, rollback owner, dan window.
3. Verifikasi akun Cloudflare yang benar, least-privilege token, zone, dan paket
   Workers/Static Assets yang diperlukan. Jangan menaruh account ID di Git.
4. Verifikasi resource D1 target sudah dibuat melalui change terpisah. Nama dan
   ID harus cocok dengan environment; staging dan production tidak boleh
   berbagi database.
5. Verifikasi record DNS/custom domain dan HTTPS target. Pembuatan atau
   perubahan DNS adalah change terpisah yang memerlukan approval.
6. Buat GitHub Environments, required reviewers production, deployment branch
   policy, dan tiga secret deployment per environment.
7. Untuk rilis awal disabled, berhenti di sini; Turnstile, Resend, webhook,
   migration, dan cron tidak perlu diaktifkan.
8. Untuk aktivasi inquiry terpisah, verifikasi legal/privacy approval, hostname
   Turnstile, Resend verified domain/sender, webhook signing secret, recipient,
   migration/backup, rate-limit capacity, dan retention owner sebelum secret
   dimasukkan.

## Verifikasi release candidate lokal

Mulai dari commit yang akan dirilis dan workspace bersih:

```powershell
npm ci
npm run check
npm run build:staging
npm run audit:staging
npm test
npm run worker:check
npm run worker:check:staging
```

Untuk production candidate, ulangi dengan `build:production`,
`audit:production`, dan `worker:check:production`. Simpan commit SHA, versi Node,
versi npm, versi Wrangler, hasil command, dan checksum artifact sebagai bukti.
Jangan memakai artifact staging untuk production karena directive indexing
berbeda.

## Deployment staging disabled

Prerequisite: seluruh checklist staging terpenuhi dan keputusan
`DEPLOY_STAGING_DISABLED_WITH_CUSTOM_DOMAIN` diberikan eksplisit oleh release
owner. Frasa tersebut juga mengotorisasi pemasangan custom-domain route yang
dapat membuat atau mengubah record DNS Cloudflare; tanpa otorisasi gabungan ini,
jangan jalankan deploy.

```powershell
$env:CLOUDFLARE_ACCOUNT_ID = "<protected>"
$env:CLOUDFLARE_API_TOKEN = "<protected>"
$env:CLOUDFLARE_D1_DATABASE_ID = "<protected>"
npm run prepare:deploy-config -- staging
npx wrangler deploy --config wrangler.deploy.jsonc --env staging --dry-run --outdir .wrangler/release-dry-run
npx wrangler deployments list --config wrangler.deploy.jsonc --env staging
npx wrangler deploy --config wrangler.deploy.jsonc --env staging --strict
npm run smoke:deployment -- --environment staging --base-url https://staging.permatabriquettes.com
```

Smoke script hanya melakukan `GET`. Probe `GET /api/inquiries` mengharapkan
`503 inquiry_unavailable`, sehingga status fail closed dibuktikan tanpa
mengirim payload inquiry atau email. Jangan menyatakan staging terverifikasi
bila satu pemeriksaan gagal.

Workflow `.github/workflows/cloudflare-deploy.yml` menjalankan urutan yang sama
melalui `workflow_dispatch`. Konfirmasi harus persis sesuai target. Production
juga memerlukan input staging verified dan approval GitHub Environment. Manual
dispatch bukan pengganti keputusan rilis bisnis yang tercatat.

## Migration D1 terpisah

Migration tidak pernah otomatis dijalankan oleh workflow deploy. Hanya setelah
schema review, backup/bookmark, maintenance window, dan approval migration:

```powershell
npx wrangler d1 migrations list DB --remote --config wrangler.deploy.jsonc --env staging
npx wrangler d1 time-travel info DB --config wrangler.deploy.jsonc --env staging --timestamp "<RFC3339 sebelum migration>" --json
npx wrangler d1 migrations apply DB --remote --config wrangler.deploy.jsonc --env staging
npx wrangler d1 migrations list DB --remote --config wrangler.deploy.jsonc --env staging
```

Simpan bookmark dan hasil migration pada change record yang dilindungi, bukan di
repository bila mengandung identifier. Ulangi di production hanya setelah
staging migration dan aplikasi tervalidasi serta ada approval production baru.

## Rollback

### Worker dan Static Assets

1. Hentikan rollout dan catat gejala/waktu.
2. Ambil version/deployment terakhir yang diketahui baik:
   `npx wrangler deployments list --config wrangler.deploy.jsonc --env <target>`.
3. Dengan incident approval, jalankan
   `npx wrangler rollback <VERSION_ID> --config wrangler.deploy.jsonc --env <target> --message "<incident reference>"`.
4. Ulangi smoke test read-only dan verifikasi route, assets, robots, CTA, serta
   endpoint fail closed.
5. Jangan mengubah DNS sebagai rollback pertama kecuali runbook insiden DNS yang
   disetujui memang memerlukannya.

### D1

Code rollback tidak me-rollback schema/data. Utamakan forward-fix additive.
Jika restore diperlukan, hentikan inquiry (`INQUIRY_ENABLED=false`) terlebih
dahulu, dapatkan incident/data-owner approval, lalu gunakan bookmark pra-migrasi
dengan `wrangler d1 time-travel restore`. Restore adalah tindakan destruktif dan
tidak boleh diotomasi atau dijalankan hanya karena code rollback.

## Aktivasi inquiry terpisah

Aktivasi bukan bagian rilis awal dan harus berupa change/commit baru yang
direview:

1. Staging disabled telah terverifikasi.
2. Dokumen privacy/legal final telah ditinjau dan tidak membocorkan data
   sensitif.
3. D1 backup/bookmark serta migration staging berhasil.
4. Turnstile staging hostname dan secret sudah diuji.
5. Resend verified domain, sender, recipient, API key, dan webhook signature
   telah diuji tanpa alamat pelanggan nyata.
6. Semua Worker secret tersedia; `wrangler secret list` hanya digunakan untuk
   memastikan nama, bukan membocorkan nilai.
7. Build form menggunakan `PUBLIC_INQUIRY_FORM_ENABLED=true`, mode `live`, dan
   public site key hanya pada pipeline aktivasi yang disetujui.
8. Ubah `INQUIRY_ENABLED` menjadi `true` hanya pada target yang disetujui dan
   setelah fail-closed/incomplete-config tests lulus.
9. Aktifkan cron retry pada change berikutnya setelah alur inquiry dan delivery
   staging terverifikasi; jangan menggabungkannya dengan aktivasi pertama.
10. Production memerlukan staging evidence dan keputusan production baru.

Cloudflare Web Analytics juga change terpisah: hanya production, hanya setelah
token dan approval tersedia, dan tetap tanpa custom event/PII.

## Checklist launch

### Git, build, dan approval

- [ ] Git executable tersedia; status, remote, branch, dan commit SHA tercatat.
- [ ] Remote GitHub dan hak akses benar; branch protection/environment approval
  sudah diverifikasi.
- [ ] Release decision target-specific tercatat.
- [ ] `npm ci`, check, build target, audit target, tests, dan Worker dry-run lulus.
- [ ] Artifact berasal dari lockfile dan commit yang sama; checksum disimpan.

### DNS, HTTPS, route, dan assets

- [ ] Host target resolve ke konfigurasi yang disetujui.
- [ ] Sertifikat HTTPS valid dan redirect tidak keluar dari host target.
- [ ] Custom domain menunjuk Worker target yang benar.
- [ ] Root, halaman EN/ID, CSS/font Static Assets, `robots.txt`, dan
  `sitemap.xml` merespons sukses.
- [ ] `/api/*` melewati Worker; path lain dilayani Static Assets.

### Indexing dan canonical

- [ ] Staging: meta `noindex, nofollow`, `robots.txt` berisi `Disallow: /`, dan
  tidak mengiklankan sitemap.
- [ ] Production: meta index sesuai konten, robots mengizinkan, dan sitemap
  production diiklankan.
- [ ] Canonical/hreflang selalu memakai `https://www.permatabriquettes.com`;
  sitemap tidak memuat staging, localhost, atau `/api/`.

### CTA dan fail closed

- [ ] CTA email dan WhatsApp EN/ID memiliki href serta accessible name benar.
- [ ] Rilis awal tidak merender `<form>`, Turnstile, atau script submit inquiry.
- [ ] `GET /api/inquiries` mengembalikan `503 inquiry_unavailable`.
- [ ] Tidak ada request POST, PII, email, atau webhook nyata dalam smoke test.

### D1 dan secrets

- [ ] D1 staging/production terpisah; nama dan ID cocok dengan target.
- [ ] `DB` dan `ASSETS` tampil pada dry-run final.
- [ ] Tidak ada ID/token/secret dalam Git, artifact, output audit, atau laporan.
- [ ] Migration ditinjau, diuji lokal, dan dijalankan terpisah setelah
  bookmark/backup serta approval.
- [ ] Restore owner dan bookmark pra-migrasi tersedia sebelum migration remote.

### Turnstile, Resend, webhook, cron, dan analytics

- [ ] Rilis awal: Turnstile nonaktif, Resend tidak dipanggil, webhook 503, dan
  cron kosong.
- [ ] Aktivasi inquiry memiliki approval legal/security/operasional terpisah.
- [ ] Hostname Turnstile, Resend domain/sender, recipient, webhook signature,
  retry policy, dan suppression flow lulus staging sebelum production.
- [ ] Cron retry tetap kosong sampai aktivasi inquiry disetujui dan delivery
  staging terbukti.
- [ ] Cloudflare Web Analytics tidak ada sampai token dan approval production
  tersedia; tidak ada custom event atau PII.

### Bukti pascarilis

- [ ] Version/deployment ID disimpan di change record, bukan hard-coded.
- [ ] Smoke test target lulus dan timestamp/operator tercatat.
- [ ] Tidak ada unexpected Worker/D1/DNS/secret changes.
- [ ] Keputusan lanjut, rollback, atau no-go tercatat.
