# Register aset dan konfirmasi konten

Dokumen ini mencatat foto, logo, dan konten mitra yang boleh masuk ke website.
Aset baru dipublikasikan setelah barisnya berstatus **Approved**.

## Aturan penggunaan

- Hanya foto asli. Gambar AI/stok tidak dipakai sebagai bukti produk, fasilitas, atau tim.
- Foto tim hanya tim Permata Briquettes, dengan nama, jabatan, dan izin publikasi tertulis.
- Materi pabrik manufacturer (termasuk Berkarindo) hanya tampil dengan atribusi dan izin. Website tidak menyatakan Permata memiliki pabrik tersebut.
- Logo laboratorium hanya tampil bila:
  - laboratorium itu menerbitkan laporan untuk produk yang ditawarkan;
  - ketentuan pemakaian logonya mengizinkan.
- Tanpa kedua syarat di atas, nama penerbit cukup ditulis sebagai teks pada kartu dokumen. Tidak ada section "trusted by" atau klaim endorsement.
- Dokumen milik manufacturer tidak disebut sebagai sertifikasi PT Permata Bara Globalindo.

## Daftar aset dan lokasi file

Daftar lengkap aset yang dibutuhkan (nama file, isi foto, rasio, ukuran minimum, tempat pemakaian,
dan syarat publikasi) ada di [asset-checklist.md](asset-checklist.md). Taruh setiap file di
`src/assets/<folder>/` dengan nama persis seperti di daftar itu; tiap folder memiliki `README.md`
berisi tabel slot-nya. Daftar dibuat dari `src/config/media-slots.ts` (`npm run assets:sync`).

Slot yang filenya belum ada tidak menampilkan apa pun, jadi aset boleh masuk bertahap.

## Register

Setiap aset yang diterima dicatat satu baris.

| ID | File asli | Sumber/pemilik | Dasar penggunaan | Objek | Penempatan | Status review |
| --- | --- | --- | --- | --- | --- | --- |
| R01 | `brand/logo-permata-briquettes.png` | Diserahkan pengguna, 2 Okt 2026 | Logo merek sendiri; hak pakai oleh pemilik merek | Lambang (kubus dalam bingkai emas), tanpa tulisan nama | Header, footer, favicon, pratinjau tautan | Tampil. Nama ditulis situs di sebelah lambang. |
| R02 | `team/wahyoe-kurniawan.png, vera-eka-permatasari.png, selvi-febi-safitri.png` | Diserahkan pengguna, 2 Okt 2026 | Foto anggota tim; izin publikasi tertulis belum tercatat | Potret individu (373×669, 9:16), latar transparan | Tentang Kami | Tampil. Bio dari pengguna (EN); terjemahan ID dibuat dari teks itu dan perlu ditinjau. Perlu konfirmasi izin publikasi. |
| R03 | `products/hero-lineup.jpg` | Diserahkan pengguna | Asal foto dan hak pakai belum tercatat | Briket cube di tempurung kelapa, latar putih | Hero halaman Produk; pratinjau tautan beranda | Tampil. Tampak seperti foto stok; konfirmasi hak pakai. |
| R04 | `products/line-shisha.jpg, line-bbq.jpg` | Diserahkan pengguna | Asal foto dan hak pakai belum tercatat | Briket menyala di pemanas hookah; briket silinder di panggangan | line-shisha: hero detail produk. line-bbq: belum dipakai (menunggu lini BBQ) | Tampak seperti foto stok; konfirmasi hak pakai dan bahwa produknya sama dengan yang dijual. |
| R05 | `products/shape-cube.png, shape-cylindrical-finger.png, shape-hexagonal-finger.png, shape-flat-cube.png, shape-dome.png, shape-hexagonal-bbq.png` | Diserahkan pengguna | Render/ilustrasi 3D | Satu briket per bentuk, latar transparan | Galeri bentuk produk | Tampil tanpa label. |
| R06 | `products/shape-dome.png` | Diserahkan pengguna | Asal foto belum tercatat | Tiga briket dome (tampak foto) | Galeri bentuk produk | Tampil tanpa label. Konfirmasi bahwa ini foto produk sebenarnya. |
| R07 | `products/ash-platinum.png, ash-super-premium.png, ash-premium.png` | Diserahkan pengguna | Asal foto belum tercatat | Close-up abu, 200×150 px | Daftar grade (detail produk dan halaman Produk) | Tampil. Resolusi rendah; foto abu per grade menyatakan klaim yang perlu bukti uji. |
| R08 | `packaging/overview.jpg` | Diserahkan pengguna | Asal foto belum tercatat | Kotak terbuka berisi briket berbungkus plastik | Hero halaman Kemasan | Tampil. |
| R09 | `packaging/inner-box.png`, `master-carton.jpg` | Diserahkan pengguna | Pengguna menyatakan seluruh aset aman digunakan (2 Okt 2026) | Inner box dan master carton bermerek CLEAR COCO | Halaman Kemasan, blok "Contoh kemasan" | Tampil. Sempat ditahan karena merek pihak ketiga; dilepas setelah pengguna menyatakan aman. |
| R10 | `packaging/private-label.jpg` | Diserahkan pengguna | Mockup/ilustrasi | Karton polos "CHARCOAL BRIQUETTES cube 25 mm 10 kg" | Halaman Kemasan, blok "Contoh kemasan" | Tampil tanpa label. |
| R11 | `shipping/container-loading.jpeg` | Diserahkan pengguna | Render/ilustrasi bermerek PT Permata Bara Globalindo | Kontainer bertuliskan nama perusahaan di pelabuhan; bukan proses loading | Hero Pemesanan & Pengiriman | Tampil tanpa label (label "Ilustrasi" dihapus atas permintaan pengguna, 2026-10-02). Ganti dengan foto loading nyata bila ada. |
| R12 | `products/hero-background.jpeg` | Diserahkan pengguna, 2 Okt 2026 | Asal belum tercatat | Bongkahan arang mentah di atas kayu, daun palem; tampak buatan AI, 1024×585 | Latar hero beranda | Tampil tanpa label. Bukan briket yang dijual; resolusi rendah. |
| R13 | `documents/hero.jpg` | Diserahkan pengguna, 2 Okt 2026 | Asal belum tercatat | Tiga lembar dokumen pengiriman; teks tampak buatan AI dan memuat nama pihak ketiga | Latar hero Kualitas & Dokumen | Tampil tanpa label. Perlu keputusan pengguna (lihat catatan serah-terima). |
| R14 | `documents/preview-*.jpg` (ROA PT Carsurin 2022, ROA PT Beckjorindo Paryaweksana 2023, SHT PT Carsurin 2022, MSDS SGS Korea 2013, ISO 9001:2015 PT SOA Sertifikasi Indonesia 2024) | Diserahkan pengguna, 2 Okt 2026 | Dokumen manufacturer; nama produsen disensor | Halaman dokumen asli | Pratinjau dokumen, halaman Kualitas & Dokumen | Tampil dengan penerbit dan tanggal sesuai dokumen. ROA Beckjorindo mencantumkan masa berlaku 90 hari. |
| R15 | `brand/office.jpg` | Diserahkan pengguna, 2 Okt 2026 | Foto gedung Spazio Tower | Gedung Spazio Tower, 513×289 | Latar hero Kontak | Tampil. Resolusi rendah untuk latar lebar. |

Pengguna menyatakan seluruh aset yang diserahkan aman digunakan (2 Okt 2026). Foto produk akan diperbarui oleh Pak Wahyoe; aset saat ini dipakai sementara.

Nilai status review: Diterima → Ditinjau → Approved / Ditolak.

## Konfirmasi yang dibutuhkan dari Pak Wahyoe

### Berkarindo (PT Berkat Karbon Indonesia)

1. Bolehkah nama "Berkarindo" ditampilkan? Bila boleh, di mana dan dengan rumusan apa? Kebijakan saat ini: nama manufacturer tidak muncul di website.
2. Lini BBQ yang dipasarkan Permata:
   - nama produk;
   - komposisi (tempurung kelapa saja, atau campuran dengan hardwood);
   - bentuk dan ukuran;
   - kemasan.
3. Spesifikasi referensi BBQ. Situs Berkarindo menulis untuk "Mix": abu 3–4,5%, fixed carbon min. 65%, nilai kalor min. 6000 kcal, kadar air <12%. Apakah angka ini disetujui untuk website Permata?
4. MOQ dan incoterm BBQ. Situs Berkarindo menulis 17 MT per kontainer 20 ft dan FOB. Bagaimana ketentuan versi Permata?
5. Dokumen Berkarindo (ROA, SHT, MSDS, legalitas) yang boleh ditampilkan, beserta tanggal dan cakupannya.
6. Izin tertulis untuk foto fasilitas Berkarindo, dan rumusan atribusinya.

Yang **tidak** diambil dari situs Berkarindo:

- kontak dan rekening bank;
- foto dan nama tim;
- klaim "top manufacturer";
- lama pengalaman (situs Berkarindo sendiri tidak konsisten: 7 tahun, lebih dari 10 tahun, sejak 2012);
- kapasitas produksi;
- jumlah negara ekspor.

### Laboratorium (Beckjorindo, Carsurin, SGS, Sucofindo)

1. Nama resmi tiap laboratorium.
2. Laporan mana yang diterbitkan masing-masing lab: jenis, nomor, tanggal, produk/batch, dan manufacturer.
3. Izin atau ketentuan pemakaian logo.

### Kontak

1. Alamat email bisnis Permata yang terverifikasi untuk CTA.
2. Nomor WhatsApp bisnis Permata (format internasional, contoh `62812…`) dan nama kontak yang menjawab.
