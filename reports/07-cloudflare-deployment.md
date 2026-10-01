# Tahap 7 — Cloudflare deployment staging

Tanggal pembaruan: 1 Oktober 2026 (Asia/Jakarta)

## Ringkasan dan status

Status tahap: **STAGING TERVERIFIKASI**.

Release candidate fail-closed telah tersedia pada
`https://staging.permatabriquettes.com`. Smoke test HTTPS GET-only dijalankan
ulang dari workspace pada pembaruan dokumentasi ini dan lulus seluruh **38
pemeriksaan**. Staging tetap `noindex, nofollow`; form dan endpoint inquiry
tetap fail closed; analytics, Turnstile, Resend, webhook processing, dan cron
retry tetap nonaktif.

Status production: **BELUM SIAP / BELUM DIVERIFIKASI**. Tidak ada deployment,
migration, DNS change, secret write, atau aktivasi layanan production pada
pembaruan ini. Keberhasilan staging tidak dianggap sebagai persetujuan atau
bukti production.

## Bukti deployment staging

| Bukti | Nilai/status |
| --- | --- |
| Commit deploy | `e533404` |
| Merge commit | `48084abfc5700c3e8a5b2c7b20ca9d0c21ac3874` |
| Worker | `permata-briquettes-staging` |
| Worker version | `0b4d74b3-1a7e-4d5e-b079-7fe4720a5172` |
| URL staging | `https://staging.permatabriquettes.com` |
| HTTPS | Aktif; seluruh request smoke tetap pada HTTPS dan hostname staging. |
| Smoke test | **Lulus — 38 pemeriksaan GET-only** |
| Inquiry endpoint | `GET /api/inquiries` mengembalikan `503` dengan status unavailable. |
| Indexing | Meta `noindex, nofollow`; `robots.txt` memblokir crawling dan tidak mengiklankan sitemap. |
| Inquiry form | Tidak dirender pada halaman kontak EN/ID. |
| Analytics | Beacon Cloudflare Web Analytics tidak ada. |
| Turnstile | Widget/script tidak ada dan tidak diaktifkan. |
| Resend/email | Tidak diaktifkan; smoke test tidak mengirim email. |
| Webhook | Tetap nonaktif; tidak ada webhook yang dikirim atau diproses oleh smoke test. |
| Cron retry | Tetap nonaktif/kosong. |

Worker version di atas adalah versi yang sedang didokumentasikan sebagai hasil
deployment staging. Deployment/run identifier terpisah tidak diberikan pada
bukti pembaruan ini dan tidak direka. Demikian pula, version ID sebelum rilis
yang akan menjadi target rollback belum diberikan; lihat bagian rollback dan
bukti manual.

## Hasil smoke test HTTPS GET-only

Perintah yang dijalankan ulang:

```powershell
npm run smoke:deployment -- --environment staging --base-url https://staging.permatabriquettes.com
```

Hasil aktual:

```text
PASS: staging read-only smoke test; 38 checks.
```

Exit code: `0`.

Percobaan pertama dari sandbox lokal tidak dapat membuka koneksi jaringan dan
berakhir dengan `EACCES`; ini merupakan pembatasan sandbox, bukan respons
staging. Perintah yang sama kemudian dijalankan dengan akses jaringan read-only
dan berhasil. Hanya hasil successful network run tersebut yang dipakai untuk
status staging terverifikasi.

Pemeriksaan yang tercakup:

- root staging merespons sukses melalui HTTPS dan tidak berpindah hostname;
- root memuat `noindex, nofollow` serta canonical production yang disetujui;
- Cloudflare Web Analytics beacon tidak ada;
- stylesheet build ditemukan dan dapat diambil;
- `robots.txt` tersedia, berisi `Disallow: /`, dan tidak mengiklankan sitemap;
- `sitemap.xml` tersedia, memakai origin canonical production, serta tidak
  memuat staging, localhost, loopback, atau route API;
- halaman `/en/contact/` dan `/id/kontak/` tersedia;
- CTA email dan WhatsApp tersedia pada kedua halaman kontak;
- form inquiry dan Turnstile tidak dirender;
- `GET /api/inquiries` mengembalikan `503 inquiry_unavailable`.

Seluruh request smoke memakai metode `GET`. Tidak ada payload inquiry, PII,
POST, email, webhook, Turnstile verification, atau mutation request.

## Status layanan dan activation gate

| Layanan/gate | Status staging | Bukti/catatan |
| --- | --- | --- |
| Worker + Static Assets | **Aktif dan terverifikasi** | Halaman dan stylesheet build lulus GET. |
| HTTPS/custom domain | **Aktif dan terverifikasi** | URL staging lulus smoke HTTPS. |
| Robots/indexing | **Fail closed** | `noindex, nofollow`; crawling diblokir. |
| Sitemap/canonical | **Terverifikasi** | Sitemap dapat diambil; URL tetap canonical production. |
| CTA email/WhatsApp | **Terverifikasi** | Kedua CTA ada pada halaman kontak EN/ID; smoke tidak membuka layanan eksternal. |
| Inquiry form | **Nonaktif** | Tidak ada elemen form pada build staging. |
| Inquiry Worker endpoint | **Fail closed** | GET read-only menghasilkan `503 inquiry_unavailable`. |
| D1 write/migration | **Tidak dilakukan** | Tidak ada migration atau write D1 pada pembaruan dokumentasi ini. |
| Turnstile | **Nonaktif** | Widget/script tidak dirender; tidak ada request verifikasi. |
| Resend/email | **Nonaktif** | Tidak ada request Resend atau email nyata. |
| Webhook | **Nonaktif** | Tidak ada event webhook yang dikirim/diproses. |
| Cron retry | **Nonaktif** | Tidak ada cron activation atau scheduled retry. |
| Cloudflare Web Analytics | **Nonaktif** | Beacon analytics tidak ditemukan oleh smoke test. |
| Production | **Belum diverifikasi** | Tidak disentuh pada pembaruan ini. |

## Bukti administratif credential staging

Bukti administratif yang diberikan dan dicatat tanpa nilai credential:

- token bootstrap staging telah **dicabut**;
- secret GitHub Environment bernama `CLOUDFLARE_API_TOKEN` untuk staging telah
  **diperbarui**;
- tidak ada token lama maupun token pengganti yang dicantumkan di laporan;
- account ID, database ID, dan nilai secret lainnya tidak dicantumkan;
- tidak ada secret write yang dilakukan pada pembaruan dokumentasi ini.

Status ini merupakan bukti administratif, bukan hasil pembacaan nilai secret.
Nilai credential tidak boleh dimasukkan ke Git, artifact, output command,
screenshot, atau laporan.

## Git/GitHub dan reproducibility evidence

| Area | Bukti/status |
| --- | --- |
| Release commit | Commit deploy pendek `e533404` dicatat sebagai bukti rilis. |
| Merge evidence | Merge commit penuh `48084abfc5700c3e8a5b2c7b20ca9d0c21ac3874` dicatat. |
| Workflow result | Deployment Worker/version dan smoke evidence menunjukkan alur staging selesai. Workflow run URL/ID belum disertakan dalam bukti. |
| Protected credential | Token bootstrap dicabut dan `CLOUDFLARE_API_TOKEN` staging diperbarui tanpa mengekspos nilainya. |
| Reproducible build | Tahap sebelumnya menjalankan clean install, check, safe staging build, audit, tests, dan staging Worker dry-run. |

Hasil release-candidate verification yang telah tercatat:

| Command | Hasil |
| --- | --- |
| `npm ci` | Lulus; dependency dipasang dari lockfile. |
| `npm run check` | Lulus; 50 file, 0 error, 0 warning, 0 hint. |
| `npm run build:staging` | Lulus; safe build memaksa inquiry dan analytics nonaktif. |
| `npm run audit:staging` | Lulus; 19 halaman, 32 output file, 0 failure, 0 warning. |
| `npm test` | Lulus; 9 test file dan 40 test. |
| `npm run worker:check:staging` | Lulus sebagai Wrangler dry-run; binding Static Assets/D1 dan fail-closed vars terbaca tanpa upload. |
| Smoke HTTPS staging | Lulus; 38 pemeriksaan GET-only. |

Machine-readable static audit tetap tersedia di
`reports/audits/07-staging.json`.

## Rollback readiness

Current deployed Worker version yang terdokumentasi:
`0b4d74b3-1a7e-4d5e-b079-7fe4720a5172`.

Target rollback yang benar harus berupa Worker version sebelum deployment ini.
Version tersebut tidak diberikan dalam bukti pembaruan, sehingga laporan tidak
mengarang rollback ID. Sebelum change staging berikutnya, operator perlu:

1. mengambil deployment history secara read-only;
2. mencatat version terakhir yang diketahui baik sebelum current version;
3. memastikan owner dan alasan rollback;
4. setelah rollback yang disetujui, menjalankan ulang smoke test GET-only;
5. menjaga inquiry, cron, analytics, Turnstile, dan Resend tetap nonaktif.

Tidak ada rollback yang dilakukan pada pembaruan ini.

## Tindakan eksternal yang telah dilakukan sebelumnya

Berdasarkan bukti deployment dan administratif yang diberikan, tindakan
eksternal sebelum pembaruan laporan ini adalah:

- release commit `e533404` digabungkan melalui merge commit yang tercatat;
- Worker `permata-briquettes-staging` dideploy ke version yang tercatat;
- custom domain staging menjadi aktif melalui HTTPS;
- smoke test staging sebelumnya lulus 38 pemeriksaan;
- token bootstrap staging dicabut;
- secret `CLOUDFLARE_API_TOKEN` staging diperbarui tanpa mempublikasikan nilai.

Pada pembaruan dokumentasi ini, satu-satunya tindakan eksternal adalah request
HTTPS GET-only untuk mengulang smoke test staging. Tidak dilakukan deployment
baru, migration/restore D1, DNS change, route change, resource provisioning,
secret write, email, POST inquiry, webhook, cron, Turnstile, Resend, analytics,
atau tindakan production.

## Blocker production yang masih tersisa

Production tetap **BELUM SIAP / BELUM DIVERIFIKASI** karena:

- tidak ada keputusan rilis production eksplisit;
- staging verification tidak otomatis mengotorisasi production;
- bukti GitHub Environment/protection/secrets production belum diberikan pada
  pembaruan ini;
- kesiapan D1 production, backup/migration plan, DNS, custom domain, dan HTTPS
  production belum diverifikasi ulang setelah staging;
- belum ada production release candidate evidence yang dikaitkan dengan commit
  dan workflow run production;
- belum ada production smoke test;
- Cloudflare Web Analytics belum memiliki bukti token + approval aktivasi;
- inquiry, Turnstile, Resend, webhook, dan cron tetap memerlukan approval serta
  verifikasi staging terpisah sebelum dapat dipertimbangkan untuk production.

Tidak boleh mengubah status production hanya berdasarkan keberhasilan staging.

## Bukti manual yang masih diperlukan

1. Simpan workflow run URL/ID staging pada change record untuk traceability.
2. Ambil deployment history read-only dan catat Worker version sebelum current
   version sebagai rollback target.
3. Verifikasi branch protection dan GitHub Environment reviewer/policy melalui
   UI atau API, tanpa membaca nilai secret.
4. Periksa audit log administratif untuk pencabutan token bootstrap dan update
   secret staging; jangan menyalin nilai credential.
5. Lakukan QA browser manual pada desktop/mobile untuk tampilan, navigasi,
   focus, theme, dan CTA. Smoke otomatis membuktikan href, bukan pembukaan app
   email/WhatsApp pada perangkat pengguna.
6. Pantau staging untuk error Worker/asset tanpa mengaktifkan observability atau
   analytics yang belum disetujui.

## Langkah berikutnya yang direkomendasikan

1. Lengkapi workflow run evidence dan rollback target staging.
2. Pertahankan seluruh activation gate dalam keadaan nonaktif selama soak/QA
   staging.
3. Tangani temuan QA staging melalui commit dan release baru yang dapat
   ditelusuri; jangan mengedit deployment secara ad hoc.
4. Mulai readiness production sebagai keputusan dan checklist terpisah. Jangan
   deploy production sampai resource, DNS/HTTPS, backup/migration, protected
   credentials, release candidate, approval, dan rollback plan production
   tersedia serta diverifikasi.

## File yang diubah pada pembaruan ini

Hanya `reports/07-cloudflare-deployment.md` yang diubah. Tidak ada kode aplikasi,
konfigurasi deployment, workflow, migration, atau file secret yang diubah.
