# Laporan Revisi 01 Tahap 3 — Entry Point Root

Tanggal implementasi dan verifikasi: 30 September 2026  
Root proyek: `C:\Users\akmal\Documents\PT Web Bisnis Solusi Teknologi\Permata Briquettes`

## Ringkasan hasil

Route statis `/` telah ditambahkan sebagai pemilih bahasa netral. Halaman hanya menampilkan elemen antarmuka generik: judul pemilihan bahasa, tautan **English** ke `/en/`, tautan **Bahasa Indonesia** ke `/id/`, skip link, dan kontrol theme Tahap 2.

Halaman tidak menetapkan bahasa utama, tidak melakukan redirect, tidak membaca preferensi bahasa browser, dan tidak memuat copy bisnis. Route dan konten bilingual yang sudah ada tidak diubah. Build terakhir menghasilkan 15 halaman HTML statis, termasuk `dist/index.html`, `dist/en/index.html`, dan `dist/id/index.html`.

## File yang dibuat atau diubah

| File | Status | Tujuan |
| --- | --- | --- |
| `src/pages/index.astro` | Baru | Route `/` dengan satu `h1` dan dua tautan bahasa eksplisit. |
| `src/layouts/LanguageGatewayLayout.astro` | Baru | Dokumen HTML netral dengan `lang="mul"`, metadata generik, skip link, bootstrap theme, kontrol theme, dan main landmark. |
| `src/components/ThemeControl.astro` | Diubah | Menambahkan props label opsional agar root dapat memakai label bilingual generik; default lama dipertahankan sehingga halaman konten tidak berubah. |
| `src/styles/global.css` | Diubah | Styling root memakai design tokens Tahap 2, termasuk layout, tombol tautan, focus style yang sudah ada, dan responsivitas. |
| `reports/03-content-pages-revision-01.md` | Baru | Dokumentasi revisi dan hasil verifikasi. |

Tidak ada file pada `src/content/`, konfigurasi collection, data produk, route bilingual, navigasi bilingual, atau copy bisnis yang diubah.

## Alasan penggunaan pemilih bahasa

Sumber konten menyediakan dua entry point setara, `/en/` dan `/id/`, tanpa menetapkan bahasa utama. Pemilih bahasa menjaga keputusan tersebut tetap netral dan memberi pengguna kontrol eksplisit. Pendekatan ini menghindari tiga asumsi yang dilarang: bahasa default, redirect otomatis, dan deteksi bahasa browser.

Elemen root menggunakan:

- `html lang="mul"` untuk menandai dokumen dengan beberapa bahasa;
- atribut `lang` dan `hreflang` masing-masing pada tautan English dan Bahasa Indonesia;
- satu `h1` bilingual;
- tautan native yang dapat dicapai dan diaktifkan dengan keyboard;
- skip link menuju `main`;
- font lokal, warna, spacing, focus ring, light/dark theme, dan breakpoint dari Tahap 2.

Tidak diperlukan perubahan tautan global. Tautan brand pada halaman English/Indonesia tetap menuju home locale masing-masing, seluruh targetnya tersedia, dan root hanya menjadi entry point tambahan.

## Hasil verifikasi

| Pemeriksaan | Hasil | Status |
| --- | --- | --- |
| Pemulihan dependency | `npm ci` dijalankan kembali karena instalasi lokal sempat kehilangan direktori paket Astro; 271 paket dipasang, 0 vulnerability. | **Lulus**. |
| `npm run check` | 13 file diperiksa; 0 error, 0 warning, 0 hint. | **Lulus**. |
| `npm run build` | Output/mode `static`; 15 halaman dibangun, termasuk `/index.html`. | **Lulus**. |
| Lint | Tidak ada script `lint` pada `package.json`. | **Tidak tersedia**. |
| Test | Tidak ada script `test` pada `package.json`. | **Tidak tersedia**. |
| File wajib | `dist/index.html`, `dist/en/index.html`, dan `dist/id/index.html` tersedia. | **Lulus**. |
| Struktur root | Satu `h1`, satu tautan `/en/`, satu tautan `/id/`, serta target skip link tersedia. | **Lulus**. |
| Redirect/deteksi bahasa | Tidak ditemukan meta refresh, `window.location`, assignment/replace lokasi, atau `navigator.language`. | **Lulus**. |
| Copy bisnis root | Pencarian identitas perusahaan, produk, supplier, dan B2B pada `dist/index.html` menghasilkan 0 kecocokan. | **Lulus**. |
| Placeholder | `rg -n "\[PLACEHOLDER:" dist src` tidak menemukan kecocokan. | **Lulus**. |
| Pola terlarang | Audit `mailto:`, `wa.me`, `whatsapp`, Turnstile, Resend, D1, Wrangler, Cloudflare, dan analytics pada `src`/`dist` tidak menemukan kecocokan. | **Lulus**. |
| Tautan internal/fragment | 210 nilai `href` pada 15 HTML diperiksa; 0 target rusak. | **Lulus**. |

Wrapper npm non-elevated masih mencetak peringatan akses instalasi npm user-level setelah command selesai. `check` dan `build` tetap selesai dengan exit code 0. Instalasi ulang juga menampilkan peringatan bahwa postinstall `esbuild` belum dicakup konfigurasi `allowScripts`; hal tersebut tidak menghalangi check atau build.

## Bukti manual yang masih perlu diperiksa

1. Buka `/` dan pastikan halaman tidak berpindah otomatis setelah load atau ketika bahasa browser diubah.
2. Gunakan Tab untuk mencapai skip link, kontrol theme, English, dan Bahasa Indonesia; pastikan focus ring terlihat.
3. Aktifkan English dan Bahasa Indonesia dengan Enter dan pastikan masing-masing membuka `/en/` dan `/id/`.
4. Uji light, dark, dan system theme serta persistence pilihan setelah reload.
5. Periksa layout root pada viewport mobile dan desktop, termasuk wrapping judul dan ukuran target tautan.
6. Periksa perilaku pembaca layar terhadap `lang="mul"` serta atribut bahasa pada teks dan tautan.

## Risiko, batasan, dan keputusan pending

- `lang="mul"` adalah pilihan semantik untuk dokumen multibahasa, tetapi cara pengucapannya dapat berbeda antar pembaca layar; karena itu QA assistive technology tetap diperlukan.
- Root sengaja tidak tertaut balik dari halaman locale karena tidak ada kebutuhan navigasi sumber untuk pemilih bahasa. Language switch langsung antar-locale tetap dipertahankan.
- Tidak ada analytics atau telemetry untuk mengukur pilihan bahasa, sesuai batasan tahap.
- Git masih tidak tersedia di environment sebagaimana dicatat pada laporan Tahap 3 utama; status worktree belum dapat diverifikasi melalui `git status --short`.

## Konfirmasi ruang lingkup

- Tidak ada migrasi ulang atau perubahan pada fakta, klaim, spesifikasi, placeholder, metadata internal, maupun copy bisnis.
- Tidak ada bahasa default, redirect otomatis, atau deteksi bahasa browser.
- Tidak ada CTA kontak, form inquiry, Worker, analytics, layanan eksternal, atau pekerjaan Tahap 4–8.
- Route `/en/`, `/id/`, dan seluruh route bilingual lain tetap sama.
