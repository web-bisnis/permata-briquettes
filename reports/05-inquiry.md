# Laporan Tahap 5 — Readiness Inquiry Worker, Turnstile, D1, dan Resend

Tanggal audit dan verifikasi: 30 September 2026  
Root proyek: `C:\Users\akmal\Documents\PT Web Bisnis Solusi Teknologi\Permata Briquettes`

## Ringkasan hasil

Status: **TERHAMBAT**.

Gate aktivasi inquiry belum lengkap. Repository belum memuat keputusan final dan persetujuan untuk field form, privacy notice, dasar serta teks persetujuan, retensi, penerima notifikasi internal, alamat pengirim Resend, domain terverifikasi, email konfirmasi buyer, kebijakan lampiran, batas rate, atau origin produksi/staging. Karena sedikitnya satu keputusan wajib belum tersedia—dan pada audit ini seluruh kelompok keputusan tersebut belum lengkap—Tahap 5 **belum dapat dinyatakan selesai**.

Sesuai gate, audit ini tidak membuat atau mengaktifkan form publik, endpoint penerima PII, migration D1 berisi PII, integrasi Resend, Turnstile, Worker handler, binding, secret, atau konfigurasi deployment. CTA email dan WhatsApp Tahap 4 tetap menjadi satu-satunya jalur kontak pada website. Tidak ada deployment, resource Cloudflare, perubahan DNS, atau email nyata.

## Ruang lingkup dan sumber audit

Audit mencakup seluruh file non-generated yang terdaftar di repository, terutama:

- `reports/01-foundation.md` dan `reports/01-foundation-revision-01.md` untuk dependensi serta daftar keputusan Tahap 5;
- `reports/04-contact-cta.md` untuk nilai yang telah disetujui dan batas Tahap 4;
- `src/content/decisions/stage-3.yaml` untuk keputusan konten yang masih tertahan;
- halaman kontak Inggris dan Indonesia untuk memastikan CTA Tahap 4 masih aktif tanpa form;
- `worker/README.md`, `astro.config.ts`, `package.json`, `.gitignore`, dan seluruh `src/` untuk memeriksa runtime, dependency, binding, serta artefak inquiry yang mungkin sudah ada.

`astro.config.ts` masih menggunakan output statis. `package.json` hanya memiliki script `dev`, `check`, `build`, dan `preview`; tidak ada script Worker, migration, lint, atau test. Direktori `worker/` hanya berisi README placeholder. Tidak ditemukan konfigurasi Wrangler, SQL migration, handler API, atau dependency integrasi Tahap 5.

Executable `git` tidak tersedia di environment verifikasi ini. Karena itu status worktree dan riwayat commit tidak dapat diaudit dengan `git status`/`git log`; kesimpulan laporan didasarkan pada isi filesystem yang tersedia.

## Matriks readiness keputusan aktivasi

Arti status:

- **Tersedia**: keputusan eksplisit ada dan dapat dipakai tanpa asumsi tambahan.
- **Belum tersedia**: nilai atau teks yang diperlukan tidak ditemukan.
- **Perlu persetujuan pengguna**: ada kandidat atau konteks terkait, tetapi belum merupakan keputusan final untuk inquiry.

| Keputusan / prasyarat | Status | Bukti audit | Yang diperlukan sebelum implementasi |
| --- | --- | --- | --- |
| Kanal launch awal | **Tersedia** | Tahap 4 menyetujui tautan email dan WhatsApp pada dua halaman kontak. | Pertahankan sampai inquiry memenuhi seluruh gate. |
| Field form dan aturan validasi | **Perlu persetujuan pengguna** | Konten menyebut kandidat kebutuhan bisnis seperti grade, bentuk/ukuran, kemasan, volume, tujuan, dan dokumen, tetapi tidak menetapkannya sebagai kontrak field, required/optional, batas panjang, atau enum. | Setujui daftar field final per locale, required/optional, format, batas panjang, dan pesan validasi. |
| Privacy notice | **Belum tersedia** | Tahap 3 menandai privacy link sebagai withheld; Tahap 4 menyatakan privacy notice belum disetujui. Tidak ada notice atau URL legal di repository. | Berikan dan setujui teks/URL notice yang menjelaskan controller, tujuan, data, penerima, retensi, hak, dan kanal kontak privasi. |
| Dasar pemrosesan dan teks persetujuan | **Belum tersedia** | Tidak ditemukan dasar pemrosesan atau copy consent untuk inquiry dan email konfirmasi. | Tentukan dasar pemrosesan; jika consent dipakai, setujui teks, sifat wajib/opsional, bukti yang disimpan, versi, dan mekanisme penarikan. |
| Retensi inquiry, event, dan log | **Belum tersedia** | Foundation menyebut retensi D1 sebagai pending; tidak ada durasi atau prosedur penghapusan. | Setujui durasi per kategori, titik awal hitung, legal hold bila ada, serta proses purge/anonimisasi dan backup. |
| Penerima notifikasi internal | **Perlu persetujuan pengguna** | Alamat email publik Tahap 4 tersedia, tetapi tidak ada keputusan bahwa alamat itu adalah recipient Resend atau siapa yang berwenang mengakses PII. | Setujui recipient/role per environment di luar repository dan aturan akses/fallback. |
| Alamat pengirim Resend | **Belum tersedia** | Tidak ada sender address, display name, reply-to policy, atau keputusan bounce handling. | Setujui From, display name, Reply-To, dan penanganan bounce/complaint. |
| Domain Resend terverifikasi | **Belum tersedia** | Tidak ada bukti status verifikasi domain Resend. Domain dari alamat publik tidak boleh dianggap telah terverifikasi. | Berikan bukti domain pengirim telah diverifikasi untuk environment yang akan digunakan. |
| Email konfirmasi buyer | **Belum tersedia** | Tidak ada keputusan apakah confirmation dikirim, template bilingual, subject, isi, disclosure, reply handling, atau kondisi kirim. | Setujui perilaku dan template per locale, termasuk data yang boleh dipantulkan kembali dan kegagalan pengiriman. |
| Kebijakan lampiran | **Perlu persetujuan pengguna** | Konten kemasan menyebut “attach/lampirkan”, sedangkan register Tahap 3 menyatakan attachment rules belum disetujui. | Putuskan disabled atau setujui tipe, jumlah, ukuran, scanning, storage, retensi, pengiriman, serta disclosure. Sampai itu terjadi, lampiran tidak boleh ditampilkan atau diterima. |
| Batas rate | **Belum tersedia** | Tidak ada angka, window, scope/key, burst, respons `429`, atau pengecualian yang disetujui. | Setujui limit per mekanisme dan environment beserta perilaku ketika limit tercapai. |
| Origin produksi dan staging | **Belum tersedia** | Foundation menyebut domain/canonical dan origin/CORS sebagai pending; tidak ada allowlist origin final. | Setujui origin HTTPS exact untuk production dan staging. Endpoint harus menolak origin lain dan tidak membuka CORS. |
| Strategi anti-abuse di luar Turnstile | **Belum tersedia** | Stack Turnstile diwajibkan, tetapi threshold, retry, replay/idempotency, observability, dan respons insiden belum diputuskan. | Setujui kontrol, batas payload, idempotency window, logging minimal, dan prosedur abuse. |
| D1 sebagai sumber otoritatif | **Tersedia** | Brief Tahap 5 menetapkan catatan inquiry D1 sebagai sumber otoritatif jumlah inquiry diterima. | Terapkan hanya setelah kontrak data, retensi, dan gate lain disetujui. |
| Event kontak minimal tanpa PII | **Tersedia sebagai batas desain** | Brief mengizinkan event minimal tanpa PII. Belum ada keputusan retensi sehingga pencatatan belum diaktifkan. | Finalisasi nama event, enumerasi nilai, dan retensi; jangan simpan IP, user-agent mentah, email, telepon, pesan, atau identifier buyer. |
| Pengelolaan secrets/bindings | **Tersedia sebagai batas desain** | Brief melarang secret di repository; `.gitignore` mengabaikan `.env`, `.env.*`, dan `.wrangler/`. | Saat gate lengkap, definisikan hanya nama binding non-secret di konfigurasi; masukkan token/key melalui secret manager environment. |

### Keputusan gate

Gate bernilai **gagal/tertutup**. Adanya batas arsitektur yang sudah tersedia tidak menggantikan keputusan bisnis, legal, privasi, keamanan, dan operasional yang masih kosong. Alamat email publik juga tidak otomatis menyetujui recipient internal atau identitas pengirim Resend.

## File yang dibuat atau diubah

| File | Perubahan |
| --- | --- |
| `reports/05-inquiry.md` | Baru; memuat audit readiness, alasan gate tertutup, desain data flow nonoperasional, klasifikasi data, hasil verifikasi, serta daftar keputusan pending. |

Tidak ada file aplikasi atau konfigurasi yang diubah. Secara khusus, halaman kontak, `package.json`, lockfile, `astro.config.ts`, isi `worker/`, dan CTA Tahap 4 tidak diubah oleh implementasi Tahap 5 ini.

## Data flow nonoperasional

Alur berikut adalah desain konseptual untuk ditinjau setelah gate lengkap, bukan endpoint atau konfigurasi yang aktif:

1. Browser memuat form dari origin website yang telah disetujui dan memperoleh challenge Turnstile.
2. Browser mengirim payload berukuran terbatas ke endpoint same-origin. Endpoint hanya menerima method dan content type yang disetujui; tidak menyediakan CORS lintas-origin.
3. Worker memeriksa origin exact, ukuran payload, struktur dan allowlist field, normalisasi yang aman, token Turnstile di server, idempotensi, dan batas rate. Validasi klien hanya membantu UX; keputusan penerimaan selalu berasal dari server.
4. Setelah seluruh pemeriksaan lolos, Worker lebih dulu membuat catatan inquiry di D1. Catatan D1—bukan hasil Resend atau analytics—menentukan jumlah inquiry yang diterima.
5. Worker mencoba notifikasi internal dan, bila disetujui, konfirmasi buyer melalui Resend. Setiap hasil mengubah status pengiriman pada catatan D1 tanpa menghapus catatan inquiry ketika email gagal.
6. Respons mengembalikan reference ID non-PII dan hasil generik. Error tidak membocorkan token, rule anti-abuse, alamat recipient, atau keberadaan alamat email tertentu.
7. Pekerjaan retry/reconciliation hanya boleh memakai catatan D1 dan aturan idempotensi yang disetujui. Pengiriman ulang tidak boleh menghasilkan inquiry otoritatif ganda.

Karena origin, field, retensi, rate, payload cap, idempotency window, recipient, dan template belum disetujui, nilai-nilai tersebut sengaja tidak diasumsikan di laporan ini.

## Model data dan status yang memerlukan persetujuan

Tidak ada schema atau migration yang dibuat. Tabel berikut hanya memetakan kategori data yang perlu diputuskan sebelum schema final.

| Kategori calon data | Contoh konseptual | Klasifikasi | Status saat ini |
| --- | --- | --- | --- |
| Identitas dan kanal buyer | nama, organisasi, email, telepon | PII / data kontak | Field dan necessity belum disetujui; tidak disimpan. |
| Isi inquiry | kebutuhan produk, volume, kemasan, tujuan, pesan | Dapat menjadi PII atau informasi komersial sensitif bila berupa teks bebas | Field, batas, sanitasi, dan retensi belum disetujui; tidak disimpan. |
| Bukti consent/notice | versi notice, teks/versi consent, waktu, hasil | Data kepatuhan yang dapat dikaitkan dengan individu | Dasar dan mekanisme belum disetujui; tidak disimpan. |
| Metadata keamanan | waktu, hasil Turnstile, rate-limit outcome, idempotency metadata | Dapat menjadi data personal/pseudonymous tergantung nilai | Minimasi, hashing, akses, dan retensi belum disetujui; tidak disimpan. |
| Status proses | reference ID, accepted time, status notifikasi internal, status konfirmasi buyer, error category aman | Metadata operasional; terkait inquiry menjadi bagian catatan PII | Model final dan retensi belum disetujui; tidak disimpan. |
| Lampiran | file dan metadata file | Berpotensi mengandung PII, malware, atau data komersial sensitif | Dilarang/tidak tersedia sampai kebijakan eksplisit disetujui. |
| Event kontak minimal | event type terbatas, locale, route/channel enum, timestamp | Dirancang non-PII | Boleh secara prinsip, tetapi belum diimplementasikan karena schema dan retensi belum disetujui. |

Event minimal di masa depan tidak boleh menyimpan nama, organisasi, email, telepon, pesan, isi inquiry, IP, user-agent mentah, token Turnstile, identifier iklan, fingerprint, atau nilai query bebas. Kandidat seperti locale, route yang telah dienumerasi, channel yang telah dienumerasi, event type, dan timestamp tetap harus melalui persetujuan retensi sebelum diaktifkan.

### Status inquiry konseptual

Status harus memisahkan penerimaan inquiry dari pengiriman email. Model minimal yang perlu difinalkan adalah:

- inquiry diterima dan tercatat di D1;
- notifikasi internal: belum dicoba, terkirim, gagal sementara, atau gagal final;
- konfirmasi buyer: tidak berlaku/tidak disetujui, belum dicoba, terkirim, gagal sementara, atau gagal final;
- deduplikasi/retry tercatat tanpa membuat inquiry otoritatif baru.

Nama enum, aturan transisi, retry ceiling, dan retensinya belum disetujui. Yang sudah tegas adalah kegagalan Resend tidak boleh menghapus atau mengurangi jumlah inquiry yang telah diterima di D1.

## Batas keamanan berdasarkan keputusan tersedia

- Inquiry harus same-origin dan tidak boleh memakai wildcard CORS. Exact production/staging origin belum tersedia, sehingga endpoint tidak boleh diaktifkan.
- Turnstile wajib diverifikasi di server sebelum penerimaan. Site key dan secret tidak boleh ditulis ke repository.
- Server menjadi otoritas untuk schema, sanitasi/normalisasi, ukuran payload, dan semua rule bisnis; validasi browser tidak cukup.
- Rate limiting dan kontrol replay/idempotensi wajib ada, tetapi angka dan window tidak boleh diasumsikan.
- D1 harus mencatat inquiry yang diterima sebelum pengiriman email dan tetap menjadi sumber otoritatif saat Resend gagal.
- Recipient internal, sender, token, API key, binding ID, dan data contoh berisi PII tidak boleh disimpan di repository.
- Attachment harus tidak ditampilkan dan ditolak sampai kebijakan lengkap disetujui.
- Pesan error harus generik; log dan event harus diminimalkan dan tidak boleh berisi payload PII atau secret.

## Hasil verifikasi

Semua perintah dijalankan dari root proyek. Hasil final dicatat setelah laporan ini dibuat.

| Pemeriksaan | Hasil | Status |
| --- | --- | --- |
| `npm ci` | Percobaan awal di sandbox gagal karena akses ke cache npm user-level ditolak. Pengulangan dengan izin yang sesuai berhasil: 271 package dipasang, 272 package diaudit, 0 vulnerability. npm memberi peringatan bahwa postinstall `esbuild` belum tercakup `allowScripts`, tetapi command selesai dengan exit code 0. | **Lulus pada pengulangan final** |
| `npm run check` | 13 file diperiksa; 0 error, 0 warning, 0 hint; exit code 0. Wrapper npm mencetak peringatan akses user-level setelah Astro selesai. | **Lulus** |
| `npm run build` | Output/mode tetap `static`; 17 halaman dibangun, termasuk `/en/contact/` dan `/id/kontak/`; exit code 0. Wrapper npm mencetak peringatan akses user-level setelah Astro selesai. | **Lulus** |
| Lint | Tidak ada script `lint` pada `package.json`. | **Tidak tersedia** |
| Test | Tidak ada script `test` pada `package.json`. | **Tidak tersedia** |
| Pemeriksaan Worker | Tidak ada script atau implementasi Worker; tidak dijalankan karena gate tertutup. | **Tidak berlaku** |
| Pemeriksaan migration | Tidak ada script atau migration; tidak dijalankan karena gate tertutup. | **Tidak berlaku** |
| Audit secret yang diminta | Perintah `rg -n "(RESEND_API_KEY\|TURNSTILE_SECRET\|password\|api[_-]?key\|secret)" . --glob "!node_modules/**" --glob "!dist/**"` selesai. Semua kecocokan adalah nama dependency `@azure/keyvault-secrets` dalam lockfile atau penyebutan kata “secret(s)” dalam laporan; tidak ada nilai kredensial. Scan tambahan terhadap pola assignment secret di implementasi menemukan 0 kecocokan. | **Lulus setelah klasifikasi kecocokan dokumentasi/dependency** |
| Audit email | Satu-satunya nilai email yang ditemukan adalah alamat publik CTA Tahap 4 pada dua halaman kontak dan laporan Tahap 4. Tidak ada recipient internal atau alamat contoh buyer yang ditambahkan. | **Lulus** |
| Audit artefak Tahap 5 terlarang | Tidak ditemukan form, file input, endpoint API, `fetch`, Turnstile, Resend, D1 binding, SQL, Wrangler, atau migration pada implementasi. Pencarian nama/ekstensi artefak Tahap 5 hanya menemukan laporan ini. | **Lulus** |
| CTA Tahap 4 pada build | Kedua output halaman kontak tetap memuat `mailto:` dan `wa.me`; tidak ditemukan form atau sinyal inquiry aktif. | **Lulus** |
| Status Git | Executable `git` tidak tersedia di environment. | **Tidak dapat diperiksa** |

## Bukti manual yang masih perlu diperiksa pengguna

1. Konfirmasi bahwa kedua halaman kontak masih menampilkan hanya CTA email/WhatsApp Tahap 4 dan tidak menampilkan form, upload, atau pesan seolah-olah inquiry web sudah aktif.
2. Tinjau dan setujui setiap baris gate yang belum lengkap; approval sebaiknya menyertakan versi/tanggal dan pemilik keputusan.
3. Verifikasi secara administratif bahwa recipient internal memang berwenang menerima PII serta domain pengirim telah verified di Resend; jangan menaruh alamat internal atau bukti yang mengandung secret di repository.
4. Setujui exact HTTPS origin untuk production dan staging sebelum endpoint dibuat.
5. Putuskan kebijakan attachment secara eksplisit. Tanpa approval, UI dan endpoint harus tetap tidak menerima file.
6. Setelah seluruh keputusan lengkap dan sebelum aktivasi publik, lakukan QA browser/perangkat, keyboard/screen reader, negative-path security, rate-limit, replay/idempotency, kegagalan D1/Resend, dan rekonsiliasi status dengan credential non-production.

## Risiko, batasan, dan keputusan pending

- Semua keputusan yang tercantum pada matriks sebagai belum tersedia atau perlu persetujuan adalah blocker aktivasi.
- Menebak field, consent, retention, recipient, sender, rate, atau origin dapat menyebabkan pengumpulan PII tanpa dasar dan kontrol yang disetujui.
- Alamat email publik Tahap 4 bukan bukti bahwa alamat itu disetujui sebagai recipient internal atau sender Resend.
- Teks konten yang meminta buyer “attach/lampirkan” materi adalah kebutuhan bisnis potensial, bukan izin membuat file upload.
- Event yang tampak non-PII dapat menjadi personal data bila digabungkan dengan IP, fingerprint, user-agent, query bebas, atau identifier stabil; implementasi harus menjaga enumerasi dan minimasi.
- Tanpa retention schedule, bahkan event minimal tidak diaktifkan pada tahap ini.
- Ketiadaan executable Git membatasi pembuktian bahwa tidak ada perubahan lain di luar filesystem yang diaudit.

## Konfirmasi ruang lingkup

Tahap 5 berhenti pada readiness report dan desain data flow nonoperasional. Tidak ada form publik, endpoint penerima PII, migration D1, schema PII, handler Worker, Turnstile, Resend, rate limiter, binding, secret, konfigurasi deployment, attachment, resource Cloudflare, perubahan DNS, deployment, atau email nyata yang dibuat/dijalankan. CTA email dan WhatsApp Tahap 4 tetap dipertahankan.
