# Laporan Tahap 5 — Implementasi Inquiry Worker

Tanggal implementasi: 1 Oktober 2026  
Root proyek: `C:\Users\akmal\Documents\PT Web Bisnis Solusi Teknologi\Permata Briquettes`

## Ringkasan hasil dan status aktivasi

Status: **SELESAI NAMUN BELUM DIAKTIFKAN**.

Worker inquiry, model D1, validasi server, Turnstile adapter, Resend adapter,
retry, webhook, suppression, retensi, maintenance, komponen form gated, dan test
telah disiapkan. Seluruhnya fail closed secara default:

- `INQUIRY_ENABLED` bernilai `false` pada konfigurasi yang masuk repository;
- tidak ada route deployment, resource ID nyata, atau cron aktif;
- endpoint mengembalikan `503` bila activation flag, D1, copy/version, binding,
  atau secret tidak lengkap;
- mode lokal hanya memakai mock Turnstile dan Resend;
- privacy notice EN/ID dipublikasikan dari naskah approved pengguna;
- komponen form tidak dihubungkan ke halaman kontak dan tidak masuk output HTML;
- CTA email/WhatsApp Tahap 4 tetap menjadi jalur kontak publik.

Aktivasi form publik masih diblokir oleh copy form/email approved yang belum
tersedia. Tidak ada deployment, email nyata, resource Cloudflare, migration
remote, perubahan DNS, atau panggilan endpoint publik.

## Sumber privacy notice dan blocker copy

Sumber approved adalah pesan pengguna pada 1 Oktober 2026 yang memuat naskah
lengkap **Pemberitahuan Privasi** dan **Privacy Notice**, keduanya bertanggal
berlaku 1 Oktober 2026. Naskah dipisahkan per locale tanpa parafrasa dan
dipublikasikan pada `/id/privasi/` serta `/en/privacy/`. Judul halaman, effective
date, heading, daftar, alamat, nama penerima internal, email privacy, dan seluruh
paragraf mengikuti naskah tersebut. Footer setiap locale mengarah ke pasangannya.

Notice juga menyediakan peringatan sensitif persis untuk masing-masing locale,
sehingga blocker peringatan telah selesai. Namun pesan validasi EN/ID persis,
label consent marketing form beserta version ID, serta subjek/isi konfirmasi
buyer belum tersedia. `InquiryForm.astro` tetap menerima seluruh copy sebagai
props wajib tanpa fallback dan tidak dirender. Worker tetap mensyaratkan versi
privacy, versi consent, serta template konfirmasi EN/ID dari environment sebelum
dapat aktif; effective date notice tidak diasumsikan sebagai identifier versi
machine-readable tanpa keputusan eksplisit.

## File yang dibuat atau diubah

| File | Perubahan |
| --- | --- |
| `.dev.vars.example` | Nama variable/binding yang diperlukan, seluruh nilai sensitif kosong; default disabled/local mock. |
| `.gitignore` | Mengabaikan `.dev.vars` dan variannya, kecuali file contoh tanpa nilai. |
| `wrangler.jsonc` | Static Assets, D1 binding placeholder, default disabled, local mock, tanpa route/cron aktif. |
| `package.json`, `package-lock.json` | Script test/check/Worker/migration lokal serta dev dependency Wrangler, Vitest, dan Workers types. |
| `vitest.config.ts` | Konfigurasi test Worker lokal. |
| `README.md` | Perintah verifikasi baru dan status inquiry nonaktif. |
| `src/content.config.ts` | Membolehkan eyebrow/hero summary kosong untuk halaman legal tanpa copy tambahan. |
| `src/content/pages/en/privacy.md` | Privacy Notice Inggris persis dari naskah approved 1 Oktober 2026. |
| `src/content/pages/id/privasi.md` | Pemberitahuan Privasi Indonesia persis dari naskah approved 1 Oktober 2026. |
| `src/content/README.md` | Mencatat provenance dan larangan parafrasa notice tanpa approval baru. |
| `src/components/ContentPage.astro` | Merender eyebrow/summary hanya bila tersedia. |
| `src/components/SiteFooter.astro` | Menambahkan tautan privacy locale-specific. |
| `src/components/InquiryForm.astro` | Form aksesibel yang hanya merender bila dipanggil dengan `enabled=true` dan copy approved lengkap; Turnstile UI juga default ke mock lokal. |
| `src/scripts/inquiry-form.ts` | Validasi UX, JSON same-origin, idempotency key, dan state submit; tidak memakai file upload atau multipart. |
| `worker/README.md` | Route, fail-closed gate, dan prosedur local-only. |
| `worker/tsconfig.json` | Type-check Worker dan test. |
| `worker/src/domain.ts` | Kontrak domain, port repository/network, origin, limit, dan retensi teknis. |
| `worker/src/config.ts` | Activation gate dan pemeriksaan konfigurasi lengkap. |
| `worker/src/validation.ts` | Schema server, normalisasi, limit karakter, allowlist field, dan penolakan attachment. |
| `worker/src/crypto.ts` | SHA-256, HMAC, decoding secret webhook, dan constant-time comparison. |
| `worker/src/d1-repository.ts` | Implementasi D1 untuk inquiry, idempotensi, delivery, rate limit, webhook, dan suppression. |
| `worker/src/turnstile.ts` | Siteverify server-side serta adapter local mock. |
| `worker/src/resend.ts` | Resend API dengan idempotency key serta adapter local mock. |
| `worker/src/service.ts` | Intake same-origin, urutan D1-before-email, delivery, dan retry. |
| `worker/src/webhook.ts` | Verifikasi raw-body signature dan event hard bounce/complaint. |
| `worker/src/app.ts`, `worker/src/index.ts` | Routing Worker, Static Assets fallback, fail-closed endpoint, dan scheduled retry handler. |
| `worker/migrations/0001_inquiry.sql` | Schema D1 lengkap; hanya diuji pada simulator lokal. |
| `worker/maintenance/monthly-maintenance.sql` | Template transaksi purge bulanan dengan placeholder operator/run ID. |
| `worker/maintenance/README.md` | Prosedur maintenance local-only dan bukti hitungan tanpa isi inquiry. |
| `worker/tests/*.ts` | Test validasi, security paths, idempotensi, rate, D1-before-email, retry, Resend, activation gate, dan webhook. |
| `reports/05-inquiry-implementation.md` | Laporan implementasi ini. |

## Kontrak field, validasi, consent, dan peringatan

| Field | Aturan server dan klien | Klasifikasi |
| --- | --- | --- |
| `name` | Wajib, string setelah normalisasi, 1–100 karakter. | PII identitas. |
| `email` | Wajib, format email, dinormalisasi lowercase, maksimum 254 karakter. | PII kontak. |
| `company` | Wajib, 1–150 karakter. | Data organisasi; dapat menjadi PII untuk usaha perseorangan. |
| `phone` | Opsional, maksimum 30 karakter. | PII kontak. |
| `message` | Opsional, maksimum 2.000 karakter. | PII atau informasi komersial/sensitif bebas. |
| `marketingConsent` | Boolean opsional dan checkbox tidak dicentang default. Tidak memengaruhi penerimaan inquiry. | Bukti pilihan marketing. |
| `locale` | Wajib, hanya `en` atau `id`. | Metadata. |
| `consentTextVersion` | Harus sama persis dengan versi environment aktif. | Bukti kepatuhan. |
| `privacyNoticeVersion` | Harus sama persis dengan versi environment aktif. | Bukti notice. |
| `turnstileToken` | Wajib, maksimum 2.048 karakter, diverifikasi server-side; tidak disimpan. | Token keamanan sementara. |

Payload memakai allowlist ketat. Field attachment seperti `file`, `files`,
`attachment`, dan `upload` ditolak eksplisit; field asing lain juga ditolak. Hanya
`application/json` diterima, sehingga multipart/file upload gagal sebelum schema.
Kontrol karakter berbahaya ditolak dan text dinormalisasi NFC; nilai tidak pernah
dipakai sebagai email header. Internal notification memakai plain text.

Status consent, waktu pencatatan, locale, dan versi teks disimpan bersama inquiry.
Bila consent diberikan, bukti terpisah dengan email yang di-HMAC disimpan selama
24 bulan. Consent tetap opsional dan inquiry dengan nilai `false` diterima.

Peringatan sensitif sudah approved di dalam notice dan tersedia untuk dipakai
persis. Pesan validasi dan copy form lain tetap tidak memiliki fallback generik
karena kontrak mengharuskan copy persis. Form baru dapat dirender setelah seluruh
props copy EN/ID yang tersisa disetujui.

## Data flow dan keputusan keamanan

1. Static Assets melayani website. Hanya path `/api/*` masuk ke Worker terlebih
   dahulu; request lainnya diteruskan ke binding `ASSETS`.
2. Endpoint memeriksa `POST`, activation gate, exact same-origin, JSON content
   type, deklarasi dan ukuran aktual maksimum 16 KiB, serta idempotency key.
3. Origin harus sama dengan origin URL request dan termasuk salah satu dari dua
   origin HTTPS yang disetujui. Mode lokal hanya mengizinkan loopback. Tidak ada
   header CORS atau handler preflight publik.
4. IP dari Cloudflare tidak disimpan mentah. Worker membuat HMAC memakai secret
   environment, lalu D1 mencatat event keamanan untuk rolling limit 5/15 menit
   dan 10/24 jam. Event rate-limit disimpan 30 hari.
5. Payload dinormalisasi dan divalidasi di server. Idempotency key juga di-HMAC;
   request yang sama dalam 24 jam mengembalikan reference ID lama, sedangkan
   key sama dengan payload berbeda mendapat `409`.
6. Turnstile diverifikasi server-side dengan action `inquiry`, hostname request,
   IP, dan idempotency key. Token tidak disimpan.
7. D1 membuat inquiry `accepted`, idempotency record, dan dua delivery record
   dalam batch sebelum proses email dijadwalkan. Catatan D1 adalah sumber
   otoritatif jumlah inquiry; kegagalan email tidak mengubah `accepted`.
8. Notifikasi internal dan konfirmasi buyer dikirim melalui adapter Resend.
   Konfirmasi buyer hanya memakai template approved sesuai locale dan tidak
   memantulkan nama, email, telepon, perusahaan, pesan, atau PII lain.
9. Network/5xx dijadwalkan ulang setelah 5 menit, 30 menit, lalu 2 jam. Resend
   idempotency key tetap sama pada setiap attempt. 4xx menjadi kegagalan final.
10. Webhook membaca raw body, memverifikasi `svix-id`, timestamp, dan signature,
    menolak timestamp di luar lima menit, serta deduplicate event. Hanya hard
    bounce dan complaint diproses. Buyer address dimasukkan ke suppression list
    sebagai HMAC, bukan alamat mentah.

Cloudflare Workers Rate Limiting binding saat audit hanya mendukung period 10
atau 60 detik, sehingga tidak dapat mengekspresikan window 15 menit/24 jam.
Implementasi memakai D1 yang sudah termasuk stack yang diizinkan; tidak ada
layanan tambahan. Counter memakai rolling window, bukan fixed bucket.

Mode lokal memilih `LocalTurnstileVerifier` dan `LocalEmailSender` secara mutlak.
Komponen form juga default ke token mock dan tidak memuat script Turnstile
publik; caller production harus memilih mode nonlokal secara eksplisit. Adapter
lokal tidak memiliki panggilan HTTP publik. Adapter remote hanya dibuat untuk
environment `staging`/`production` ketika gate lengkap.

Referensi teknis yang diverifikasi pada 1 Oktober 2026:

- [Cloudflare Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
  untuk Siteverify, token single-use/lima menit, hostname/action, dan
  idempotency key;
- [Cloudflare Workers Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
  untuk batas period 10/60 detik;
- [Cloudflare local binding behavior](https://developers.cloudflare.com/workers/local-development/bindings-per-env/)
  dan [D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/)
  untuk simulator lokal tanpa resource remote;
- [Cloudflare Static Assets binding](https://developers.cloudflare.com/workers/static-assets/binding/)
  untuk `ASSETS` fallback;
- [Resend webhook verification](https://www.resend.com/changelog/managing-webhooks-via-api)
  untuk verifikasi raw body dan header Svix, serta
  [Resend webhook event visibility](https://www.resend.com/changelog/webhook-event-visibility)
  untuk payload bounce per recipient.

## Schema D1 dan status

| Tabel | Isi dan tujuan |
| --- | --- |
| `inquiries` | Catatan otoritatif inquiry accepted, PII, locale, consent state/version/time, dan retention timestamp. |
| `idempotency_keys` | HMAC key, request hash, inquiry reference, expiry 24 jam. |
| `email_deliveries` | Satu record internal dan buyer per inquiry; attempt, next retry, provider ID, error category, status. |
| `marketing_consent_records` | Bukti consent granted dengan email HMAC, locale, versi, waktu, dan expiry 24 bulan. |
| `rate_limit_events` | IP HMAC dan timestamp untuk rolling limits; tidak menyimpan IP mentah. |
| `webhook_events` | Event ID, type, provider email ID, dan expiry untuk replay protection. |
| `marketing_suppressions` | Email HMAC, alasan hard bounce/complaint/opt-out, source event, dan annual review due. |
| `maintenance_runs` | Run ID, tanggal, executor non-PII, jumlah record terhapus, dan jumlah suppression yang perlu direview. |

Inquiry hanya memiliki status penerimaan `accepted`; request gagal tidak masuk
tabel inquiry. Delivery memiliki status `pending`, `sent`, `retry_scheduled`,
`failed_permanent`, `bounced`, atau `complained`. Pemisahan ini memastikan status
email tidak dapat mengubah jumlah inquiry diterima.

## Retensi dan maintenance bulanan

- Inquiry: 12 bulan sejak `last_activity_at`; update status delivery/webhook
  memperbarui aktivitas dan expiry.
- Bukti consent granted/withdrawn: 24 bulan sejak event consent terkait. Schema
  mendukung status `withdrawn`; workflow penarikan publik belum dibuat karena
  naskah/proses operasionalnya belum disetujui.
- Rate-limit dan webhook security records: 30 hari.
- Idempotency: 24 jam.
- Suppression/opt-out: tidak dihapus otomatis; annual review due disimpan dan
  dilaporkan setiap maintenance.

Template maintenance berjalan dalam transaksi, menghapus hanya record yang
expiry-nya lewat, dan menulis tanggal, hitungan, serta operator non-PII ke
`maintenance_runs`. Template sengaja memiliki placeholder yang wajib diganti di
salinan temporary sehingga tidak dapat mencatat executor palsu secara tidak
sengaja. Pada tahap ini prosedur hanya boleh diuji terhadap D1 lokal.

## Binding dan secret yang diperlukan

| Nama | Jenis | Keterangan |
| --- | --- | --- |
| `ASSETS` | Static Assets binding | Output Astro `dist/`. |
| `DB` | D1 binding | Database inquiry; config repository hanya memakai ID placeholder lokal. |
| `INQUIRY_ENABLED` | Variable | Harus literal `true`; repository menyimpan `false`. |
| `RUNTIME_MODE` | Variable | `local`, `staging`, atau `production`. |
| `USE_LOCAL_MOCKS` | Variable lokal | Wajib `true` untuk mode lokal. |
| `TURNSTILE_SECRET` | Secret | Siteverify server-side; tidak diperlukan oleh adapter mock. |
| `RESEND_API_KEY` | Secret | Pengiriman email; tidak diperlukan oleh adapter mock. |
| `RESEND_WEBHOOK_SECRET` | Secret | Verifikasi raw-body signature webhook. |
| `RATE_LIMIT_HASH_KEY` | Secret | HMAC IP dan idempotency key. |
| `SUPPRESSION_HASH_KEY` | Secret | HMAC email untuk consent/suppression. |
| `RESEND_NOTIFICATION_TO` | Secret | Recipient approved dari kontrak 1 Oktober; nilainya tidak ditulis ulang di konfigurasi/laporan implementasi. |
| `RESEND_FROM_ADDRESS` | Secret | Alamat From approved. |
| `RESEND_REPLY_TO` | Secret | Alamat Reply-To approved. |
| `PRIVACY_NOTICE_VERSION` | Variable | Versi notice approved. |
| `MARKETING_CONSENT_VERSION` | Variable | Versi teks consent approved. |
| `BUYER_CONFIRMATION_SUBJECT_EN/ID` | Variable/secret config | Subject approved per locale. |
| `BUYER_CONFIRMATION_TEXT_EN/ID` | Variable/secret config | Body approved per locale tanpa PII reflection. |

Activation gate mensyaratkan recipient, From, dan Reply-To bernilai sama sesuai
kontrak, tetapi nilainya tidak di-hardcode. `.dev.vars.example` hanya berisi nama
dan nilai kosong untuk hal sensitif. Bukti domain Resend verified tetap merupakan
pemeriksaan administratif sebelum activation.

## Hasil verifikasi

Semua perintah dijalankan dari root proyek. Hasil final dicatat setelah seluruh
perubahan selesai.

| Pemeriksaan | Hasil | Status |
| --- | --- | --- |
| `npm ci` | Clean install memasang 315 package dan mengaudit 316 package; 0 vulnerability. npm memperingatkan tiga install script `esbuild`/`workerd` belum dicakup `allowScripts`, tetapi command selesai exit code 0. | **Lulus** |
| `npm run check` | Astro dan Worker TypeScript memeriksa 33 file: 0 error, 0 warning, 0 hint; exit code 0. | **Lulus** |
| `npm run build` | Output/mode `static`; 19 halaman selesai dibangun, termasuk `/en/privacy/` dan `/id/privasi/`; exit code 0. | **Lulus** |
| `npm test` | 5 file, 25 test lulus. | **Lulus** |
| `npm run worker:check` | Wrangler 4.145.0 dry-run berhasil; Worker bundle dan bindings terbaca; `INQUIRY_ENABLED=false`; tidak deploy. | **Lulus** |
| Migration D1 lokal | `0001_inquiry.sql` menjalankan 20 command pada simulator lokal; pemeriksaan berikutnya menyatakan tidak ada migration pending. Tidak ada akses remote. | **Lulus** |
| Native rate-limit binding | Period yang didukung 10/60 detik tidak cocok; sengaja tidak dikonfigurasi. D1 rolling limiter diuji untuk kedua window. | **Tidak digunakan dengan alasan terdokumentasi** |
| Audit secret | Perintah wajib selesai. Kecocokan hanya nama variable kosong pada `.dev.vars.example`, identifier/property kode, nilai mock lokal, nama dependency lockfile, dan pembahasan dokumentasi. Pemeriksaan khusus memastikan seluruh sensitive field pada `.dev.vars.example` kosong. Tidak ditemukan credential nyata. | **Lulus setelah klasifikasi** |
| Audit file/FormData/multipart | Tidak ada `<input type="file">` atau `FormData`. Satu literal `multipart/form-data` hanya terdapat pada negative test yang membuktikan response `415`; tidak ada pada implementasi UI/runtime. | **Lulus** |
| Privacy routes dan build default | `/en/privacy/` dan `/id/privasi/` dibangun dan ditautkan dari footer. Kedua HTML kontak tetap memiliki 0 marker form/API/Turnstile/file; CTA `mailto:`/WhatsApp Tahap 4 tetap ada. | **Lulus sesuai fail-closed gate** |
| Struktur dan marker notice | Masing-masing privacy page memiliki tepat 1 `h1`, 9 `h2`, 0 form; effective date, alamat email privacy, warning sensitif, penerima internal, dan angka retensi ditemukan pada output. Language switch resiprokal tersedia. | **Lulus** |
| Lint | Tidak ada script lint terpisah; Astro check dan TypeScript strict digunakan. | **Tidak tersedia** |
| Git | Executable `git` tidak tersedia pada audit sebelumnya; status worktree tidak dapat dibuktikan lewat Git. | **Tidak dapat diperiksa** |

Peringatan akses wrapper npm/NPX terhadap instalasi user-level muncul setelah
beberapa command yang telah selesai dengan exit code 0. Wrangler juga gagal
menulis log user-level di sandbox pada beberapa command lokal, tetapi migration
lokal dan listing selesai dengan exit code 0. Worker dry-run diulang dengan izin
cache/log yang sesuai dan lulus.

Percobaan pertama menjalankan check/build/test secara paralel setelah `npm ci`
memicu konflik rename pada cache Vite lokal. Ketiga perintah kemudian dijalankan
berurutan; hasil final di atas semuanya lulus. Kegagalan sementara ini tidak
berasal dari source atau test.

## Negative-path security test

Test otomatis membuktikan:

- activation disabled atau konfigurasi copy tidak lengkap menghasilkan `503`;
- method selain `POST`, origin asing/cross-origin, content type non-JSON,
  payload di atas 16 KiB, schema invalid, attachment, token Turnstile invalid,
  dan idempotency key invalid/conflict ditolak;
- tidak ada header `Access-Control-Allow-Origin` pada endpoint inquiry/webhook;
- 5 request/15 menit dan 10 request/24 jam diterapkan pada mock rolling window;
- duplicate request 24 jam tidak membuat inquiry atau email kedua;
- repository mencatat event `stored` sebelum adapter email dipanggil;
- buyer confirmation memakai template locale approved dan tidak memantulkan PII;
- network/5xx di-retry 5 menit, 30 menit, dan 2 jam lalu berhenti;
- Resend 4xx tidak di-retry dan provider idempotency key stabil;
- webhook invalid signature ditolak, replay dideduplicate, soft bounce diabaikan,
  dan hard bounce/complaint membuat suppression untuk buyer delivery;
- mode local membuat adapter mock, bukan client HTTP publik.

## Bukti manual yang masih perlu diperiksa

1. Periksa visual dan isi `/en/privacy/` serta `/id/privasi/`, language switch,
   alamat, email privacy, nama penerima internal, dan tautan footer pada desktop/
   mobile. Cocokkan kembali dengan naskah approved 1 Oktober 2026.
2. Berikan dan approve pesan validasi EN/ID, label consent/version ID, serta
   subjek dan isi konfirmasi buyer per locale.
3. Legal/privacy owner harus memverifikasi dasar pemrosesan, identitas controller,
   hak subjek data, jalur withdrawal/opt-out, dan apakah retensi sesuai yurisdiksi.
4. Verifikasi domain sender Resend, Turnstile hostname/action, recipient/From/
   Reply-To, D1 binding, dan seluruh secret pada staging tanpa menyalinnya ke repo.
5. Konfirmasi plan/kapasitas D1 untuk volume rate-limit event dan lakukan load/
   concurrency test staging. Native binding tidak dapat memenuhi window kontrak.
6. Setelah copy form yang tersisa tersedia, instansiasi form EN/ID lalu lakukan
   QA keyboard, screen reader, mobile, dark/light theme, Turnstile expiry/reset,
   dan error states.
7. Konfigurasikan cron retry hanya setelah staging approval; config saat ini
   sengaja `crons: []`, sehingga retry handler tersedia tetapi tidak terjadwal.
8. Jalankan maintenance lokal dengan salinan template dan periksa bahwa
   `maintenance_runs` hanya berisi metadata/hitungan.

## Risiko, batasan, dan keputusan pending

- Privacy notice dan warning telah approved/dipublikasikan. Ketiadaan validation
  messages, consent form copy/version ID, dan confirmation email copy masih
  memblokir form publik dan activation.
- Retry otomatis membutuhkan Cron Trigger yang belum diaktifkan. Tanpa itu,
  record tetap `retry_scheduled` sampai scheduled handler dipicu.
- Domain Resend, resource D1, Turnstile widget, webhook registration, dan secrets
  belum tersedia atau belum diverifikasi; placeholder bukan resource nyata.
- D1 rolling limiter menambah satu security record per request. Retensi 30 hari
  dan purge bulanan wajib dijalankan; kapasitas harus divalidasi di staging.
- IP HMAC dan email HMAC tetap pseudonymous security/compliance data dan harus
  dibatasi aksesnya.
- Withdrawal/opt-out public flow belum termasuk kontrak implementasi ini;
  suppression hard bounce/complaint sudah tersedia, sedangkan withdrawal manual
  memerlukan prosedur dan copy approved.
- `worker:check` adalah compile dry-run, bukan deployment atau bukti account plan.

## Konfirmasi ruang lingkup

Tidak ada deployment, email nyata, request ke Turnstile/Resend publik, resource
Cloudflare, migration remote, perubahan DNS, webhook registration, atau secret
yang dibuat/disimpan. Satu-satunya database yang disentuh adalah simulator D1
lokal di `.wrangler/`, yang diabaikan Git. Form dan endpoint tetap nonaktif secara
default, privacy pages EN/ID kini dipublikasikan, dan CTA Tahap 4 tetap aktif.
