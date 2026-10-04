# src/assets/shipping/

Foto proses pengiriman.

Taruh file di folder ini dengan nama persis seperti di tabel. File ini dibuat otomatis dari
`src/config/media-slots.ts` (`npm run assets:sync`); jangan diedit tangan.

- Format: JPG atau PNG asli, tanpa watermark dan tanpa teks tambahan. Logo: SVG.
- Ukuran: sisi panjang sesuai kolom "Lebar min."; jangan diperkecil atau dikompres sebelum diserahkan.
- Nama file: persis seperti kolom "Nama file", satu ekstensi per aset (jpg, png, webp, avif, atau svg).
- Situs membuat versi AVIF/WebP dan ukuran responsif sendiri saat build.
- Slot yang filenya belum ada tidak menampilkan apa pun; halaman tetap tayang normal.

| Nama file | Prioritas | Isi foto | Rasio | Lebar min. | Dipakai di | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| `container-loading` | P2 | Foto proses stuffing/loading briket ke kontainer 20 ft | 3:2 | 1100 px | Halaman Pemesanan & Pengiriman |  |
| `world-map` | P2 | Peta dunia datar (SVG, tanpa teks tertanam) dengan Indonesia dan wilayah tujuan ditandai, lisensi yang jelas | 16:9 | 1600 px | Halaman Pemesanan & Pengiriman, perkiraan durasi pengiriman | Syarat: Sumber dan lisensi peta diketahui; wilayah yang ditandai sesuai tabel durasi. |
