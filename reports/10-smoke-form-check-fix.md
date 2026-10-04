# Laporan Tahap 10 — Perbaikan pengecekan form pada smoke test staging

Tanggal: 5 Oktober 2026  
Root proyek: `C:\Users\akmal\Documents\PT Web Bisnis Solusi Teknologi\Permata Briquettes`

## Ringkasan

Run workflow staging #14 gagal pada pengecekan "/en/contact/ renders the inquiry
form" meskipun halaman staging sudah benar. Penyebabnya bukan struktur HTML,
melainkan **cacat pada skrip smoke itu sendiri**: regex mengandung satu karakter
kontrol backspace (0x08) tepat setelah `<form`, sehingga pola tidak pernah dapat
cocok dengan tag `<form` asli. Cacat ini saya buat pada tahap 9 (laporan 09) saat
menulis ulang skrip dengan Python; tes yang saya jalankan saat itu tidak
mengeksekusi cabang staging smoke, jadi tidak tertangkap. Tidak ada komponen,
copy, atau Worker yang diubah. Tidak ada push, deploy, wrangler remote, DNS,
token, migration, atau secret yang disentuh.

Cacat yang sama membuat cabang production (`!/<form^H/`) **selalu lulus**,
sehingga bukti "form absen" pada production selama ini tidak bermakna. Kini
keduanya diperbaiki dan diuji.

## Lokasi `data-inquiry-form` pada HTML aktual

Build staging lokal (`build:staging`, site key dummy, direktori sementara),
`en/contact/index.html`:

- Tag: `<form class="inquiry__form" action="/api/inquiries" method="post" data-inquiry-form data-locale="en" data-privacy-version="…" data-consent-version="…" data-success-message="…" data-error-message="…" data-submitting-label="…" data-local-mock="false" novalidate data-astro-cid-…>`
- Atribut `data-inquiry-form` berada **pada tag `<form` itu sendiri**, sebagai
  atribut tanpa nilai, setelah `class`, `action`, dan `method`.
- Kemunculan kedua (total 2x, sesuai pengamatan Anda pada staging) adalah selector
  `[data-inquiry-form]` di dalam skrip modul inline yang dibundel Astro.
  Itu teks di skrip, bukan elemen.
- Turnstile: `<div class="cf-turnstile" data-sitekey="…" data-action="inquiry" …>` dan
  `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer>`.
  Tombol kirim: `<button type="submit" …>`.

## Penyebab kegagalan

Regex di `scripts/smoke-deployment.mjs` baris form berisi byte 0x08 setelah
`<form` (terlihat sebagai `^H` pada `cat -A`, dan sering tampil terpotong menjadi
`<for[^>]*…` di layar/log). Pola efektifnya menuntut karakter backspace setelah
`<form`, yang tidak pernah ada di HTML. Kemungkinan asalnya: urutan `\b` (batas
kata) di dalam string Python non-raw yang dikonversi menjadi karakter backspace
saat file ditulis. Reproduksi: regex dari commit `ea104f1` dievaluasi terhadap HTML
staging lokal menghasilkan karakter kontrol `0x8` dan **tidak cocok** dengan tag
form nyata. Regex yang sama tanpa karakter itu cocok. Jadi HTML staging benar dan
hanya pengecekannya yang rusak.

Penyebab lanjutan: tes pada tahap 9 menguji guard build dan config deploy, tetapi
cabang staging smoke hanya diperiksa sintaksnya (`node --check`), dan logikanya
berupa kode inline yang tidak dapat diimpor.

## File berubah

| File | Perubahan |
| --- | --- |
| `scripts/smoke-checks.mjs` (baru) | Fungsi murni `inspectContactPage`, `inspectInquiryProbes`, `parseAttributes`. Tanpa jaringan. |
| `scripts/smoke-deployment.mjs` | Memanggil fungsi di atas; regex inline dihapus; karakter kontrol hilang. |
| `tests/smoke-checks.test.mjs` (baru) | 17 test terhadap HTML hasil build staging dan production lokal. |
| `docs/cloudflare-deployment.md` | Satu kalimat yang menunjuk modul pengecekan dan test-nya. |

Tidak diubah: komponen form, copy, Worker, workflow, `scripts/inquiry-activation.mjs`.

## Keputusan teknis

1. **Mengurai tag, bukan mencocokkan potongan teks.** Pengecekan mencari tag
   `<form` sungguhan dengan lookahead `(?=[\s>/])` (tanpa `\b` dan tanpa pola
   `<for` terpotong), mengurai atributnya, lalu memeriksa:
   - tepat satu `<form>` yang membawa atribut `data-inquiry-form`;
   - `action="/api/inquiries"` dan `method="post"`;
   - ada penutup `</form>`;
   - di dalam form ada field `email`, field `message`, dan tepat satu tombol submit.
   Atribut yang hanya muncul sebagai teks atau pada `<div>` tidak lulus.
2. **Turnstile diperiksa pada elemennya**: `<div class="cf-turnstile">` dengan
   `data-sitekey` tidak kosong, plus tepat satu `<script src>` Turnstile; bukan
   sekadar substring `data-sitekey=`.
3. **Production dibuktikan lebih ketat**: tidak ada tag `<form`, tidak ada
   `data-inquiry-form` di mana pun, tidak ada `challenges.cloudflare.com`, dan
   tidak ada widget `cf-turnstile`.
4. **Pengecekan lain tidak dilemahkan**: CTA email, CTA WhatsApp, site key, skrip
   Turnstile, token mock, probe 405 (staging) dan 503 (production) tetap ada.
   Probe dipindahkan ke fungsi yang dapat diuji dengan respons buatan.
5. **Guard regresi karakter kontrol**: test membaca kedua file smoke dan gagal bila
   ada karakter kontrol selain tab/LF/CR.

## Audit pola longgar atau terpotong lain di `smoke-deployment.mjs`

| Pola | Temuan | Tindakan |
| --- | --- | --- |
| Form staging `/<form^H[^>]*data-inquiry-form/` | Rusak (backspace); tidak pernah cocok. | Diganti parsing tag. |
| Form production `!/<form^H/` | Rusak; selalu lulus, bukti kosong. | Diganti pengecekan ketat (butir 3). |
| `data-sitekey="[^"]+"` | Longgar: tidak terikat ke widget Turnstile. | Diikat ke `div.cf-turnstile`. |
| `!/type="file"/` | Longgar: meloloskan `type=file` dan `type='file'`. | Diparse dari tag `input`; diuji ketiga bentuk. |
| `includes("challenges.cloudflare.com")` | Cukup sebagai petunjuk, tetapi tidak membuktikan skrip dimuat. | Dipertahankan, ditambah pengecekan `<script src>`. |
| `robots`, canonical, stylesheet (`href="/_astro/…css"`), `robots.txt`, sitemap | Bergantung pada urutan/format atribut keluaran Astro; tidak terpotong dan sudah lulus pada run staging sebelumnya. | Tidak diubah; dicatat sebagai kerapuhan (lihat risiko). |

Tidak ditemukan karakter kontrol lain: pemindaian file skrip, test, workflow, dan
dokumen yang saya sentuh hanya mengenai `smoke-deployment.mjs`. Hasil lain adalah
berkas PNG biner di `reports/audits/` yang memang berisi byte non-teks.

## Hasil verifikasi

| Pemeriksaan | Hasil |
| --- | --- |
| Reproduksi run #14 | Regex lama (`ea104f1`) terhadap HTML staging lokal: karakter kontrol `0x8`, tidak cocok. |
| Staging lokal (dummy key), kedua halaman kontak | Semua pengecekan form lulus. |
| Staging dengan `<form>` diubah menjadi `<div>` | Gagal pada "exactly one inquiry <form". |
| Marker hanya sebagai teks atau pada `<div>` | Gagal. |
| Site key dikosongkan; token mock disisipkan; input file (`"file"`, `'file'`, tanpa kutip) | Masing-masing gagal. |
| CTA email atau WhatsApp dihilangkan | Gagal. |
| Production lokal | Semua pengecekan absen lulus; HTML tanpa `<form`, `data-inquiry-form`, dan Turnstile. |
| HTML staging dipakai sebagai production | Gagal pada tiga pengecekan absen. |
| `<form>` kosong atau `div data-inquiry-form` pada production | Gagal. |
| Probe: staging 405 lulus, 503 gagal; production 503 lulus, 405 gagal | Sesuai. |
| `npm run check` | 122 file, 0 error, 0 warning, 0 hint. |
| `npm test` (penuh) | 20 file, 137 test lulus. Setelah menghapus satu konstanta tak terpakai, `smoke-checks` dan `inquiry-activation` dijalankan ulang: 39 test lulus. |

## Bukti manual

Tidak ada pengujian ke URL nyata, sesuai batasan. Bukti yang tersisa dan perlu
Anda jalankan: picu ulang workflow staging dan pastikan langkah smoke lulus pada
pengecekan form, Turnstile, dan probe 405.

## Risiko dan keputusan tertunda

- **Run #14 belum dibuktikan ulang di CI.** Perbaikan terbukti terhadap HTML
  lokal; HTML staging nyata sudah Anda konfirmasi strukturnya identik (satu
  `<form`, `data-sitekey`, Turnstile, 405).
- **Perubahan ini belum di-commit/di-push.** Workflow GitHub menjalankan kode dari
  commit, jadi run berikutnya baru memakai perbaikan setelah commit ini digabung
  dan di-push.
- **Probe `405` mensyaratkan Worker staging lengkap.** `503` berarti secret, D1,
  atau binding belum lengkap dan smoke akan gagal dengan benar.
- **Kerapuhan format Astro** pada pengecekan robots/canonical/stylesheet tetap ada;
  bila versi Astro mengubah urutan atribut, pengecekan itu perlu diperbarui.
  Dapat dipindahkan ke parser yang sama pada change terpisah.

## Rekomendasi berikutnya

1. Review dan gabungkan perubahan ini, lalu picu ulang workflow staging dengan
   frasa konfirmasi `DEPLOY_STAGING_INQUIRY_ACTIVE_WITH_CUSTOM_DOMAIN`.
2. Bila smoke lulus, lanjutkan uji end-to-end form (inquiry EN dan ID ke alamat uji).
3. Saat menulis atau mengedit skrip lewat Python, gunakan string raw atau tulis
   lewat editor; pertimbangkan menambah guard karakter kontrol serupa untuk seluruh
   `scripts/` pada change terpisah.
