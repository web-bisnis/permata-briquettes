# Laporan Tahap 9 — Aktivasi form inquiry khusus staging (build dan deploy)

Tanggal: 5 Oktober 2026  
Root proyek: `C:\Users\akmal\Documents\PT Web Bisnis Solusi Teknologi\Permata Briquettes`

## Ringkasan

Build dan deploy staging kini dapat menyalakan form inquiry dan Worker inquiry.
Production tetap mati dan tidak dapat menyala tanpa disengaja: build dan
pembuatan config deploy production gagal bila ada upaya mengaktifkan form, mode
live, site key, atau `INQUIRY_ENABLED="true"`. Tidak ada deploy, perintah
wrangler remote, perubahan DNS/token, migration, atau secret yang disentuh.
`crons` tetap `[]`. `wrangler.jsonc` yang di-commit tetap fail closed
(`INQUIRY_ENABLED="false"` di semua environment); nilai `"true"` hanya ada pada
`wrangler.deploy.jsonc` hasil generate untuk staging (diabaikan Git).

Status: **SELESAI, BELUM DIDEPLOY.** Staging baru dapat berfungsi penuh setelah
variable GitHub di bawah dibuat, migration D1 staging dijalankan, dan delapan
secret Worker terpasang di Cloudflare.

## Lokasi pemaksaan form mati yang ditemukan

| Lokasi | Perilaku sebelumnya | Perubahan |
| --- | --- | --- |
| `scripts/build-environment.mjs` | Menimpa `PUBLIC_INQUIRY_FORM_ENABLED=false`, mode `off`, dan menghapus site key untuk staging dan production. | Memanggil `resolveBuildInquiryVariables`: staging boleh live, production menolak. |
| `scripts/prepare-wrangler-config.mjs` | Gagal bila `INQUIRY_ENABLED` bukan `"false"` di environment terpilih; pesan menyebut "initial deployment". | Memanggil `buildDeployConfig`: staging menghasilkan `"true"`, production `"false"`. |
| `.github/workflows/cloudflare-deploy.yml` | Frasa konfirmasi `DEPLOY_<TARGET>_DISABLED_...`; langkah build tanpa variable form; nama langkah "disabled release". | Konfirmasi staging baru; variable form disuplai hanya untuk staging. |
| `scripts/smoke-deployment.mjs` | Mengharapkan form absen, Turnstile absen, `GET /api/inquiries` = `503` di kedua target. | Staging mengharapkan form live dan `405`; production tetap mengharapkan mati dan `503`. |
| `scripts/audit-static-build.mjs` | Pemeriksaan label hanya menerima `<label for>`; form memakai label pembungkus. | Label pembungkus ber-teks diterima (lihat temuan di bawah). |
| `src/config/inquiry-feature.ts` | Konfigurasi live tanpa site key turun diam-diam ke mode `off`. | Tidak diubah; kegagalan keras diberlakukan di skrip build (di bawah). |
| `worker/src/config.ts` | `INQUIRY_ENABLED` harus literal `"true"`, kalau tidak 503. | Tidak diubah. |
| `docs/cloudflare-deployment.md`, `README.md`, `.env.example` | Menyatakan rilis selalu disabled. | Diperbarui. |

## File berubah

| File | Perubahan |
| --- | --- |
| `scripts/inquiry-activation.mjs` (baru) | `resolveBuildInquiryVariables` dan `buildDeployConfig`: satu sumber aturan staging vs production. |
| `scripts/build-environment.mjs` | Memakai guard; meneruskan argumen tambahan (mis. `--outDir`) ke `astro build`; pesan hasil menyebut status form. |
| `scripts/prepare-wrangler-config.mjs` | Memakai `buildDeployConfig`; pesan hasil menyebut status inquiry. |
| `scripts/audit-static-build.mjs` | Menerima label pembungkus ber-teks; kontrol di luar label tetap wajib `for`/`aria`. |
| `scripts/smoke-deployment.mjs` | Ekspektasi per target; probe tambahan `GET /api/webhooks/resend`. |
| `.github/workflows/cloudflare-deploy.yml` | Konfirmasi staging baru dan suplai variable form khusus staging. |
| `tests/inquiry-activation.test.mjs` (baru) | 22 test guard build, guard config deploy, dan build nyata. |
| `docs/cloudflare-deployment.md`, `README.md`, `.env.example` | Menyelaraskan dokumentasi. |

## Nama variable GitHub yang harus Anda buat

Buat sebagai **Variable** (bukan Secret) pada GitHub Environment `staging`
(Settings → Environments → staging → Environment variables):

| Nama | Nilai yang diharapkan |
| --- | --- |
| `PUBLIC_TURNSTILE_SITE_KEY` | Site key publik widget Turnstile staging (diawali `0x4`, 16–64 karakter alfanumerik/`-`/`_`). Nilainya sengaja tidak ditulis di repo atau laporan ini. |

Dua variable lain (`PUBLIC_INQUIRY_FORM_ENABLED=true`, `PUBLIC_INQUIRY_FORM_MODE=live`)
ditulis literal di workflow untuk target staging dan **tidak** perlu dibuat.
Jangan membuat `PUBLIC_TURNSTILE_SITE_KEY` pada Environment `production`: workflow
tidak membacanya untuk production, dan build production akan gagal bila variable
itu sampai ke proses build.

Secret deploy yang sudah ada tidak berubah: `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`. Tidak ada secret Worker
ditambahkan ke GitHub.

## Keputusan teknis

1. **Aktivasi diterapkan pada config yang dihasilkan, bukan pada `wrangler.jsonc`.**
   File yang di-commit tetap `"false"` sehingga dry-run lokal dan review tidak
   pernah menunjukkan konfigurasi aktif secara tidak sengaja.
2. **Staging tanpa variable form tetap menghasilkan build mati.** Build staging
   yang menyalakan form wajib membawa ketiganya: enabled `true`, mode `live`, site
   key valid. Setengah konfigurasi (mis. site key tanpa flag) gagal, bukan
   diam-diam mati. Di workflow, flag selalu `true` untuk staging, sehingga variable
   site key yang hilang membuat build gagal dengan pesan jelas.
3. **Production menolak, tidak sekadar menimpa.** Sebelumnya skrip menimpa nilai
   diam-diam. Kini nilai selain kosong, `false`, atau `off` menghentikan build.
   Workflow juga tidak meneruskan variable form ke production sama sekali.
4. **Frasa konfirmasi staging diganti** menjadi
   `DEPLOY_STAGING_INQUIRY_ACTIVE_WITH_CUSTOM_DOMAIN` agar operator sadar bahwa
   deploy ini mengaktifkan inquiry. Frasa production tidak berubah.
5. **Smoke staging memakai `405`, bukan `503`.** Worker aktif dan lengkap
   menjawab `GET` dengan `405 method_not_allowed`; `503` berarti secret, binding,
   atau D1 belum lengkap, sehingga smoke gagal sebelum form dianggap siap.
6. **Baris smoke di workflow (butir 7 tugas).** Sudah berupa teks biasa
   (`https://${{ ... && 'staging.permatabriquettes.com' || 'www.permatabriquettes.com' }}`),
   tidak ada sintaks markdown. Tidak ada perubahan.

## Temuan di luar daftar tugas

Audit statis (`npm run audit:staging`, dijalankan workflow sebelum deploy) akan
**menolak** halaman kontak berisi form: 12 kegagalan "form control has no
accessible label", karena form memakai label pembungkus tanpa `id`/`for`. Saya
memverifikasi ini dengan menjalankan audit versi lama terhadap build staging
berisi form (12 kegagalan) lalu versi baru (lulus, 0 kegagalan). Tanpa perbaikan,
workflow staging tidak akan pernah sampai ke langkah deploy. Label pembungkus
adalah pola yang sah secara aksesibilitas; yang diperketat justru adalah wajibnya
teks pada label tersebut.

## Hasil verifikasi

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run check` | 120 file, 0 error, 0 warning, 0 hint. |
| `npm test` | 19 file, 120 test lulus (termasuk 22 test baru). |
| Build staging dengan key dummy | Kedua halaman kontak memuat `data-inquiry-form`, `data-sitekey`, dan Turnstile; tanpa token mock dan tanpa input file; halaman beranda tanpa Turnstile. Audit staging lulus. |
| Build staging, enabled `true` tanpa site key | Gagal: "PUBLIC_TURNSTILE_SITE_KEY is empty". |
| Build production dengan flag, mode live, atau site key | Ketiganya gagal: "Refusing to build production". |
| Build production normal | Sukses; kedua halaman kontak tanpa `<form>` dan tanpa Turnstile; CTA email tetap ada. |
| `prepare:deploy-config` staging (UUID dummy) | `INQUIRY_ENABLED="true"`, `crons: []`, hanya environment staging. Dry-run Wrangler membaca `"true"`. |
| `prepare:deploy-config` production (UUID dummy) | `INQUIRY_ENABLED="false"`, `crons: []`. Dry-run membaca `"false"`. |
| Production dengan `INQUIRY_ENABLED=true` di environment atau sumber | Ditolak oleh test. |
| Sintaks workflow YAML dan smoke script | Valid. |

Smoke test terhadap URL staging/production nyata **tidak dijalankan** (tidak ada
deploy; staging saat ini masih disabled sehingga ekspektasi barunya memang
gagal). Cabang staging baru pada smoke script diverifikasi hanya lewat
pemeriksaan sintaks dan review; pembuktian sebenarnya baru terjadi pada deploy
staging pertama. Site key dummy `1x00000000000000000000AA` hanya dipakai pada
build lokal di direktori sementara.

## Risiko dan keputusan tertunda

- **Prasyarat sebelum menjalankan workflow staging:** variable
  `PUBLIC_TURNSTILE_SITE_KEY`, migration D1 staging (manual, runbook), dan delapan
  secret Worker. Bila workflow dijalankan lebih awal, build/deploy berhasil tetapi
  smoke gagal dengan `503` dan form tampil tanpa backend yang siap.
- **Deploy staging bersifat live:** setelah `INQUIRY_ENABLED="true"`, form publik di
  staging menerima inquiry nyata dan mengirim email via Resend. Gunakan alamat uji
  milik sendiri pada pengujian awal. Staging berstatus noindex tetapi tetap dapat
  diakses siapa pun yang tahu URL-nya.
- **Cron retry belum aktif**, sesuai instruksi; email yang gagal berhenti di
  `retry_scheduled` sampai change terpisah.
- **Allowlist origin** sudah memuat `https://staging.permatabriquettes.com`
  (commit `dca6ab6` di branch `fix/inquiry-staging-origin`). Perubahan ini
  bergantung padanya; gabungkan keduanya sebelum deploy.
- **Production tetap NO-GO** (HSTS, hardening token, review legal, QA perangkat
  nyata/pembaca layar masih pending sesuai laporan 08).
- Perubahan ini belum di-commit.

## Rekomendasi berikutnya

1. Buat variable `PUBLIC_TURNSTILE_SITE_KEY` di GitHub Environment `staging`.
2. Selesaikan migration D1 staging dan pemasangan delapan secret Worker serta
   webhook Resend (via panduan Chat).
3. Review dan gabungkan branch origin-fix dan perubahan ini, lalu picu workflow
   staging dengan frasa konfirmasi baru.
4. Pastikan smoke staging lulus (form, Turnstile, `405`), lalu uji end-to-end
   dengan inquiry EN dan ID ke alamat uji.
5. Setelah alur terbukti, ajukan change terpisah untuk cron retry.
