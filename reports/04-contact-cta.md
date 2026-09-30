# Laporan Tahap 4 — Halaman Kontak dan CTA Launch Awal

Tanggal implementasi dan verifikasi: 30 September 2026  
Root proyek: `C:\Users\akmal\Documents\PT Web Bisnis Solusi Teknologi\Permata Briquettes`

## Ringkasan hasil

Dua halaman kontak bilingual telah dibuat sebagai output HTML statis pada `/en/contact/` dan `/id/kontak/`. Masing-masing halaman memuat email resmi, tautan WhatsApp dengan nomor internasional tanpa tanda baca, nomor tampil yang disetujui, serta alamat perusahaan lengkap di dalam elemen semantik `<address>`.

CTA menggunakan tautan native `<a>` sehingga dapat dicapai dan diaktifkan dengan keyboard. Tidak ada form, upload, endpoint, pengiriman data melalui JavaScript, penyimpanan data kontak, layanan lokasi, peta, embed, analytics, atau integrasi selain `mailto:` dan WhatsApp. Copy tidak memuat janji waktu respons, ketersediaan, harga, term pembayaran, atau proses inquiry.

Route target dibuat lebih dahulu melalui content collection, kemudian `Contact`/`Kontak` ditambahkan ke konfigurasi navigasi bersama yang digunakan header dan footer. Field `alternateRoute` pada kedua entry menghubungkan language switch secara resiprokal. Build final menghasilkan 17 halaman statis dan audit tautan menemukan 0 target internal atau fragment rusak.

## Sumber dan nilai data kontak

Sumber otorisasi untuk Tahap 4 adalah brief pengguna pada 30 September 2026. Hanya nilai berikut yang diterbitkan:

| Data | Nilai publik | Implementasi |
| --- | --- | --- |
| Email | `marketing@permatabriquettes.com` | `mailto:marketing@permatabriquettes.com` |
| WhatsApp | `+62 811-3088-7797` | `https://wa.me/6281130887797` |
| Alamat | Spazio Tower Office Building Lantai 2 Unit 201, Jalan Mayjend. Yono Soewoyo Kav. 3, Graha Famili, Kelurahan Pradahkalikendal, Kecamatan Dukuhpakis, Kota Surabaya, Jawa Timur 60226, Indonesia. | Teks utuh di dalam `<address>`; tanpa link peta atau geocoding. |

Dokumen copy Tahap 3 hanya memiliki placeholder/keputusan withheld untuk kanal kontak dan alamat; tidak ada nilai alternatif yang diterbitkan. Brief Tahap 4 memberikan nilai yang disetujui untuk tiga field di atas. Nilai lain yang masih placeholder atau belum disetujui tetap tidak diterbitkan. Register `src/content/decisions/stage-3.yaml` dipertahankan sebagai catatan historis keputusan Tahap 3 dan tidak dirender.

## File yang dibuat atau diubah

| File | Status | Tujuan |
| --- | --- | --- |
| `src/content/pages/en/contact.md` | Baru | Halaman kontak Inggris, metadata dasar, CTA langsung, dan alamat. |
| `src/content/pages/id/kontak.md` | Baru | Halaman kontak Indonesia, metadata dasar, CTA langsung, dan alamat. |
| `src/config/navigation.ts` | Diubah | Menambahkan route kontak yang sudah tersedia ke header dan footer bilingual. |
| `src/styles/global.css` | Diubah | Styling CTA dan alamat dengan token Tahap 2; grid responsif dan wrapping navigasi desktop. |
| `src/content/README.md` | Diubah | Mencatat bahwa kanal kontak Tahap 4 yang telah disetujui hanya disimpan pada pasangan halaman kontak. |
| `reports/04-contact-cta.md` | Baru | Laporan implementasi dan verifikasi Tahap 4. |

Tidak ada dependency, konfigurasi endpoint, file Worker, database, layanan email, CAPTCHA, analytics, atau dokumen legal yang ditambahkan.

## Keputusan teknis dan alasan

- Halaman mengikuti pola content collection Tahap 3. Route tetap diprerender oleh `src/pages/[...slug].astro`; tidak ada route server atau runtime baru.
- CTA dibuat sebagai anchor native tanpa `target="_blank"`, handler JavaScript, parameter pesan, atau payload tambahan. Ini menjaga perilaku langsung, aksesibilitas keyboard, dan ruang lingkup data seminimal mungkin.
- Nomor tampilan mempertahankan format yang disetujui, sedangkan URL WhatsApp memakai digit internasional `6281130887797` sesuai format `wa.me`.
- Alamat diterbitkan persis seperti nilai yang disetujui, sebagai satu blok `<address>` yang dapat diseleksi/disalin. Tidak ada normalisasi istilah, penerjemahan alamat, peta, embed, atau layanan lokasi eksternal.
- Copy Inggris dan Indonesia hanya menjelaskan cara memakai kanal langsung dan bahwa halaman tidak mengandung form/pengumpulan informasi. Tidak ada klaim bisnis atau komitmen layanan tambahan.
- Metadata dibatasi pada title dan description tentang kanal resmi serta lokasi Surabaya yang didukung oleh data alamat. Tidak ada canonical, schema, social metadata, atau pekerjaan SEO Tahap 6.
- Navigasi dan footer berbagi `navigationItems`, sehingga penambahan dilakukan satu kali per locale setelah kedua target tersedia. Wrapping desktop ditambahkan agar item baru tidak memaksa baris keluar viewport.
- Focus ring global Tahap 2 tetap berlaku. CTA memiliki ukuran target minimum, wrapping untuk alamat email panjang, layout satu kolom pada mobile, dan dua kolom mulai breakpoint yang sudah ada.

## Hasil verifikasi

Semua perintah dijalankan dari root proyek.

| Pemeriksaan | Hasil | Status |
| --- | --- | --- |
| `npm ci` | Percobaan sandbox awal gagal karena akses cache/npm user-level. Pengulangan dengan izin yang sesuai berhasil memasang 271 package; audit 272 package, 0 vulnerability. Peringatan `allow-scripts` untuk postinstall `esbuild` tidak menggagalkan instalasi. | **Lulus pada pengulangan final**. |
| `npm run check` | 13 file diperiksa; 0 error, 0 warning, 0 hint. Wrapper npm mencetak peringatan akses user-level setelah Astro selesai, tetapi exit code command tetap 0. | **Lulus**. |
| `npm run build` | Output/mode `static`; 17 halaman dibangun, termasuk `dist/en/contact/index.html` dan `dist/id/kontak/index.html`; exit code 0. | **Lulus**. |
| Lint | `npm run` tidak menampilkan script `lint`. | **Tidak tersedia**. |
| Test | `npm run` tidak menampilkan script `test`. | **Tidak tersedia**. |
| Route kontak | Kedua file HTML target tersedia; masing-masing memiliki `lang`, title, description, satu `h1`, dua CTA anchor, dan satu `<address>`. | **Lulus**. |
| Akurasi data | Email, nomor tampil, dan alamat lengkap masing-masing ditemukan pada tepat 2 file source dan tepat 2 file HTML build. | **Lulus**. |
| URL CTA | `mailto:marketing@permatabriquettes.com` dan `https://wa.me/6281130887797` ditemukan pada kedua halaman source dan kedua hasil build. | **Lulus**. |
| Pembatasan lokasi CTA | Pencarian file menunjukkan `mailto:` dan `wa.me` hanya berada pada `en/contact` dan `id/kontak`, baik di `src` maupun `dist`. | **Lulus**. |
| Form/pengiriman data | Tidak ditemukan `<form`, file input, `fetch`, `XMLHttpRequest`, `FormData`, `sendBeacon`, atau `WebSocket` pada output halaman kontak. | **Lulus**. |
| Pola terlarang pada source | Perintah pola yang diminta tidak menemukan placeholder, form/file input, Turnstile, Resend, D1, Wrangler, Cloudflare, atau analytics di `src`. | **Lulus**. |
| Pola terlarang pada build | HTML/JS build tidak memiliki kecocokan. Perintah literal tanpa filter menemukan satu substring acak `d1` di data font Base64 pada CSS generated; inspeksi `rg -o` mengonfirmasi satu kecocokan dan bukan Cloudflare D1 atau kode aplikasi. | **Lulus setelah klasifikasi false positive**. |
| Audit tautan internal/fragment | 17 HTML, 274 `href`, 270 tautan internal/fragment, dan 17 fragment diperiksa; 0 target hilang, keluar dari `dist`, atau fragment rusak. | **Lulus**. |
| Language switch | `/en/contact/` mengarah ke `/id/kontak/` dengan `hreflang="id"`; pasangan Indonesia mengarah kembali dengan `hreflang="en"`. | **Lulus**. |
| Navigasi/footer | `Contact`/`Kontak` dirender dari konfigurasi yang sama pada header dan footer; targetnya tersedia pada build. State `aria-current="page"` muncul pada halaman kontak. | **Lulus**. |
| Dokumen legal asli | Tidak ditemukan file PDF, DOC/DOCX, XLS/XLSX, ZIP, PEM, KEY, CRT, atau CER dalam `src` atau `dist`. | **Lulus**. |

Perintah pemeriksaan pola dan CTA yang diminta telah dijalankan secara literal. Karena font lokal tertentu diinlining oleh Vite sebagai Base64, pola `d1` yang tidak dibatasi kata menghasilkan false positive pada satu baris CSS minified. Pemeriksaan terpisah pada seluruh source serta HTML/JS build menghasilkan 0 kecocokan pola terlarang.

## Bukti manual yang masih perlu diperiksa

1. Buka `/en/contact/` dan `/id/kontak/` pada browser desktop dan mobile; periksa wrapping navigasi, CTA, alamat panjang, light/dark/system theme, dan tidak adanya horizontal overflow.
2. Gunakan keyboard saja untuk mencapai skip link, menu, language switch, theme control, email, dan WhatsApp; pastikan urutan fokus dan focus ring mudah terlihat.
3. Aktifkan email dan WhatsApp pada perangkat yang memiliki handler terkait; pastikan aplikasi yang benar terbuka dan tujuan tetap `marketing@permatabriquettes.com` / `+62 811-3088-7797`.
4. Salin blok alamat dari browser dan cocokkan kembali dengan alamat yang disetujui, termasuk tanda baca dan kode pos.
5. Uji pembaca layar untuk memastikan label CTA, heading, landmark, locale dokumen, dan elemen `<address>` dibacakan dengan wajar.

## Risiko, batasan, dan keputusan pending

- Validasi protokol link, struktur output, target internal, dan markup telah otomatis; pembukaan aplikasi email/WhatsApp bergantung pada browser, perangkat, serta aplikasi pengguna dan tetap memerlukan uji manual.
- Jam kantor, waktu respons, ketersediaan produk, harga, term pembayaran, proses follow-up, attachment, privacy notice, dan legal disclosure tidak disetujui untuk halaman ini dan tidak diterbitkan.
- Tidak ada form atau pemrosesan data oleh situs. Jika form inquiry kelak diaktifkan, keputusan privacy, consent, validasi, retention, security, dan layanan pemrosesan harus diselesaikan pada tahap tersendiri.
- Satu false positive audit literal berasal dari data font Base64 generated. Mengubah font atau build hanya untuk menghilangkan substring acak tersebut tidak diperlukan dan tidak mengubah kesimpulan audit teknis.
- QA visual, perangkat nyata, dan assistive technology masih menjadi pemeriksaan manual pemilik proyek.
- Executable Git tidak tersedia di environment, sehingga status worktree tidak dapat diperiksa dengan `git status --short`.

## Konfirmasi ruang lingkup

Form inquiry dan seluruh pekerjaan Tahap 5–8 belum dimulai. Tidak ada upload, endpoint, Worker, Turnstile, D1, Resend, rate limiting, analytics, pengumpulan data, deployment, dokumen legal asli, atau layanan baru selain tautan langsung email dan WhatsApp yang disetujui.
