# src/assets/team/

Foto anggota tim Permata Briquettes (satu file per orang, nama file = nama-anggota).

Taruh file di folder ini dengan nama persis seperti di tabel. File ini dibuat otomatis dari
`src/config/media-slots.ts` (`npm run assets:sync`); jangan diedit tangan.

- Format: JPG atau PNG asli, tanpa watermark dan tanpa teks tambahan. Logo: SVG.
- Ukuran: sisi panjang sesuai kolom "Lebar min."; jangan diperkecil atau dikompres sebelum diserahkan.
- Nama file: persis seperti kolom "Nama file", satu ekstensi per aset (jpg, png, webp, avif, atau svg).
- Situs membuat versi AVIF/WebP dan ukuran responsif sendiri saat build.
- Slot yang filenya belum ada tidak menampilkan apa pun; halaman tetap tayang normal.

| Nama file | Prioritas | Isi foto | Rasio | Lebar min. | Dipakai di | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| `group` | P2 | Foto bersama ketiga anggota tim, lanskap lebar, ruang lega di sisi kiri untuk teks judul | 16:9 | 1920 px | Hero halaman Tentang Kami | Syarat: Izin publikasi dari seluruh anggota tim. |

Foto anggota tim tidak punya slot tetap. Tiap orang didaftarkan di `src/content/team/<bahasa>/<nama>.yaml`
(field `photo: team/<nama-file>`), dengan nama, jabatan, dan bio. Rasio asli 9:16 boleh; kartu menampilkan
bagian atas foto (rasio 4:5).
