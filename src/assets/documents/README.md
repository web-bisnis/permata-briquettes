# src/assets/documents/

Pratinjau dokumen (ROA, SHT, MSDS, ISO).

Taruh file di folder ini dengan nama persis seperti di tabel. File ini dibuat otomatis dari
`src/config/media-slots.ts` (`npm run assets:sync`); jangan diedit tangan.

- Format: JPG atau PNG asli, tanpa watermark dan tanpa teks tambahan. Logo: SVG.
- Ukuran: sisi panjang sesuai kolom "Lebar min."; jangan diperkecil atau dikompres sebelum diserahkan.
- Nama file: persis seperti kolom "Nama file", satu ekstensi per aset (jpg, png, webp, avif, atau svg).
- Situs membuat versi AVIF/WebP dan ukuran responsif sendiri saat build.
- Slot yang filenya belum ada tidak menampilkan apa pun; halaman tetap tayang normal.

| Nama file | Prioritas | Isi foto | Rasio | Lebar min. | Dipakai di | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| `hero` | P3 | Foto pemeriksaan mutu atau tumpukan dokumen asli (sampel briket, alat uji, laporan), lanskap lebar | 16:9 | 1920 px | Hero halaman Kualitas & Dokumen | Syarat: Foto milik Permata, atau milik manufacturer dengan izin tertulis dan atribusi yang disetujui. |
| `preview-roa-carsurin` | P2 | Report of Analysis dari PT Carsurin (29 Agustus 2022), data produsen disensor | 4:5 | 800 px | Pratinjau dokumen, halaman Kualitas & Dokumen | Syarat: Dokumen disetujui untuk publik; penerbit, tanggal, dan batch tercatat. |
| `preview-roa-beckjorindo` | P2 | Certificate of Analysis dari PT Beckjorindo Paryaweksana (14 Oktober 2023), data pengirim disensor | 4:5 | 800 px | Pratinjau dokumen, halaman Kualitas & Dokumen | Syarat: Dokumen disetujui untuk publik; penerbit, tanggal, dan batch tercatat. |
| `preview-sht-carsurin` | P2 | Self-Heating Test dari PT Carsurin (31 Mei 2022), halaman 2 | 4:5 | 800 px | Pratinjau dokumen, halaman Kualitas & Dokumen | Syarat: Dokumen disetujui untuk publik; penerbit, tanggal, dan batch tercatat. |
| `preview-msds-sgs` | P2 | MSDS Report dari SGS Korea Co., Ltd. (19 Desember 2013), data penerima disensor | 4:5 | 800 px | Pratinjau dokumen, halaman Kualitas & Dokumen | Syarat: Dokumen disetujui untuk publik. |
| `preview-sk-kemenkum` | P2 | Keputusan Menteri Hukum RI tentang Pengesahan Pendirian Badan Hukum PT Permata Bara Globalindo (8 September 2026) | 4:5 | 500 px | Pratinjau dokumen, halaman Tentang Kami dan Kualitas & Dokumen | Syarat: Dokumen disetujui untuk publik. |
| `preview-nib` | P2 | Perizinan Berusaha Berbasis Risiko (NIB) PT Permata Bara Globalindo (20 September 2026) | 4:5 | 500 px | Pratinjau dokumen, halaman Tentang Kami dan Kualitas & Dokumen | Syarat: Dokumen disetujui untuk publik. |
| `preview-npwp` | P2 | Kartu NPWP PT Permata Bara Globalindo (terdaftar 10 September 2026) | 4:5 | 500 px | Pratinjau dokumen, halaman Tentang Kami dan Kualitas & Dokumen | Syarat: Dokumen disetujui untuk publik. |
