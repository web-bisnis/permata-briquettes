# Tahap 5 — Revisi Copy Inquiry 01

## Ringkasan koreksi

Status: **selesai namun belum diaktifkan**.

Copy approved yang diberikan pada 1 Oktober 2026 telah menjadi sumber kanonis
untuk enam pesan validasi per locale, label consent marketing, serta subject dan
body konfirmasi buyer. `InquiryForm` telah dihubungkan ke `/en/contact/` dan
`/id/kontak/` melalui feature gate build-time yang fail closed. Build default
tetap hanya menampilkan CTA email/WhatsApp Tahap 4.

Tidak ada perubahan pada schema atau migration D1, kontrak atau implementasi
validasi Worker, rate limit, retensi, retry, Turnstile, Resend, maupun privacy
notice.

## File yang dibuat atau diubah

- `.env.example` — flag build-time default nonaktif dan contoh mode mock lokal.
- `.dev.vars.example` — hash privacy/consent dan template konfirmasi approved;
  seluruh secret dan routing internal tetap kosong.
- `src/config/inquiry-copy.ts` — copy kanonis bilingual dan batas field.
- `src/config/inquiry-feature.ts` — resolusi gate fail-closed.
- `src/config/inquiry-versions.ts` — SHA-256 deterministik.
- `src/components/InquiryForm.astro` — field, warning, link privacy, consent,
  batas, dan pesan validasi approved.
- `src/scripts/inquiry-form.ts` — validasi klien serta submit mock tanpa jaringan.
- `src/pages/[...slug].astro` — integrasi form hanya pada dua route kontak.
- `src/content/pages/en/contact.md` dan `src/content/pages/id/kontak.md` —
  menghapus klaim lama bahwa halaman selalu tidak mempunyai form; CTA tetap.
- `tests/inquiry-copy.test.mjs` dan `tests/inquiry-build.test.mjs` — test copy,
  versioning, gate, dan artefak build.
- `worker/tests/app.test.ts`, `worker/tests/helpers.ts`,
  `worker/tests/inquiry.test.ts`, dan `worker/tests/validation.test.ts` — test
  memakai template approved, batas yang sama, dan non-reflection PII.
- `vitest.config.ts`, `README.md`, `worker/README.md`, dan laporan ini.

## Bukti penggunaan copy approved

Sumber kanonis berada di `src/config/inquiry-copy.ts`. Test melakukan pencocokan
literal terhadap seluruh naskah berikut:

- enam pesan validasi EN dan enam pesan validasi ID;
- label consent marketing EN/ID, dengan alamat
  `office@permatabriquettes.com` dirender sebagai tautan `mailto:`;
- warning data sensitif yang berasal persis dari privacy notice masing-masing
  locale; dan
- subject/body konfirmasi buyer EN/ID, termasuk komitmen satu hari kerja dan
  kanal `office@permatabriquettes.com`.

Email konfirmasi menggunakan body teks biasa. Representasi Markdown tautan dari
naskah approved dirender sebagai alamat email yang sama; form merender alamat
tersebut sebagai tautan. Test kedua locale memastikan nama, email, perusahaan,
telepon, dan pesan buyer tidak dipantulkan ke body konfirmasi.

## Feature flag dan bukti fail closed

Form dirender hanya bila seluruh syarat build yang relevan terpenuhi:

| Variable | Nilai | Dampak |
| --- | --- | --- |
| `PUBLIC_INQUIRY_FORM_ENABLED` | persis `true` | Meminta aktivasi form. Nilai lain berarti nonaktif. |
| `PUBLIC_INQUIRY_FORM_MODE` | `local-mock` | Merender form dengan Turnstile dan submit lokal mock, tanpa request jaringan. |
| `PUBLIC_INQUIRY_FORM_MODE` | `live` | Hanya valid bila public Turnstile site key tidak kosong. |
| `PUBLIC_TURNSTILE_SITE_KEY` | public site key | Wajib untuk mode `live`; bukan secret. |

Flag tidak ada, flag selain `true`, mode tidak dikenal, atau mode live tanpa
site key menghasilkan `enabled=false`. Mode local mock hanya menyimulasikan
keberhasilan pada hostname `localhost` atau `127.0.0.1`; pada hostname publik
submit ditolak tanpa `fetch`. CTA email/WhatsApp selalu tetap tersedia.

Hasil inspeksi artefak:

- build default: 0 `<form>` pada kedua halaman kontak;
- build local mock eksplisit: masing-masing 1 `<form>`;
- build local mock memuat seluruh field, warning, link privacy locale, consent
  opsional yang tidak dicentang, enam pesan validasi, dan tanpa input file;
- build local mock tidak memuat script Turnstile publik dan tidak memanggil
  endpoint publik; dan
- setelah pemeriksaan mock, `dist/` dibangun kembali dalam keadaan default.

## Versi consent dan privacy

`src/config/inquiry-versions.ts` menormalisasi line ending, menyusun payload
kanonis dengan urutan `namespace`, `en`, lalu `id`, dan menghitung SHA-256 melalui
Web Crypto.

- Privacy: hash gabungan isi mentah dua file notice approved.
  `sha256-82f9288a6b820a24513d1f6041b2d7bfdd4d9a2067f909c010eb28c683a5f611`
- Consent: hash gabungan teks consent EN/ID yang dirender form.
  `sha256-b7f8c726daf971743ef9295167b2852f98ef4495eb2399f30264ca02344909b3`

Kedua nilai dicantumkan dalam `.dev.vars.example` agar konfigurasi Worker dapat
diselaraskan tanpa fallback. Test membuktikan hash stabil dan perubahan isi
menghasilkan identifier berbeda.

## Validasi klien dan server

| Field | Batas | Pesan klien approved | Otoritas server |
| --- | ---: | --- | --- |
| Nama | 1–100 | Pesan nama locale | Menolak kosong/whitespace dan >100 code point. |
| Email | wajib, maksimal 254 | Pesan kosong atau invalid locale | Menolak kosong, format invalid, dan >254 code point. |
| Perusahaan | 1–150 | Pesan perusahaan locale | Menolak kosong/whitespace dan >150 code point. |
| Telepon | opsional, maksimal 30 | Pesan telepon locale | Menolak >30 code point. |
| Pesan | opsional, maksimal 2.000 | Pesan locale | Menolak >2.000 code point. |

Klien menormalisasi line ending/NFC dan memeriksa panjang berdasarkan code point
sebelum memakai pesan approved. Server tetap menjadi otoritas dan tetap
mengembalikan kode aman `invalid_payload`; kontrak respons Worker tidak diubah.

## Hasil verifikasi

| Pemeriksaan | Status | Hasil |
| --- | --- | --- |
| `npm ci` | Lulus | 315 package dipasang dari lockfile; audit 316 package menemukan 0 vulnerability. |
| `npm run check` | Lulus | 38 file; 0 error, 0 warning, 0 hint; TypeScript Worker juga lulus. |
| `npm run build` default | Lulus | 19 halaman; kedua halaman kontak memiliki 0 form dan CTA tetap ada. |
| `npm test` | Lulus | 7 file; 34/34 test lulus, termasuk default build dan active local-mock build. |
| Build local mock | Lulus | Kedua locale merender 1 form; mock aktif; tidak memuat Turnstile publik. |
| Pemeriksaan Worker dry-run | Lulus | Wrangler membaca 49 static asset dan keluar melalui `--dry-run`; `INQUIRY_ENABLED=false`. |
| Audit secret | Lulus setelah klasifikasi | Kecocokan hanya nama variable kosong, identifier kode, mock test, dependency lockfile, atau dokumentasi. Delapan field sensitif dalam `.dev.vars.example` dipastikan kosong. |
| Audit attachment | Lulus | Tidak ada input file atau `FormData`; satu-satunya kecocokan `multipart/form-data` adalah negative-path test Worker. |

Wrangler dry-run pertama tidak dapat menulis log global karena sandbox. Perintah
yang sama kemudian diulang dengan izin filesystem dan berhasil; tetap memakai
`--dry-run` dan tidak menyentuh resource remote.

## Bukti manual yang masih perlu diperiksa

1. Jalankan mock lokal dan tinjau tata letak, urutan fokus, tampilan pesan
   validasi, link privacy, serta checkbox pada viewport desktop dan mobile.
2. Sebelum aktivasi live, cocokkan hash versi Worker, public site key, D1
   binding, seluruh secrets, domain Resend, dan environment Cloudflare.
3. Konfirmasi kapasitas/plan untuk pola penyimpanan rate limit yang sudah ada.

## Risiko, batasan, dan keputusan pending

- Form masih nonaktif secara default dan belum siap diaktifkan live sampai
  binding, secrets, environment, dan kesiapan operasional diverifikasi.
- Feature flag build hanya mengendalikan rendering statis; gate runtime Worker
  `INQUIRY_ENABLED` tetap harus diaktifkan secara terpisah setelah readiness.
- Mock lokal tidak menguji layanan Cloudflare atau Resend nyata dan sengaja tidak
  melakukan request jaringan.

## Konfirmasi ruang lingkup

Tidak ada deployment, email nyata, pembuatan resource Cloudflare, migration
remote, perubahan DNS, atau panggilan endpoint publik. CTA email/WhatsApp tetap
tersedia dan build default tetap tidak merender form.
