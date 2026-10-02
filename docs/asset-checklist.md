# Daftar aset yang dibutuhkan

Dibuat otomatis dari `src/config/media-slots.ts` (`npm run assets:sync`).
Taruh setiap file di folder `src/assets/<folder>/` dengan nama persis seperti di tabel.

- Format: JPG atau PNG asli, tanpa watermark dan tanpa teks tambahan. Logo: SVG.
- Ukuran: sisi panjang sesuai kolom "Lebar min."; jangan diperkecil atau dikompres sebelum diserahkan.
- Nama file: persis seperti kolom "Nama file", satu ekstensi per aset (jpg, png, webp, avif, atau svg).
- Situs membuat versi AVIF/WebP dan ukuran responsif sendiri saat build.
- Slot yang filenya belum ada tidak menampilkan apa pun; halaman tetap tayang normal.
- Setiap foto yang diserahkan dicatat di `docs/asset-register.md` (sumber, izin, caption, alt text).

## P1

| Folder | Nama file | Isi foto | Rasio | Lebar min. | Dipakai di | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| `brand/` | `logo-permata-briquettes` | Lambang logo Permata Briquettes, PNG/SVG transparan, terbaca di latar terang dan gelap (nama ditulis situs di sebelahnya) | 4:3 | 300 px | Header dan footer |  |
| `brand/` | `favicon` | Ikon persegi dari logo (PNG 512×512 atau SVG) | 1:1 | 256 px | Tab browser |  |
| `brand/` | `og-default` | Gambar pratinjau tautan (WhatsApp, LinkedIn): logo atau foto produk, komposisi lanskap | 1,91:1 | 1200 px | Pratinjau tautan semua halaman tanpa gambar sendiri |  |
| `products/` | `hero-lineup` | Foto utama beranda: briket aneka bentuk tersusun rapi, cahaya baik, latar bersih | 4:3 | 1200 px | Hero beranda |  |
| `products/` | `line-shisha` | Foto produk shisha/hookah (briket cube yang menyala atau close-up produk) | 3:2 | 1100 px | Kartu lini produk, halaman detail produk shisha |  |
| `products/` | `line-bbq` | Foto produk briket BBQ (Mix): briket utuh dan saat dipakai memanggang bila ada | 3:2 | 1100 px | Kartu lini produk, halaman detail produk BBQ |  |
| `products/` | `shape-cube` | Briket bentuk cube, satu kelompok pada latar polos, dengan penggaris/koin untuk skala bila memungkinkan | 4:3 | 720 px | Galeri bentuk produk |  |
| `products/` | `shape-finger` | Briket bentuk finger, latar polos | 4:3 | 720 px | Galeri bentuk produk |  |
| `products/` | `shape-hexagonal` | Briket bentuk hexagonal, latar polos | 4:3 | 720 px | Galeri bentuk produk |  |
| `products/` | `shape-flat` | Briket bentuk flat/brix, latar polos | 4:3 | 720 px | Galeri bentuk produk |  |
| `products/` | `shape-dome` | Briket bentuk dome, latar polos | 4:3 | 720 px | Galeri bentuk produk |  |
| `packaging/` | `overview` | Semua jenis kemasan dalam satu foto: bulk, inner box, master carton | 4:3 | 1200 px | Hero halaman Kemasan |  |
| `packaging/` | `inner-box` | Inner box produk (bagian luar dan isi) | 4:3 | 900 px | Halaman Kemasan |  |
| `packaging/` | `master-carton` | Master carton 10 kg atau 20 kg (tampak luar, label terbaca) | 4:3 | 900 px | Halaman Kemasan |  |
| `packaging/` | `private-label` | Contoh kemasan dengan merek pelanggan (private label) yang sudah pernah diproduksi | 4:3 | 900 px | Halaman Kemasan |  |

## P2

| Folder | Nama file | Isi foto | Rasio | Lebar min. | Dipakai di | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| `brand/` | `whatsapp` | Logo WhatsApp resmi (WebP, PNG, atau SVG, latar transparan), persegi | 1:1 | 256 px | Tombol WhatsApp mengambang di semua halaman |  |
| `team/` | `group` | Foto bersama ketiga anggota tim, lanskap lebar, ruang lega di sisi kiri untuk teks judul | 16:9 | 1920 px | Hero halaman Tentang Kami | Syarat: Izin publikasi dari seluruh anggota tim. |
| `products/` | `hero-background` | Latar lebar hero beranda (arang dan daun kelapa); bagian atas boleh terang, teks berada di sisi kiri | 16:9 | 1920 px | Latar hero beranda |  |
| `products/` | `ash-platinum` | Close-up abu hasil pembakaran grade Platinum | 4:3 | 600 px | Detail produk, perbandingan grade |  |
| `products/` | `ash-super-premium` | Close-up abu hasil pembakaran grade Super Premium | 4:3 | 600 px | Detail produk, perbandingan grade |  |
| `products/` | `ash-premium` | Close-up abu hasil pembakaran grade Premium | 4:3 | 600 px | Detail produk, perbandingan grade |  |
| `documents/` | `preview-roa-carsurin` | Report of Analysis dari PT Carsurin (29 Agustus 2022), data produsen disensor | 4:5 | 800 px | Pratinjau dokumen, halaman Kualitas & Dokumen | Syarat: Dokumen disetujui untuk publik; penerbit, tanggal, dan batch tercatat. |
| `documents/` | `preview-roa-beckjorindo` | Certificate of Analysis dari PT Beckjorindo Paryaweksana (14 Oktober 2023), data pengirim disensor | 4:5 | 800 px | Pratinjau dokumen, halaman Kualitas & Dokumen | Syarat: Dokumen disetujui untuk publik; penerbit, tanggal, dan batch tercatat. |
| `documents/` | `preview-sht-carsurin` | Self-Heating Test dari PT Carsurin (31 Mei 2022), halaman 2 | 4:5 | 800 px | Pratinjau dokumen, halaman Kualitas & Dokumen | Syarat: Dokumen disetujui untuk publik; penerbit, tanggal, dan batch tercatat. |
| `documents/` | `preview-msds-sgs` | MSDS Report dari SGS Korea Co., Ltd. (19 Desember 2013), data penerima disensor | 4:5 | 800 px | Pratinjau dokumen, halaman Kualitas & Dokumen | Syarat: Dokumen disetujui untuk publik. |
| `documents/` | `preview-iso` | Sertifikat ISO 9001:2015 manufacturer | 4:5 | 1000 px | Kartu dokumen | Syarat: Cakupan dan masa berlaku diketahui; dokumen disetujui untuk publik. |
| `documents/` | `preview-factory-audit` | Halaman pertama laporan Factory Audit manufacturer | 4:5 | 1000 px | Kartu dokumen | Syarat: Penerbit, tanggal, dan cakupan diketahui; dokumen disetujui untuk publik. |
| `shipping/` | `container-loading` | Foto proses stuffing/loading briket ke kontainer 20 ft | 3:2 | 1100 px | Halaman Pemesanan & Pengiriman |  |
| `labs/` | `carsurin` | Logo resmi Carsurin dari pemiliknya, tanpa diubah warna atau bentuknya (SVG, atau PNG transparan) | 3:2 | 400 px | Bagian laboratorium dan surveyor (Beranda, Kualitas & Dokumen) | Syarat: Izin atau ketentuan penggunaan logo dari Carsurin dipenuhi; rumusan tidak menyiratkan sertifikasi atau dukungan terhadap Permata Briquettes. |
| `labs/` | `beckjorindo` | Logo resmi Beckjorindo dari pemiliknya, tanpa diubah warna atau bentuknya (SVG, atau PNG transparan) | 3:2 | 400 px | Bagian laboratorium dan surveyor (Beranda, Kualitas & Dokumen) | Syarat: Izin atau ketentuan penggunaan logo dari Beckjorindo dipenuhi; rumusan tidak menyiratkan sertifikasi atau dukungan terhadap Permata Briquettes. |
| `labs/` | `sgs` | Logo resmi SGS dari pemiliknya, tanpa diubah warna atau bentuknya (SVG, atau PNG transparan) | 3:2 | 400 px | Bagian laboratorium dan surveyor (Beranda, Kualitas & Dokumen) | Syarat: Izin atau ketentuan penggunaan logo dari SGS dipenuhi; rumusan tidak menyiratkan sertifikasi atau dukungan terhadap Permata Briquettes. |
| `labs/` | `sucofindo` | Logo resmi Sucofindo dari pemiliknya, tanpa diubah warna atau bentuknya (SVG, atau PNG transparan) | 3:2 | 400 px | Bagian laboratorium dan surveyor (Beranda, Kualitas & Dokumen) | Syarat: Izin atau ketentuan penggunaan logo dari Sucofindo dipenuhi; rumusan tidak menyiratkan sertifikasi atau dukungan terhadap Permata Briquettes. |

## P3 (menunggu izin)

| Folder | Nama file | Isi foto | Rasio | Lebar min. | Dipakai di | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| `documents/` | `hero` | Foto pemeriksaan mutu atau tumpukan dokumen asli (sampel briket, alat uji, laporan), lanskap lebar | 16:9 | 1920 px | Hero halaman Kualitas & Dokumen | Syarat: Foto milik Permata, atau milik manufacturer dengan izin tertulis dan atribusi yang disetujui. |
| `brand/` | `office` | Foto kantor atau gedung Permata di Surabaya (Spazio Tower), lanskap lebar | 16:9 | 1920 px | Hero halaman Kontak |  |
| `partners/` | `berkarindo-facility` | Foto fasilitas Berkarindo (bukan foto tim) | 3:2 | 1100 px | Seksi mitra produksi (ditunda) | Syarat: Izin tertulis dari Berkarindo dan rumusan atribusi yang disetujui. |
