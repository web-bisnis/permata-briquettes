# src/assets/brand/

Logo, ikon, dan gambar pratinjau tautan.

Taruh file di folder ini dengan nama persis seperti di tabel. File ini dibuat otomatis dari
`src/config/media-slots.ts` (`npm run assets:sync`); jangan diedit tangan.

- Format: JPG atau PNG asli, tanpa watermark dan tanpa teks tambahan. Logo: SVG.
- Ukuran: sisi panjang sesuai kolom "Lebar min."; jangan diperkecil atau dikompres sebelum diserahkan.
- Nama file: persis seperti kolom "Nama file", satu ekstensi per aset (jpg, png, webp, avif, atau svg).
- Situs membuat versi AVIF/WebP dan ukuran responsif sendiri saat build.
- Slot yang filenya belum ada tidak menampilkan apa pun; halaman tetap tayang normal.

| Nama file | Prioritas | Isi foto | Rasio | Lebar min. | Dipakai di | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| `logo-permata-briquettes` | P1 | Lambang logo Permata Briquettes, PNG/SVG transparan, terbaca di latar terang dan gelap (nama ditulis situs di sebelahnya) | 4:3 | 300 px | Header dan footer |  |
| `whatsapp` | P2 | Logo WhatsApp resmi (WebP, PNG, atau SVG, latar transparan), persegi | 1:1 | 256 px | Tombol WhatsApp mengambang di semua halaman |  |
| `favicon` | P1 | Ikon persegi dari logo (PNG 512×512 atau SVG) | 1:1 | 256 px | Tab browser |  |
| `og-default` | P1 | Gambar pratinjau tautan (WhatsApp, LinkedIn): logo atau foto produk, komposisi lanskap | 1,91:1 | 1200 px | Pratinjau tautan semua halaman tanpa gambar sendiri |  |
| `office` | P3 | Foto kantor atau gedung Permata di Surabaya (Spazio Tower), lanskap lebar | 16:9 | 1920 px | Hero halaman Kontak |  |
