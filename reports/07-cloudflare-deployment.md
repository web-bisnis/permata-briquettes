# Tahap 7 — Cloudflare deployment readiness

Tanggal audit: 1 Oktober 2026 (Asia/Jakarta)

## Ringkasan dan status

Status tegas: **TERHAMBAT**.

Konfigurasi environment, safe build, Worker dry-run, generator konfigurasi
deploy tanpa ID di Git, workflow manual, smoke test read-only, runbook
deployment/migration/rollback, dan checklist launch telah disiapkan. Seluruh
verifikasi lokal wajib lulus. Staging dan production build masing-masing lulus
audit 19 halaman, 32 file, tanpa inquiry form dan tanpa Cloudflare Web
Analytics. Dry-run Worker local/staging/production juga lulus dengan
`INQUIRY_ENABLED=false` dan cron kosong.

Staging belum dapat disebut **siap staging** atau **staging terverifikasi**
karena:

- executable Git tidak tersedia, sehingga status worktree, remote, branch, dan
  commit lokal tidak dapat diverifikasi dengan perintah yang diwajibkan;
- `staging.permatabriquettes.com` masih NXDOMAIN dan HTTPS tidak tersedia;
- GitHub Environments belum tersedia dan branch `main` belum protected;
- workflow Tahap 7 belum ada pada repository remote sehingga tidak dapat
  didispatch dari GitHub;
- ID D1 staging serta Cloudflare credential untuk CI belum tersedia sebagai
  protected environment configuration;
- belum ada deployment staging, sehingga smoke test HTTPS tidak dijalankan.

Permintaan penyelesaian readiness pada 1 Oktober 2026 diperlakukan sebagai
keputusan rilis staging eksplisit yang mencakup custom-domain route. Otorisasi
tersebut tidak menghapus gate teknis di atas; workflow tidak didispatch dan
custom domain/DNS tidak diubah karena prasyarat belum lengkap.

Production juga belum dapat disebut **siap production** atau **production
terverifikasi**: staging belum lulus, `www.permatabriquettes.com` NXDOMAIN,
resource D1 production tidak ditemukan, GitHub Environment production tidak
ada, dan tidak ada keputusan production eksplisit.

Tidak ada deployment, migration D1 remote, provisioning resource, perubahan
DNS, pengiriman email, request Turnstile/Resend, aktivasi inquiry, aktivasi cron,
atau aktivasi analytics yang dilakukan.

## Attempt penyelesaian readiness staging

| Bukti yang diminta | Hasil 1 Oktober 2026 | Status |
| --- | --- | --- |
| Keputusan rilis staging + custom domain | Permintaan pengguna pada tahap ini eksplisit meminta deployment staging dan custom-domain route. | **Tersedia** |
| Git executable | `git` tidak ditemukan pada `PATH` maupun lokasi instalasi umum yang dapat diperiksa. Empat command Git wajib gagal sebelum menghasilkan status. | **Terhambat** |
| Commit SHA | Metadata ref lokal dan GitHub remote `main` sama-sama menunjuk `8ee78aaff366aecd76c50c71fb92b3f5a8e5b15b`; namun SHA ini tidak merepresentasikan perubahan Tahap 7 yang belum dapat diverifikasi/di-commit melalui Git CLI. | **Bukan release SHA** |
| GitHub branch protection | API mengembalikan `Branch not protected` untuk `main`. | **Terhambat** |
| GitHub Environment/secrets | Daftar Environments kosong; secret lookup `staging` mengembalikan 404; daftar repository secret kosong. | **Terhambat** |
| Workflow remote | `gh workflow list` tidak menemukan workflow; file workflow hanya tersedia pada working tree lokal yang statusnya tidak dapat diverifikasi. | **Terhambat** |
| D1 staging | Resource bernama `permata-briquettes-staging` ditemukan; tidak ada migration remote yang dijalankan. | Tersedia parsial |
| DNS/HTTPS | `staging.permatabriquettes.com` NXDOMAIN; HTTPS HEAD gagal resolve. | **Terhambat** |
| Release candidate lokal | Clean install, check, safe staging build, audit, 40 tests, dan staging Worker dry-run seluruhnya lulus ulang. | **Lulus lokal** |
| Workflow dispatch/deployment ID | Tidak didispatch; tidak ada deployment ID. | **Tidak dilakukan** |
| URL staging | Target `https://staging.permatabriquettes.com`, tetapi belum resolve/aktif. | **Tidak tersedia** |
| Smoke test | Tidak dijalankan karena tidak ada deployment/HTTPS. | **Tidak dijalankan** |
| Rollback target | Tidak ada deployment baru dan tidak ada version ID yang dapat dijadikan rollback target. | **Tidak berlaku** |

Keputusan go/no-go untuk attempt ini: **NO-GO** sebelum Git CLI, protected
branch/Environment/secrets, workflow remote, DNS, dan HTTPS tersedia. Tidak ada
fallback deploy langsung dengan credential developer karena itu akan melewati
kontrol GitHub yang diwajibkan.

## File yang dibuat atau diubah

| File | Status | Tujuan |
| --- | --- | --- |
| `wrangler.jsonc` | Diubah | Environment local/staging/production, route, binding, variable fail-closed, cron kosong, tanpa ID riil. |
| `package.json` | Diubah | Safe build, audit target, dry-run target, generator deploy config, dan smoke command. |
| `.gitignore` | Diubah | Mengabaikan `wrangler.deploy.jsonc` yang dapat memuat ID D1. |
| `.github/workflows/cloudflare-deploy.yml` | Baru | Workflow manual target-specific dengan exact confirmation, production protection check, safe build, dry-run, deploy, dan smoke. |
| `scripts/build-environment.mjs` | Baru | Memaksa inquiry dan analytics mati pada release candidate awal. |
| `scripts/prepare-wrangler-config.mjs` | Baru | Menghasilkan config deploy ignored dari ID D1 yang diberikan di luar Git. |
| `scripts/smoke-deployment.mjs` | Baru | Smoke HTTPS GET-only untuk assets, SEO, CTA, dan fail-closed inquiry. |
| `worker/src/app.ts` | Diubah | Gate aktivasi diperiksa sebelum method agar GET read-only dapat membuktikan 503 fail closed. |
| `worker/tests/app.test.ts` | Diubah | Menguji GET dan POST sama-sama 503 ketika inquiry disabled. |
| `docs/cloudflare-deployment.md` | Baru | Runbook provisioning, deployment, migration, rollback, aktivasi inquiry, dan checklist. |
| `reports/audits/07-staging.json` | Baru | Bukti audit build staging machine-readable. |
| `reports/audits/07-production.json` | Baru | Bukti audit build production machine-readable. |
| `README.md` | Diubah | Command dan referensi runbook Tahap 7. |
| `reports/07-cloudflare-deployment.md` | Baru | Laporan ini. |

Daftar ini disusun dari perubahan Tahap 7. `git status` tidak tersedia untuk
mengonfirmasi diff/worktree secara independen.

## Matriks readiness

| Area | Bukti | Status | Blocker/tindakan berikutnya |
| --- | --- | --- | --- |
| Git executable | `git --version`, `git status --short`, `git remote -v`, dan branch check seluruhnya gagal: command tidak dikenal. | **Terhambat** | Instal/ekspos Git lalu ulangi keempat command dari root repository. |
| Metadata Git lokal | `.git/HEAD` terbaca menunjuk `refs/heads/main`; `.git/config` memuat origin GitHub yang diharapkan. | Parsial | Ini bukan pengganti Git CLI; clean worktree dan commit lokal belum terbukti. |
| GitHub repository | GitHub API: repository publik `web-bisnis/permata-briquettes`, default branch `main`, viewer permission `ADMIN`; branch `main` tersedia. | Parsial | Local remote belum dapat dibandingkan via Git; repository publik perlu dikonfirmasi sesuai kebijakan. |
| GitHub controls | API menyatakan `main` tidak protected; daftar GitHub Environments kosong. | **Terhambat** | Buat branch protection, `staging`/`production` Environments, deployment policy, dan required reviewer production. |
| Workflow remote | `gh workflow list` kosong; workflow lokal belum berada pada remote `main`. | **Terhambat** | Commit/review/push workflow melalui Git yang terverifikasi sebelum dispatch. |
| GitHub secrets | Audit repository/environment secret sempat timeout; environment target sendiri belum ada. | **Terhambat** | Setelah Environment dibuat, verifikasi hanya nama tiga secret deployment, bukan nilainya. |
| Cloudflare access | `wrangler whoami` berhasil terhadap satu akun dan token login memiliki Workers, route, D1, zone read, serta Turnstile write scope. | Tersedia secara lokal | Jangan memakai token OAuth luas ini untuk CI; buat token least-privilege per kebijakan dan jangan simpan account ID/token di Git. |
| Worker/Static Assets | Config dan dry-run local/staging/production lulus; `ASSETS`, `DB`, flags, dan 51 files terbaca. | Siap secara lokal | Belum ada bukti remote Worker, route, plan/quota, atau deployed version. |
| D1 staging | Read-only `wrangler d1 list` menemukan resource `permata-briquettes-staging`; config diselaraskan ke nama itu. | Parsial | ID tidak ditulis ke Git dan belum tersedia pada CI; binding remote/migration/backup belum diverifikasi. |
| D1 production | Tidak ada resource production pada daftar D1. | **Terhambat** | Provision hanya melalui change berapproval; staging dan production harus terpisah. |
| Turnstile | Tidak ada site key/secret di environment; widget/hostname belum diverifikasi. | Nonaktif | Bukan syarat rilis awal disabled; wajib sebelum aktivasi inquiry terpisah. |
| Resend | Tidak ada API key/webhook secret di environment; domain/sender/recipient belum diverifikasi. | Nonaktif | Bukan syarat rilis awal disabled; wajib sebelum aktivasi inquiry terpisah. |
| DNS staging | `Resolve-DnsName staging.permatabriquettes.com` menghasilkan NXDOMAIN; HTTPS HEAD gagal resolve. | **Terhambat** | Keputusan dan change custom domain/DNS diperlukan sebelum staging deploy/smoke. |
| DNS production | `Resolve-DnsName www.permatabriquettes.com` menghasilkan NXDOMAIN; HTTPS HEAD gagal resolve. | **Terhambat** | Jangan ubah sebelum approval production; domain/zone ownership perlu bukti. |
| Secrets lokal/CI | Variabel Cloudflare deploy, Turnstile, dan Resend tidak tersedia di shell; GitHub Environment belum ada. | **Terhambat** | Provision melalui protected environment/secret manager, tidak melalui file repo. |
| Inquiry | Worker/config/build default disabled; GET/POST disabled test lulus; form tidak dibangun. | Aman/nonaktif | Aktivasi memerlukan change dan approval terpisah. |
| Cron retry | `crons: []` di semua environment publik. | Aman/nonaktif | Aktifkan hanya setelah inquiry dan delivery staging disetujui/terverifikasi. |
| Web Analytics | Safe build memaksa flag false dan menghapus token; audit memastikan beacon tidak ada. | Aman/nonaktif | Token + approval production menjadi change terpisah. |
| Keputusan rilis | Keputusan staging + custom-domain route tersedia dari permintaan pengguna; keputusan production tidak ada. | Staging authorized, production blocked | Otorisasi staging baru boleh dieksekusi setelah seluruh prerequisite teknis lulus; production tetap dilarang. |

## Konfigurasi environment, binding, variable, dan secret

### Binding dan target

| Environment | Worker | Domain | Binding `ASSETS` | Binding `DB` | Flags |
| --- | --- | --- | --- | --- | --- |
| local | `permata-briquettes-inquiry` | tidak ada | `./dist` | `permata-briquettes-inquiry-local` | inquiry false, local mocks true, cron kosong |
| staging | `permata-briquettes-staging` | `staging.permatabriquettes.com` | `./dist` | `permata-briquettes-staging` | inquiry false, local mocks false, cron kosong |
| production | `permata-briquettes-production` | `www.permatabriquettes.com` | `./dist` | `permata-briquettes-inquiry-production` | inquiry false, local mocks false, cron kosong |

`database_id` dan `account_id` tidak ada pada committed Wrangler config. Script
generator menerima `CLOUDFLARE_D1_DATABASE_ID`, menyuntikkannya ke
`wrangler.deploy.jsonc`, mempertahankan gate aman, dan membuang environment yang
bukan target. File hasil diabaikan Git.

### Protected deploy configuration

Per GitHub Environment:

- `CLOUDFLARE_API_TOKEN`;
- `CLOUDFLARE_ACCOUNT_ID`;
- `CLOUDFLARE_D1_DATABASE_ID`.

### Worker secrets untuk aktivasi inquiry terpisah

- `TURNSTILE_SECRET`;
- `RESEND_API_KEY`;
- `RESEND_WEBHOOK_SECRET`;
- `RATE_LIMIT_HASH_KEY`;
- `SUPPRESSION_HASH_KEY`;
- `RESEND_NOTIFICATION_TO`;
- `RESEND_FROM_ADDRESS`;
- `RESEND_REPLY_TO`.

Nilai tidak dicantumkan. Tiga alamat Resend tetap diperlakukan sebagai protected
configuration. Worker juga memerlukan binding `DB`, versi privacy/consent, dan
template konfirmasi buyer yang sudah dideklarasikan sebagai non-secret vars.

### Public build variables

| Variable | Rilis awal | Ketentuan aktivasi |
| --- | --- | --- |
| `SITE_ENV` | staging/production sesuai target | Wajib tepat agar indexing benar. |
| `PUBLIC_INQUIRY_FORM_ENABLED` | `false` | `true` hanya pada change inquiry approved. |
| `PUBLIC_INQUIRY_FORM_MODE` | `off` | `live` hanya dengan Turnstile site key. |
| `PUBLIC_TURNSTILE_SITE_KEY` | kosong | Public key target-specific setelah hostname verified. |
| `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED` | `false` | `true` hanya pada production dengan approval. |
| `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` | kosong | Token hanya pada protected build environment. |

## Urutan provisioning

1. Sediakan Git CLI dan buktikan status/remote/branch/commit; lindungi `main`.
2. Buat GitHub Environments staging/production, required reviewer production,
   branch policy, lalu isi tiga protected deploy values.
3. Catat keputusan release owner, target, change window, operator, rollback
   owner, dan exact confirmation. Konfirmasi workflow mencakup custom-domain
   route karena operasi ini dapat mengubah DNS Cloudflare.
4. Verifikasi akun/zone Cloudflare dan token least-privilege.
5. Verifikasi D1 target terpisah. D1 production harus dibuat hanya melalui
   change provisioning berapproval.
6. Verifikasi DNS/custom domain dan rencana HTTPS. Jangan mengubah DNS di luar
   change yang disetujui.
7. Jalankan clean install, check, safe build target, static audit, tests,
   generator config, dan target dry-run.
8. Deploy staging disabled; jalankan smoke GET-only. Hanya setelah lulus,
   staging boleh berstatus terverifikasi.
9. Migration D1, Turnstile, Resend, webhook, form, Worker inquiry flag, dan cron
   tetap menjadi change terpisah.
10. Production membutuhkan staging evidence dan keputusan production baru.

Detail command dan kontrol ada di `docs/cloudflare-deployment.md`.

## Runbook deployment, migration, rollback, dan aktivasi

### Deployment disabled

Local release candidate:

```powershell
npm ci
npm run check
npm run build:staging
npm run audit:staging
npm test
npm run worker:check:staging
```

Sesudah seluruh prerequisite dan keputusan rilis tersedia, generate config dari
protected D1 ID, lakukan dry-run lagi, catat deployment sebelumnya, deploy
`--strict`, lalu jalankan smoke GET-only. Workflow manual mengimplementasikan
urutan ini. Tidak ada migration pada workflow deploy.

### Migration D1

Urutan terpisah: list unapplied migrations → ambil Time Travel bookmark sebelum
perubahan → apply ke staging → list ulang → validasi aplikasi/data → approval
production baru. Tidak ada langkah remote yang dijalankan pada audit ini.

### Rollback

Rollback Worker/Static Assets memakai version terakhir yang diketahui baik dan
`wrangler rollback`, lalu mengulang smoke test. Code rollback tidak mengubah
schema/data D1. D1 restore memerlukan inquiry dimatikan, incident/data-owner
approval, serta bookmark pra-migrasi; default-nya adalah forward-fix additive.

### Aktivasi inquiry

Aktivasi harus menjadi commit/change terpisah setelah legal/privacy review,
migration/backup staging, Turnstile hostname, Resend sender/domain/recipient,
webhook signature, rate limit, dan retention owner lulus. Form publik dan Worker
gate diaktifkan bersama secara terkontrol pada staging. Cron retry baru boleh
menjadi change berikutnya setelah delivery staging terbukti. Analytics tidak
terkait inquiry dan tetap memerlukan token serta approval production terpisah.

## Checklist launch

### Git/GitHub dan release evidence

- [ ] Git CLI, status, remote, branch, dan commit SHA terverifikasi.
- [ ] `main` protected; GitHub Environments dan required reviewer production
  tersedia.
- [x] Exact release decision staging + custom domain tercatat.
- [x] `npm ci`, check, build, tests, dan local Worker dry-run lulus.
- [x] Safe staging/production build dan target dry-run lulus.
- [ ] Clean worktree serta artifact/commit checksum diverifikasi dengan Git.

### DNS, HTTPS, Worker, dan Static Assets

- [ ] Host target resolve pada DNS yang disetujui.
- [ ] HTTPS dan certificate chain valid.
- [ ] Custom domain menunjuk Worker environment yang benar.
- [ ] Root, halaman EN/ID, CSS/font assets, robots, dan sitemap sukses melalui
  HTTPS.
- [ ] `/api/*` melewati Worker; path lain dilayani Static Assets.

### Robots, sitemap, canonical, dan indexing

- [x] Artifact staging: `noindex, nofollow`, `Disallow: /`, tanpa sitemap
  advertisement.
- [x] Artifact production: indexing aktif dan robots mengiklankan sitemap
  production.
- [x] Canonical/hreflang/sitemap hanya memakai origin production; tidak memuat
  staging, localhost, atau `/api/`.
- [ ] Bukti pascadeploy staging/production tersedia.

### CTA dan inquiry fail closed

- [x] Audit build memastikan CTA email/WhatsApp tetap tersedia.
- [x] Rilis awal tidak merender form, Turnstile, atau analytics beacon.
- [x] Unit test memastikan GET/POST inquiry disabled mengembalikan 503.
- [ ] HTTPS smoke membuktikan CTA dan `GET /api/inquiries` 503 tanpa POST/data.

### D1, binding, secrets

- [x] Binding `ASSETS` dan `DB` muncul pada semua dry-run.
- [x] Tidak ada committed `account_id`/`database_id`; generated config diabaikan
  dan pengujian UUID dummy dihapus sesudah dry-run.
- [ ] D1 staging ID tersedia secara protected dan cocok dengan resource.
- [ ] D1 production terpisah tersedia.
- [ ] Bookmark/backup, migration review, remote migration, dan rollback owner
  tersedia sebelum inquiry activation.

### Turnstile, Resend, webhook, cron, analytics

- [x] Turnstile, Resend call, webhook processing, cron retry, dan analytics
  tetap nonaktif pada release candidate awal.
- [ ] Turnstile widget/hostname/site key/secret tervalidasi sebelum inquiry.
- [ ] Resend verified domain/sender/recipient/API key tervalidasi sebelum email.
- [ ] Webhook signing secret dan event flow lulus staging sebelum production.
- [ ] Cron retry hanya diaktifkan setelah delivery staging disetujui.
- [ ] Web Analytics hanya diaktifkan dengan token + approval production dan
  tanpa event PII.

## Hasil verifikasi

| Pemeriksaan | Hasil | Status |
| --- | --- | --- |
| `npm ci` | Clean install final menambahkan 315 package dari lockfile; dependency tree lengkap. Percobaan sandbox awal gagal/hang dan tidak dipakai sebagai bukti; retry final via `npm.cmd ci` lulus. | **Lulus** |
| `npm run check` | 50 file Astro: 0 error, 0 warning, 0 hint; Worker TypeScript lulus. | **Lulus** |
| `npm run build` | 19 halaman statis dibangun. Default tetap fail closed/noindex. | **Lulus** |
| `npm test` | 9 test file, 40 test lulus. | **Lulus** |
| `npm run worker:check` | Wrangler 4.145.0, 51 asset files, bundle 33,79 KiB/8,47 KiB gzip, local binding terbaca, no upload. | **Lulus** |
| Staging build/audit | 19 halaman, 19 sitemap URL, 32 output file, 420.534 byte, 0 failure/warning; inquiry/analytics absent. | **Lulus lokal** |
| Staging Worker dry-run | `ASSETS`, D1 staging, public vars terbaca; inquiry false, no upload. | **Lulus lokal** |
| Production build/audit | 19 halaman, 19 sitemap URL, 32 output file, 420.510 byte, 0 failure/warning; inquiry/analytics absent. | **Lulus lokal** |
| Production Worker dry-run | `ASSETS`, D1 production declaration, public vars terbaca; inquiry false, no upload. | **Lulus lokal** |
| Generated deploy config | UUID dummy target-only berhasil dibuat, gate inquiry/cron tervalidasi, dry-run lulus, file kemudian dihapus. | **Lulus lokal** |
| Secret/ID scan | Tidak ada field committed `account_id`/`database_id`. Dua token-like match adalah konstanta webhook **local mock** deterministik pada source/test, bukan credential eksternal. | **Lulus setelah klasifikasi** |
| Git commands | Executable tidak ada; keempat pemeriksaan wajib tidak dapat dijalankan. | **Terhambat** |
| DNS/HTTPS | Kedua hostname NXDOMAIN; HTTPS tidak dapat resolve. | **Terhambat** |
| Smoke staging | Tidak dijalankan karena belum ada DNS/HTTPS/deployment meski otorisasi staging tersedia. | **Belum dijalankan** |
| Smoke production | Tidak dijalankan; production tidak berwenang dan staging belum lulus. | **Belum dijalankan** |

Peringatan instalasi: npm 11 melaporkan tiga install script dependency belum
masuk allow-list (`esbuild` dua versi dan `workerd`). Walau demikian, Astro,
TypeScript, tests, dan Wrangler bundling berhasil. Kebijakan install-script CI
perlu diputuskan sebelum mengeraskan pipeline; jangan menambahkan approval
dependency tanpa review supply-chain.

## Bukti manual yang masih perlu diperiksa pengguna

1. Setelah Git tersedia: jalankan `git --version`, `git status --short`,
   `git remote -v`, `git branch --show-current`, dan `git branch -vv`; pastikan
   commit release dan worktree sesuai.
2. Konfirmasi repository memang boleh publik; aktifkan branch protection dan
   required checks pada `main`.
3. Buat dan lindungi GitHub Environments; periksa reviewer, branch policy, dan
   hanya nama secret yang diperlukan.
4. Konfirmasi bahwa keputusan staging + custom-domain route ini masih berlaku
   setelah seluruh blocker ditutup; jangan hanya mengandalkan tombol workflow.
5. Verifikasi ownership zone/domain, record DNS, SSL mode, certificate, dan
   Worker/custom-domain mapping di dashboard Cloudflare.
6. Cocokkan D1 staging ID secara protected; putuskan/provision D1 production
   melalui change terpisah.
7. Setelah deployment staging authorized, jalankan smoke script dan periksa
   browser desktop/mobile, CTA email/WhatsApp, canonical, robots, dan sitemap.
8. Sebelum inquiry: review final legal/privacy copy untuk data sensitif,
   Turnstile hostname, Resend domain/sender/recipient, webhook, backup/migration,
   retention, dan incident owners.

## Risiko, batasan, dan keputusan pending

- Local Cloudflare login memiliki scope luas; pipeline sebaiknya memakai API
  token least-privilege, bukan credential developer.
- Custom domain pada Wrangler deploy dapat mengelola route/DNS. Exact workflow
  confirmation sengaja menyebut custom domain, tetapi tetap memerlukan change
  record dan approval pemilik domain.
- D1 name pada config tidak membuktikan ID/ownership database remote; generator
  menuntut ID protected saat release.
- Build production yang lulus hanya release candidate lokal, bukan izin rilis
  dan bukan bukti production.
- Sitemap staging tetap berisi canonical production untuk audit, tetapi staging
  memblokir indexing dan tidak mengiklankan sitemap melalui robots.
- Smoke script belum memperoleh bukti runtime sampai hostname HTTPS benar-benar
  tersedia.
- GitHub API audit sempat mengalami TLS timeout; hasil yang berhasil menunjukkan
  repository/main, branch tanpa protection, dan tidak adanya Environments.
- Turnstile/Resend/analytics tidak dapat diaudit end-to-end tanpa resource dan
  secret yang disetujui; kondisi ini disengaja fail closed.

## Tindakan eksternal yang benar-benar dilakukan

Hanya operasi read-only atau lokal berikut dilakukan:

- autentikasi/status read-only GitHub dan Cloudflare;
- pembacaan metadata repository/branch/protection/environment GitHub;
- pembacaan SHA remote `main` dan ref metadata lokal;
- pembacaan daftar **nama** resource D1 tanpa menyimpan ID ke repository;
- DNS lookup dan HTTPS HEAD terhadap hostname target (gagal karena NXDOMAIN);
- pengunduhan dependency npm untuk `npm ci`;
- build, test, static audit, dan Wrangler `--dry-run` lokal.

Tidak ada deployment, upload Worker/assets, migration/restore D1 remote,
pembuatan atau penghapusan resource, perubahan DNS/route, penulisan secret,
pengiriman email, POST inquiry, request Turnstile/Resend, webhook, cron, atau
aktivasi Cloudflare Web Analytics. Workflow GitHub tidak didispatch karena gate
readiness gagal.
