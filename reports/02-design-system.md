# Laporan Tahap 2 — Design System dan Struktur Global

Tanggal implementasi dan verifikasi: 30 September 2026  
Root proyek: `C:\Users\akmal\Documents\PT Web Bisnis Solusi Teknologi\Permata Briquettes`

## Ringkasan hasil

Tahap 2 selesai untuk implementasi dan verifikasi noninteraktif. Proyek tetap memakai Astro + TypeScript dengan output `static`; build menghasilkan satu halaman prerender di `dist/index.html`. Design tokens, font lokal, light/dark theme, skip link, header, navigasi responsif, `main`, footer, dan skeleton halaman generik telah tersedia.

Implementasi publik hanya memakai copy teknis dan generik. Navigasi hanya memuat route beranda `/` yang benar-benar dihasilkan build. Pemeriksaan source dan `dist/` tidak menemukan marker `[PLACEHOLDER:`, route fiktif, copy bisnis hasil asumsi, atau implementasi Tahap 3–8.

Verifikasi browser interaktif belum dapat dinyatakan lulus. Percobaan sebelumnya dihentikan oleh mekanisme keselamatan computer-use karena URL browser aktif tidak dapat dipastikan. Sesuai batasan tugas, otomasi tersebut tidak diulang atau dipaksa; pemeriksaan visual dan interaksi dicatat sebagai verifikasi manual pemilik proyek.

Status Git juga belum dapat diverifikasi. Direktori `.git` ada pada root saat pemeriksaan ini, tetapi executable `git` tidak tersedia di `PATH`; `Get-Command git`, `git --version`, dan `git status --short` gagal karena perintah tidak dikenali. Kondisi repository dan daftar perubahan tidak dilaporkan sebagai lulus.

## File yang dibuat atau diubah

| File | Status | Tujuan |
| --- | --- | --- |
| `src/styles/tokens.css` | Baru | Primitive palette, token tipografi, spacing, radius, lebar konten, breakpoint dokumenter, dan semantic color roles untuk light/dark theme. |
| `src/styles/global.css` | Baru | Font lokal, reset dasar, fokus keyboard, layout responsif, serta styling komponen global yang memakai token. |
| `src/config/navigation.ts` | Baru | Konfigurasi navigasi typed; saat ini hanya berisi route valid `/`. |
| `src/components/ThemeControl.astro` | Baru | Kontrol aksesibel untuk pilihan Sistem/Terang/Gelap dengan JavaScript minimal dan penyimpanan lokal. |
| `src/components/SiteHeader.astro` | Baru | Header semantik dan navigasi responsif berbasis native `<details>`. |
| `src/components/SiteFooter.astro` | Baru | Footer global dengan copy teknis netral. |
| `src/components/PageSkeleton.astro` | Baru | Skeleton halaman generik dengan hierarki `h1`/`h2`, tanpa copy bisnis atau placeholder mentah. |
| `src/layouts/BaseLayout.astro` | Baru | Dokumen HTML global, metadata dasar, skip link, header, `main`, footer, dan bootstrap theme. |
| `src/pages/index.astro` | Diubah | Menggunakan layout dan skeleton baru tanpa menambahkan route atau konten bisnis. |
| `package.json` | Diubah | Menambahkan paket font variable lokal Inter dan Plus Jakarta Sans. |
| `package-lock.json` | Diubah | Mengunci dependency tree termasuk kedua paket font. |
| `reports/02-design-system.md` | Baru | Laporan implementasi dan verifikasi Tahap 2. |

Tidak ada file di `sources/` yang dibuat atau diubah. Tidak ada perubahan pada `src/content/README.md`, `worker/README.md`, konfigurasi Cloudflare, ataupun integrasi tahap lanjut.

## Keputusan teknis dan alasan

- Token dipusatkan di `src/styles/tokens.css` sebagai CSS custom properties agar layout dan komponen memakai satu sumber nilai visual. Token mencakup lima primitive warna yang disetujui, keluarga/ukuran/weight font, spacing, radius, lebar konten, gutter, tinggi header, breakpoint, dan semantic color roles.
- Light theme menjadi nilai dasar; preferensi sistem gelap diterapkan lewat `prefers-color-scheme` ketika atribut manual belum ada. Pilihan eksplisit memakai `data-theme="light"` atau `data-theme="dark"` pada elemen root.
- Kontrol theme menggunakan `<label>` dan `<select>` native. JavaScript hanya membaca/menulis pilihan `light` atau `dark` di `localStorage`; nilai Sistem menghapus override. Semua akses storage dibungkus `try/catch`, sehingga preferensi sistem tetap berfungsi bila storage tidak tersedia.
- Script kecil di `<head>` menerapkan pilihan tersimpan sebelum render CSS untuk mengurangi kilatan theme yang salah. Tidak ada request jaringan atau layanan eksternal.
- `@fontsource-variable/inter` dan `@fontsource-variable/plus-jakarta-sans` dipakai agar font dibundel oleh Astro/Vite. Inter diterapkan pada body dan Plus Jakarta Sans pada heading/identitas header.
- Menu mobile memakai elemen native `<details>`/`<summary>`, sehingga buka/tutup dapat dioperasikan dengan keyboard tanpa JavaScript menu khusus. Pada viewport mulai `48rem`, panel navigasi dirender sebagai baris desktop.
- Konfigurasi navigasi memakai interface TypeScript dan `satisfies`; hanya `{ label: "Beranda", href: "/" }` yang dirender karena hanya route tersebut yang tersedia.
- Skeleton berisi bahasa teknis netral untuk membuktikan hierarki dan komposisi layout. Blok visual diberi `aria-hidden="true"` agar tidak menjadi noise bagi teknologi bantu.
- Output tetap prerender dan tidak memakai Astro island. JavaScript yang ada hanya kontrol theme; tidak ada fitur data atau integrasi server.

## Hasil verifikasi

Semua perintah dijalankan dari root proyek yang tercantum di atas.

| Pemeriksaan | Hasil nyata | Status |
| --- | --- | --- |
| `npm ci --cache .npm-cache` | 271 paket dipasang dari lockfile; exit code 0. Wrapper npm mencetak peringatan akses ke npm user-level setelah proses selesai. | **Lulus**. |
| `npm run check` | 9 file diperiksa; 0 error, 0 warning, 0 hint; exit code 0. | **Lulus**. |
| `npm run build` | Output/mode `static`; satu route `/index.html` dihasilkan; exit code 0. | **Lulus**. |
| Lint | Tidak ada skrip `lint` pada `package.json`. | **Tidak tersedia / tidak dijalankan**. |
| Test | Tidak ada skrip `test` pada `package.json`. | **Tidak tersedia / tidak dijalankan**. |
| `Get-Command git` | `CommandNotFoundException`: `git` tidak dikenali sebagai cmdlet, function, script, atau executable. | **Terhambat**. |
| `git --version` | Gagal dengan alasan yang sama; versi Git tidak dapat dibaca. | **Terhambat**. |
| `git status --short` | Gagal dengan alasan yang sama. Direktori `.git` terdeteksi, tetapi status/validitas worktree tidak dapat diperiksa tanpa executable Git. | **Terhambat**, bukan lulus. |

### Audit output dan batasan

| Audit | Bukti | Status |
| --- | --- | --- |
| HTML prerender | `dist/index.html` tersedia, berukuran 2.772 byte, memiliki doctype HTML (case-insensitive), `lang="id"`, metadata, dan tidak memuat `astro-island`. | **Lulus**. |
| Route hasil build | Hanya `dist/index.html`, setara dengan route `/`. | **Lulus** — tidak ada route fiktif. |
| Tautan internal | Tiga nilai `href` ditemukan: `/`, `/_astro/index.BjWmjXjE.css`, dan `#main-content`; route, aset, serta target fragment semuanya tersedia. Broken `href`: 0. | **Lulus**. |
| Placeholder mentah | `rg` pada `src/` dan `dist/` tidak menemukan `[PLACEHOLDER:`. | **Lulus**. |
| Copy bisnis hasil asumsi | Pencarian identitas bisnis, produk, perusahaan, kontak, harga, dan messaging pada source publik serta HTML build tidak menemukan kecocokan. | **Lulus**. |
| Ruang lingkup Tahap 3–8 | Pencarian pada implementasi tidak menemukan Turnstile, Resend, Cloudflare, analytics, inquiry, WhatsApp, `mailto:`, `content.config`, Wrangler, atau D1. | **Lulus**. |
| Palet warna source | Literal hex hanya `#1E1E1E`, `#EFEFE8`, `#62735A`, `#2A2A2A`, dan `#FFFFFF` (ditulis lowercase dalam CSS). | **Lulus**. |
| Palet warna build | Minifier mempertahankan empat literal dan menyingkat `#FFFFFF` menjadi `#fff`, yang merupakan warna identik; tidak ada warna tambahan. | **Lulus**. |
| Font lokal | Build menghasilkan 10 file `.woff2`. Semua 10 referensi file font pada CSS hasil build memiliki target lokal; subset tambahan dapat di-inline sebagai data URI. Tidak ada URL font eksternal. | **Lulus**. |
| URL runtime eksternal | Tidak ada `http://`, `https://`, Google Fonts, atau import URL eksternal di `dist/`. | **Lulus**. |
| Theme CSS | Terdapat nilai dasar `:root`, default gelap berbasis `prefers-color-scheme`, serta override `data-theme="light"` dan `data-theme="dark"`. | **Lulus secara statis**. |
| Peran font | Source mengimpor kedua paket lokal; body memakai Inter dan seluruh heading memakai Plus Jakarta Sans. | **Lulus secara statis**. |
| Struktur semantik | HTML build memuat skip link, `<header>`, `<nav aria-label="Navigasi utama">`, `<main id="main-content" tabindex="-1">`, `<footer>`, satu `h1`, dan `h2` berikutnya. | **Lulus secara statis**. |
| Kontrol theme | HTML build memuat label `for="theme-select"`, select dengan id yang cocok, serta opsi Sistem/Terang/Gelap. | **Lulus secara statis**. |
| Skip link | `href="#main-content"` cocok dengan target `id="main-content"`; target dapat menerima fokus programatik melalui `tabindex="-1"`. | **Lulus secara statis**. |
| Kontras token utama | Rasio terhitung: light text 14,43:1; light muted 12,43:1; teks aktif putih/hijau 5,10:1; fokus hijau di paper 4,41:1; dark text 14,43:1; dark muted 16,67:1; dark surface text 12,43:1. | **Lulus secara statis** untuk kombinasi yang diterapkan. |

## Bukti manual yang masih perlu diperiksa pemilik proyek

QA browser interaktif berstatus **pending**, bukan lulus. Pemilik proyek perlu menjalankan `npm run dev` dan memeriksa:

1. Pada desktop, header, navigasi, kontrol theme, area utama, skeleton, dan footer tersusun tanpa overflow pada ukuran viewport yang digunakan.
2. Pada viewport mobile, tombol/summary “Menu” dapat dibuka dan ditutup dengan mouse, Enter, dan Space; panel tidak terpotong serta tidak menutup fokus aktif secara membingungkan.
3. Urutan Tab dimulai dari skip link saat fokus, lalu menuju kontrol header/nav secara logis; outline fokus terlihat di kedua theme.
4. Aktivasi skip link memindahkan fokus/viewport ke `main`.
5. Pilihan Sistem mengikuti preferensi OS; Terang dan Gelap menerapkan theme yang benar; pilihan manual bertahan setelah reload; kembali ke Sistem menghapus override.
6. Kedua font benar-benar dirender sebagai Inter untuk body dan Plus Jakarta Sans untuk heading, tanpa request font eksternal pada panel Network.
7. Kontras, keterbacaan, dan ukuran target interaksi terasa memadai pada light dan dark theme.
8. Periksa setidaknya satu browser berbasis Chromium dan satu browser lain yang termasuk target proyek setelah browser matrix ditetapkan.

Otomasi browser tidak diulang karena mekanisme computer-use sebelumnya tidak dapat memastikan URL browser aktif dengan aman. Kondisi ini tidak memengaruhi hasil build, tetapi membatasi bukti visual dan interaksi pada laporan ini.

## Risiko, batasan, dan keputusan pending

- Status repository tidak diketahui meskipun direktori `.git` ada, karena executable Git tidak tersedia. Branch, remote, perubahan tracked/untracked, dan kebersihan worktree belum dapat dibuktikan.
- QA visual, layout aktual, persistence theme di browser, fokus keyboard, perilaku `<details>`, serta rendering font belum diverifikasi secara interaktif.
- Breakpoint disimpan sebagai token dokumenter `--breakpoint-navigation: 48rem`, sementara media query memakai literal `48rem` karena CSS custom properties tidak dapat dipakai secara portabel sebagai kondisi media query tanpa tooling tambahan.
- Paket Fontsource membawa subset bahasa yang kemudian dipilih, dipisah, atau di-inline oleh bundler. Ini aman untuk runtime lokal, tetapi ukuran/font-subsetting dapat dioptimalkan pada tahap performance yang memang terpisah.
- Copy kanonis, daftar route konten, aset merek, dan kebutuhan bisnis tetap belum menjadi bagian Tahap 2. Skeleton sengaja tidak menentukan struktur konten final.
- Wrapper npm terus mencetak peringatan akses terhadap instalasi npm user-level, walaupun seluruh perintah wajib npm selesai dengan exit code 0.

## Bukti tidak ada pekerjaan Tahap 3–8

- `src/content/` tetap hanya memiliki README fondasi; tidak ada Content Collections aktif, schema, atau entri konten.
- Tidak ada route selain `/` dan tidak ada halaman konten final.
- Tidak ada form, endpoint inquiry, Worker implementation, Turnstile, D1, Resend, analytics, sitemap/SEO lanjutan, konfigurasi Cloudflare, atau deployment.
- Dependency runtime baru hanya dua paket font lokal; dependency Astro/TypeScript Tahap 1 tetap dipertahankan.
- Tidak ada kontak, legal, produk, klaim perusahaan, atau CTA bisnis yang dibuat.

## Langkah berikutnya yang direkomendasikan

1. Lakukan checklist QA browser manual di atas dan catat browser, viewport, preferensi theme OS, serta hasil setiap interaksi.
2. Pulihkan akses executable Git atau jalankan pemeriksaan Git dari environment yang memilikinya, kemudian verifikasi `git --version`, `git status --short`, branch, dan remote tanpa mengubah repository.
3. Jangan memulai Tahap 3 sebelum dokumen copy kanonis, mapping route, dan keputusan konten tersedia serta disetujui.

