# src/assets/products/

Foto produk: lini produk, bentuk, dan abu hasil pembakaran.

Taruh file di folder ini dengan nama persis seperti di tabel. File ini dibuat otomatis dari
`src/config/media-slots.ts` (`npm run assets:sync`); jangan diedit tangan.

- Format: JPG atau PNG asli, tanpa watermark dan tanpa teks tambahan. Logo: SVG.
- Ukuran: sisi panjang sesuai kolom "Lebar min."; jangan diperkecil atau dikompres sebelum diserahkan.
- Nama file: persis seperti kolom "Nama file", satu ekstensi per aset (jpg, png, webp, avif, atau svg).
- Situs membuat versi AVIF/WebP dan ukuran responsif sendiri saat build.
- Slot yang filenya belum ada tidak menampilkan apa pun; halaman tetap tayang normal.

| Nama file | Prioritas | Isi foto | Rasio | Lebar min. | Dipakai di | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| `hero-lineup` | P1 | Foto utama beranda: briket aneka bentuk tersusun rapi, cahaya baik, latar bersih | 4:3 | 1200 px | Hero beranda |  |
| `hero-background` | P2 | Latar lebar hero beranda (arang dan daun kelapa); bagian atas boleh terang, teks berada di sisi kiri | 16:9 | 1920 px | Latar hero beranda |  |
| `line-shisha` | P1 | Foto produk shisha/hookah (briket cube yang menyala atau close-up produk) | 3:2 | 1100 px | Kartu lini produk, halaman detail produk shisha |  |
| `line-bbq` | P1 | Foto produk briket BBQ (Mix): briket utuh dan saat dipakai memanggang bila ada | 3:2 | 1100 px | Kartu lini produk, halaman detail produk BBQ |  |
| `shape-cube` | P1 | Briket bentuk cube, satu kelompok pada latar polos, dengan penggaris/koin untuk skala bila memungkinkan | 4:3 | 720 px | Galeri bentuk produk |  |
| `shape-finger` | P1 | Briket bentuk finger, latar polos | 4:3 | 720 px | Galeri bentuk produk |  |
| `shape-hexagonal` | P1 | Briket bentuk hexagonal, latar polos | 4:3 | 720 px | Galeri bentuk produk |  |
| `shape-flat` | P1 | Briket bentuk flat/brix, latar polos | 4:3 | 720 px | Galeri bentuk produk |  |
| `shape-dome` | P1 | Briket bentuk dome, latar polos | 4:3 | 720 px | Galeri bentuk produk |  |
| `ash-platinum` | P2 | Close-up abu hasil pembakaran grade Platinum | 4:3 | 600 px | Detail produk, perbandingan grade |  |
| `ash-super-premium` | P2 | Close-up abu hasil pembakaran grade Super Premium | 4:3 | 600 px | Detail produk, perbandingan grade |  |
| `ash-premium` | P2 | Close-up abu hasil pembakaran grade Premium | 4:3 | 600 px | Detail produk, perbandingan grade |  |
