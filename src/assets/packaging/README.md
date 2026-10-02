# src/assets/packaging/

Foto kemasan.

Taruh file di folder ini dengan nama persis seperti di tabel. File ini dibuat otomatis dari
`src/config/media-slots.ts` (`npm run assets:sync`); jangan diedit tangan.

- Format: JPG atau PNG asli, tanpa watermark dan tanpa teks tambahan. Logo: SVG.
- Ukuran: sisi panjang sesuai kolom "Lebar min."; jangan diperkecil atau dikompres sebelum diserahkan.
- Nama file: persis seperti kolom "Nama file", satu ekstensi per aset (jpg, png, webp, avif, atau svg).
- Situs membuat versi AVIF/WebP dan ukuran responsif sendiri saat build.
- Slot yang filenya belum ada tidak menampilkan apa pun; halaman tetap tayang normal.

| Nama file | Prioritas | Isi foto | Rasio | Lebar min. | Dipakai di | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| `overview` | P1 | Semua jenis kemasan dalam satu foto: bulk, inner box, master carton | 4:3 | 1200 px | Hero halaman Kemasan |  |
| `inner-box` | P1 | Inner box produk (bagian luar dan isi) | 4:3 | 900 px | Halaman Kemasan |  |
| `master-carton` | P1 | Master carton 10 kg atau 20 kg (tampak luar, label terbaca) | 4:3 | 900 px | Halaman Kemasan |  |
| `private-label` | P1 | Contoh kemasan dengan merek pelanggan (private label) yang sudah pernah diproduksi | 4:3 | 900 px | Halaman Kemasan |  |
