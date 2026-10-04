# Blog

Folder untuk artikel Blog. Dirender oleh koleksi `blog` (`src/content.config.ts`) di `/en/blog/` dan `/id/blog/`.

## Struktur

- `en/` dan `id/`: satu file Markdown per artikel per bahasa. Nama file yang sama di kedua folder menandai pasangan terjemahan (mis. `en/export-shipping-crunch.md` dan `id/export-shipping-crunch.md`). Nama file memakai huruf kecil dan tanda hubung.
- Gambar disimpan di `src/assets/blog/<nama-file-artikel>/`, satu folder per artikel dan dipakai bersama oleh kedua bahasa.
- Isi artikel dimulai dari `##`; judul halaman (`h1`) berasal dari `title`. Bagian terakhir (`##` terakhir) diperlakukan sebagai daftar referensi dan diberi gaya khusus.

## Frontmatter

| Field | Isi |
| --- | --- |
| `title` | Judul artikel. |
| `description` | Satu atau dua kalimat untuk daftar artikel dan SEO. |
| `date` | Tanggal terbit, `YYYY-MM-DD`. Daftar diurutkan dari yang terbaru. |
| `draft` | Bawaan `true`. Hanya `false` yang terbit. |
| `cover` | Nama file gambar sampul di `src/assets/blog/<nama-file>/`, mis. `cover.jpg` (jpg, jpeg, png, webp, avif). Boleh kosong. |
| `coverAlt` | Teks alternatif sampul, sesuai bahasa file. Wajib bila `cover` diisi. |
| `tags` | Daftar tag. |
| `slug` | Opsional. Segmen URL untuk bahasa itu; bawaannya nama file. Boleh berbeda antar bahasa, harus unik per bahasa. |

Field lain ditolak oleh skema, supaya salah ketik tidak lolos diam-diam.

## Aturan pasangan terjemahan

Build gagal dengan pesan yang menyebut file bermasalah bila:

- sebuah artikel tidak punya pasangan di bahasa lain;
- satu sisi pasangan `draft: false` sedangkan sisi lain `draft: true` (keduanya harus terbit bersamaan);
- `cover` menunjuk file yang tidak ada di `src/assets/blog/<nama-file>/`;
- dua artikel dalam satu bahasa memakai `slug` yang sama.

Aturan ini berlaku juga untuk draft, jadi kesalahan terlihat sebelum artikel diterbitkan.

## Menerbitkan artikel

1. Pastikan file `en/<nama>.md` dan `id/<nama>.md` sudah lengkap dan sumber serta angkanya sudah diperiksa.
2. Letakkan gambar sampul di `src/assets/blog/<nama>/`, lalu isi `cover` dan `coverAlt` di kedua file.
3. Ubah `draft: false` di **kedua** file.
4. Jalankan `npm run build:staging` lalu `npm run audit:staging` (dan `npm test`).

Setelah ada artikel terbit, tautan Blog muncul di menu dan footer, artikel masuk `sitemap.xml`, dan feed `/en/blog/rss.xml` serta `/id/blog/rss.xml` dibuat. Selama belum ada artikel terbit, halaman daftar menampilkan pesan "belum ada artikel", tautan Blog tidak ada di menu, dan feed tidak dibuat. Untuk menampilkan tautan Blog lebih awal, ubah `BLOG_NAV_ALWAYS` di `src/config/blog.ts`.

Draft tidak pernah masuk build, sitemap, feed, atau daftar.

## Meninjau draft secara lokal

```
PUBLIC_BLOG_PREVIEW_DRAFTS=true npm run dev
```

(PowerShell: `$env:PUBLIC_BLOG_PREVIEW_DRAFTS="true"; npm run dev`.) Draft tampil dengan lencana "Draf" dan `noindex`. Hanya `npm run dev` yang membaca flag ini; `astro build`, `build:staging`, dan `build:production` mengabaikannya, dan ada tes yang membuktikannya.

## Status artikel saat ini

- `coconut-shell-briquette-export`: terbit (`draft: false`), dengan sampul di `src/assets/blog/coconut-shell-briquette-export/cover.jpeg`. Dipakai untuk menguji halaman Blog dengan satu artikel.

Semua sumber dan angka perlu diperiksa ulang sebelum artikel baru terbit.
