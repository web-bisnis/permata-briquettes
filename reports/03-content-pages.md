# Laporan Tahap 3 — Content Collections dan Halaman Konten

Tanggal implementasi dan verifikasi: 30 September 2026  
Root proyek: `C:\Users\akmal\Documents\PT Web Bisnis Solusi Teknologi\Permata Briquettes`

## Ringkasan hasil

Konten sumber telah dimigrasikan ke tiga Astro Content Collections yang typed: `pages` untuk copy halaman Markdown, `products` untuk data produk YAML, dan `decisions` untuk keputusan nonpublik YAML. Build menghasilkan 14 halaman HTML statis bilingual yang didukung langsung oleh sumber: beranda, tentang, produk, detail produk, kemasan, kualitas/dokumen, serta pemesanan/pengiriman dalam bahasa Inggris dan Indonesia.

Dua halaman kontak pada sitemap sumber sengaja tidak dibuat. Batasan Tahap 3 melarang halaman kontak aktif dan form inquiry, sementara seluruh kanal kontak serta privacy notice masih berupa placeholder. Semua tautan menuju route kontak juga ditahan agar navigasi dan output tidak memiliki tautan fiktif. Copy aman yang tidak bergantung pada placeholder tetap dipublikasikan; nilai ambigu atau belum disetujui disimpan sebagai keputusan internal dan tidak dirender.

`npm ci`, `npm run check`, dan `npm run build` selesai dengan sukses. Build terakhir menghasilkan 14 halaman; audit 206 nilai `href` menemukan 0 tautan internal atau fragment rusak. Pemeriksaan source dan build tidak menemukan marker placeholder mentah, pola integrasi/kontak terlarang, route kontak tertahan, atau aset dokumen legal.

## Dokumen copy yang digunakan

| Identitas | Nilai |
| --- | --- |
| Nama | `website_copy_permata_briquettes.md` |
| Lokasi sumber read-only | `C:\Users\akmal\Downloads\website_copy_permata_briquettes.md` |
| Ukuran | 47.705 byte |
| Waktu modifikasi yang terbaca | 30 September 2026 00:36:48 |
| SHA-256 | `C61A600A4C7B9DC843AE70C5550B72148E9C3DA99801443FB6FD5CD9A326B4AB` |
| Cakupan penggunaan | Sitemap, navigasi, footer, metadata dasar, hero, prose halaman, grade, spesifikasi referensi, ukuran, kemasan, status dokumen, ketentuan pemesanan/pengiriman, placeholder, dan catatan editorial. |

Dokumen ditemukan di lokasi lokal yang dapat dibaca setelah tidak ditemukan di root proyek. File sumber tidak disalin, diubah, atau dimasukkan ke output publik. Seluruh 735 baris dibaca; `rg` menemukan 60 marker placeholder termasuk dua marker contoh pada disclaimer awal, atau 58 marker data bilingual.

## Inventaris sumber

- Delapan pasangan halaman bilingual: Home/Beranda, About/Tentang Kami, Products/Produk, Product Detail/Detail Produk, Packaging/ Kemasan, Quality & Documents/Kualitas & Dokumen, Ordering & Shipping/Pemesanan & Pengiriman, dan Contact/Kontak.
- Satu keluarga produk aktif: briket arang tempurung kelapa untuk shisha dan hookah.
- Tiga grade aktif: Platinum, Super Premium, dan Premium.
- Parameter referensi: kadar abu, waktu bakar, waktu penyalaan, kadar air, fixed carbon, volatile matter, dan warna abu.
- Bentuk/ukuran: cube, finger, hexagonal, flat/brix, dan dome; dua ukuran flat/brix tidak dipublikasikan karena satuannya belum terkonfirmasi.
- Informasi perusahaan: PT Permata Bara Globalindo sebagai badan hukum dan Permata Briquettes sebagai merek dagang; identitas legal rinci dan kanal kontak belum tersedia untuk publik.
- Materi dokumen: ROA, SHT, MSDS, ISO 9001:2015, Factory Audit, dan legalitas perusahaan dinyatakan tersedia; ISO dan Factory Audit diatribusikan kepada manufacturer. Tidak ada file asli yang dipublikasikan.
- Informasi komersial: MOQ satu kontainer 20 ft; EXW, FOB, CNF, dan CIF; Semarang sebagai pelabuhan utama pada data sumber, serta Surabaya/Jakarta sebagai alternatif yang perlu dikonfirmasi.
- Bagian belum layak publik: seluruh nilai placeholder, range abu Super Premium yang bertentangan, spesifikasi kontraktual, metadata/tautan dokumen, konfigurasi kemasan rinci, ketentuan domestik/pembayaran/timing, dan seluruh implementasi kontak.

## Mapping sumber ke collections dan route

| Bagian sumber | Entri `pages` | Route publik | Entri terkait |
| --- | --- | --- | --- |
| Home / Beranda | `en/home`, `id/home` | `/en/`, `/id/` | Keputusan CTA kontak disimpan internal. |
| About / Tentang Kami | `en/about`, `id/tentang-kami` | `/en/about/`, `/id/tentang-kami/` | Detail legal yang belum disetujui disimpan internal. |
| Products / Produk | `en/products`, `id/produk` | `/en/products/`, `/id/produk/` | Data grade juga divalidasi di `products`. |
| Product Detail / Detail Produk | `en/product-detail`, `id/detail-produk` | `/en/products/coconut-charcoal-briquettes-for-shisha/`, `/id/produk/briket-arang-tempurung-kelapa-untuk-shisha/` | Spesifikasi dan ukuran juga divalidasi di `products`. |
| Packaging & Private Label / Kemasan & Merek Pelanggan | `en/packaging`, `id/kemasan` | `/en/packaging/`, `/id/kemasan/` | Konfigurasi belum disetujui disimpan internal. |
| Quality & Documents / Kualitas & Dokumen | `en/quality-documents`, `id/kualitas-dokumen` | `/en/quality-documents/`, `/id/kualitas-dokumen/` | Hanya status/atribusi; tidak ada file legal asli. |
| Ordering & Shipping / Pemesanan & Pengiriman | `en/ordering-shipping`, `id/pemesanan-pengiriman` | `/en/ordering-shipping/`, `/id/pemesanan-pengiriman/` | Ketentuan yang belum pasti disimpan internal. |
| Contact / Kontak | Tidak dibuat sebagai `pages` | Tidak dipublikasikan | Status ditahan di `decisions/stage-3`; dilarang pada tahap ini. |
| Grade, parameter, bentuk, ukuran, kemasan dasar | — | Dirender dalam halaman produk | `products/en/coconut-charcoal-briquettes`, `products/id/briket-arang-tempurung-kelapa`. |
| Placeholder dan keputusan editorial | Metadata `internalNotes` dan register pusat | Tidak dirender | `decisions/stage-3`. |

Tidak ada route `/` yang dibuat karena sumber hanya mendukung `/en/` dan `/id/`. Language switch mengarah langsung ke pasangan route yang benar. Navigasi global memuat lima halaman utama non-kontak; home tersedia lewat brand link dan detail produk tersedia lewat halaman produk.

## File yang dibuat atau diubah

| File/kelompok | Status | Tujuan |
| --- | --- | --- |
| `src/content.config.ts` | Baru | Tiga schema typed dengan validasi locale, route, metadata, grade, spesifikasi, ukuran, kemasan, dan keputusan internal. |
| `src/content/pages/en/*.md` | Baru, 7 file | Copy halaman publik bahasa Inggris. |
| `src/content/pages/id/*.md` | Baru, 7 file | Copy halaman publik bahasa Indonesia. |
| `src/content/products/en/*.yaml` | Baru, 1 file | Data produk bahasa Inggris terstruktur. |
| `src/content/products/id/*.yaml` | Baru, 1 file | Data produk bahasa Indonesia terstruktur. |
| `src/content/decisions/stage-3.yaml` | Baru | Register nonpublik untuk konten tertahan, ambigu, dan menunggu persetujuan. |
| `src/content/README.md` | Diubah | Dokumentasi struktur dan sifat nonpublik keputusan. |
| `src/pages/[...slug].astro` | Baru | Menghasilkan semua route collection sebagai HTML statis. |
| `src/pages/index.astro` | Dihapus | Route `/` tidak didukung oleh sitemap sumber. |
| `src/layouts/BaseLayout.astro` | Diubah | Locale dokumen, skip link bilingual, alternate route, header, dan footer. |
| `src/components/ContentPage.astro` | Baru | Struktur hero dan prose halaman konten. |
| `src/components/SiteHeader.astro` | Diubah | Brand link, navigasi bilingual, state route, dan language switch. |
| `src/components/SiteFooter.astro` | Diubah | Copy footer yang bersumber dan tautan route yang tersedia. |
| `src/config/navigation.ts` | Diubah | Navigasi typed EN/ID tanpa route kontak. |
| `src/styles/global.css` | Diubah | Styling prose, tabel responsif, navigasi footer, dan layout halaman menggunakan token Tahap 2. |
| `reports/03-content-pages.md` | Baru | Laporan implementasi, mapping, keputusan, dan verifikasi. |

Tidak ada dependency baru, layanan eksternal, CMS, library UI, gambar stok, Worker, form, konfigurasi deployment, sitemap, robots, atau analytics yang ditambahkan.

## Keputusan teknis dan alasan

- Markdown dipakai untuk copy halaman karena struktur utamanya berupa heading, paragraf, daftar, dan tabel. YAML dipakai untuk data produk dan keputusan karena keduanya merupakan data terstruktur.
- `src/content.config.ts` memakai Zod dari `astro/zod`, sehingga `astro check` tidak menghasilkan deprecation hint dan setiap collection tervalidasi saat sync/build.
- Route berasal dari field `route` yang divalidasi dan diprerender melalui `getStaticPaths`; tidak ada server rendering atau endpoint.
- Metadata `<title>` dan description memakai nilai sumber tanpa menambah klaim SEO. Tidak ada pekerjaan SEO teknis Tahap 6.
- Super Premium ash ditampilkan sebagai em dash pada tabel dan tidak dicantumkan pada ringkasan grade. Ini mencegah pemilihan salah satu dari dua range yang bertentangan.
- Hanya ukuran Flat/Brix `25×25×17 mm` yang dipublikasikan. Dua ukuran lain disimpan sebagai keputusan internal sampai satuannya dikonfirmasi.
- Status ketersediaan dokumen dan atribusinya dipertahankan, tetapi nomor laporan, tanggal, scope, validity, link, dan file asli tidak dibuat atau dipublikasikan.
- CTA internal menuju produk, kemasan, dan dokumen tetap aktif karena targetnya dibangun. Seluruh CTA menuju kontak/inquiry ditahan agar tidak membuat pengalaman palsu atau tautan rusak.
- Footer hanya memuat dua kalimat sumber yang aman dan navigasi route yang tersedia. Bagian footer yang masih placeholder tidak dirender.
- Design tokens, font lokal, theme control, native mobile menu, output static, dan JavaScript minimal Tahap 2 dipertahankan.

## Placeholder, ambiguitas, dan konten yang disembunyikan

Daftar berikut menggabungkan pasangan EN/ID yang ekuivalen. Detail keputusan juga tersimpan secara nonpublik pada metadata entry dan `decisions/stage-3.yaml`.

| Area | Konten tertahan/ambigu | Keputusan saat ini | Persetujuan yang diperlukan |
| --- | --- | --- | --- |
| Footer/global | Alamat, email resmi, telepon/WhatsApp, legal disclosure, privacy-policy link | Tidak dirender; tidak ada kanal kontak buatan. | Nilai resmi dan izin publikasi. |
| About | Alamat terdaftar, NIB/registration, NPWP, kontak, link dokumen perusahaan | Hanya badan hukum dan merek dagang ditampilkan. | Nilai dan link publik yang disetujui. |
| Products | Abu Super Premium: `1.9–2.2%` versus `2.0–2.2%` | Kedua nilai ditahan; parameter lain tetap ditampilkan. | Pilih rentang yang benar. |
| Product Detail | Rumusan komposisi untuk label/dokumen teknis | Copy sumber yang aman dipertahankan tanpa memperluas klaim. | Rumusan final. |
| Product Detail | Spesifikasi kontraktual, metode uji, toleransi | Angka tetap berlabel referensi. | Dokumen spesifikasi yang disetujui. |
| Product Detail | Satuan `20×20×15` dan `22×22×15`, daftar ukuran lengkap, matriks grade-size | Ukuran tanpa satuan dan matriks tidak dipublikasikan. | Satuan dan matriks ketersediaan. |
| Product Detail | Tautan dokumen dan detail laporan terkini | Status ketersediaan saja. | Link/metadata yang telah ditinjau. |
| Packaging | Berat inner box dan kombinasi master carton | Hanya master carton 10/20 kg dipublikasikan. | Konfigurasi packing resmi. |
| Packaging | Template artwork, print spec, MOQ per desain, approval process | Tidak dipublikasikan. | Template dan proses final. |
| Packaging | Standard packing/pallet per rute | Pilihan yang tercantum tetap disebut; standar per rute ditahan. | Spesifikasi per rute. |
| Quality | Spec sheet, test method, tolerance, sample approval | Tidak dipublikasikan. | Dokumen dan proses yang disetujui. |
| Quality | Nomor/tanggal/batch ROA; SHT validity; MSDS version; ISO scope/validity; Factory Audit issuer/scope/date; NIB/NPWP links | Tidak ada file atau link; atribusi pemilik tetap jelas. | Metadata dan file terkini yang lolos review. |
| Quality | Checklist dokumen ekspor/domestik per tujuan | Hanya daftar kemungkinan dokumen dari sumber. | Checklist per tujuan. |
| Quality | Klasifikasi UN/IMDG dan dokumen DG per rute | Tidak dipublikasikan. | Klasifikasi dan dokumen yang disetujui. |
| Ordering | Net load produk/kemasan | Dijelaskan tidak tetap; tanpa angka buatan. | Nilai per konfigurasi. |
| Ordering | Term domestik, tujuan, kebijakan minimum, freight | Seluruh kalimat placeholder ditahan. | Kebijakan domestik. |
| Ordering | Validitas quotation, payment terms | Tidak dipublikasikan. | Syarat komersial final. |
| Ordering | Milestone, document release, tracking | Tidak dipublikasikan. | Proses operasional final. |
| Ordering | Lead time dan dokumen wajib spesifik | Tidak dipublikasikan. | Nilai per pesanan/rute. |
| Contact | Attachment types/limit, privacy notice, response commitment, follow-up channel, email, nomor langsung, alamat, jam kantor | Dua route kontak, form, confirmation state, direct contact, dan CTA aktif seluruhnya ditahan. | Tahap kontak terpisah dengan data resmi dan privacy decision. |

Catatan editorial sumber juga dihormati: tidak ada klaim kepemilikan pabrik, kapasitas, mesin, proses/personel produksi, sejarah/klien/rekening manufacturer, inactive grade, harga historis, lead time/berat muatan yang diperdebatkan, superlatif, atau klaim keselamatan yang saling bertentangan.

## Hasil verifikasi

Semua perintah dijalankan dari root proyek.

| Pemeriksaan | Hasil | Status |
| --- | --- | --- |
| `npm ci` | Percobaan sandbox gagal karena akses npm user-level dan timeout; pengulangan dengan izin yang sesuai berhasil: 271 paket, 0 vulnerability. Ada peringatan `allow-scripts` untuk postinstall `esbuild`, tanpa kegagalan install. | **Lulus pada pengulangan final**. |
| `npm run check` | 11 file diperiksa; 0 error, 0 warning, 0 hint. | **Lulus**. |
| `npm run build` | Output/mode `static`; 14 halaman dibangun. | **Lulus**. |
| Lint | `npm run` tidak menampilkan skrip `lint`. | **Tidak tersedia**. |
| Test | `npm run` tidak menampilkan skrip `test`. | **Tidak tersedia**. |
| `rg -n "\[PLACEHOLDER:" dist src` | Tidak ada kecocokan. | **Lulus**. |
| Audit pola kontak/integrasi terlarang pada `src` dan `dist` | Tidak menemukan `mailto:`, `wa.me`, `whatsapp`, Turnstile, Resend, D1, Wrangler, Cloudflare, atau analytics. | **Lulus**. |
| Audit route kontak | Tidak menemukan `/en/contact/` atau `/id/kontak/` di `src`/`dist`. | **Lulus**. |
| Audit route hasil build | 14 HTML sesuai mapping; tidak ada `/`, contact, atau route tambahan. | **Lulus**. |
| Audit tautan internal/fragment | 206 nilai `href` diperiksa; 0 target rusak. | **Lulus**. |
| Audit aset legal/sensitif | Tidak menemukan PDF, DOC/DOCX, XLS/XLSX, ZIP, PEM, KEY, CRT, atau CER di workspace. | **Lulus**. |
| Git | Direktori `.git` ada, tetapi executable `git` tidak tersedia di `PATH`; `git status --short` tidak dapat dijalankan. | **Terhambat oleh environment**. |

Wrapper npm pada perintah non-elevated tetap mencetak peringatan akses ke instalasi npm user-level setelah command, tetapi `check` dan `build` selesai dengan exit code 0. Status di atas mengikuti exit code dan output Astro.

## Bukti manual yang masih perlu diperiksa

1. Buka seluruh 14 route pada `npm run dev` dan periksa hierarki heading, tabel responsif, overflow, header/footer, dan keterbacaan pada mobile/desktop.
2. Uji language switch pada setiap pasangan halaman, terutama dua route detail produk.
3. Uji menu native dan theme control dengan mouse serta keyboard pada light/dark/system theme.
4. Bandingkan copy publik dengan dokumen sumber, terutama angka spesifikasi, istilah perdagangan, nama pelabuhan/kode, dan atribusi manufacturer.
5. Pastikan em dash pada sel abu Super Premium dipahami sebagai nilai yang sengaja tidak dipublikasikan, bukan nilai nol.
6. Konfirmasi keputusan untuk tidak menyediakan root `/`; sitemap sumber hanya menetapkan `/en/` dan `/id/`.

## Risiko, batasan, dan keputusan pending

- Situs belum memiliki halaman root `/`. Ini konsisten dengan route sumber, tetapi konfigurasi hosting atau keputusan produk mungkin kelak memerlukan language negotiation/redirect yang harus diotorisasi terpisah.
- Dua halaman kontak sumber belum tersedia dan CTA komersial hanya berupa prose noninteraktif. Ini disengaja oleh batasan Tahap 3.
- Spesifikasi adalah referensi, bukan kontraktual. Nilai Super Premium ash tetap belum terselesaikan.
- Ketersediaan kombinasi grade-size, net load, konfigurasi kemasan, dokumen terkini, dan term domestik belum dikonfirmasi.
- QA browser visual/interaktif masih manual. Verifikasi saat ini mencakup type check, build, struktur output, pola konten, aset, dan tautan.
- Status Git tidak dapat dibuktikan sampai executable Git tersedia.

## Langkah berikutnya yang direkomendasikan

1. Lakukan QA manual 14 route dan catat hasil per viewport/theme/browser.
2. Putuskan nilai Super Premium ash serta setujui spesifikasi kontraktual dan matriks grade-size.
3. Review dokumen ROA/SHT/MSDS/ISO/Factory Audit dan legalitas secara privat; setujui metadata/atribusi sebelum ada file atau link publik.
4. Tetapkan konfigurasi kemasan, term domestik, net load, payment/timing, dan proses pengiriman yang resmi.
5. Kerjakan kontak/form hanya pada tahap terpisah setelah kanal resmi, privacy notice, attachment policy, dan response commitment disetujui.
6. Pulihkan akses Git lalu jalankan `git status --short` tanpa mengubah worktree.
