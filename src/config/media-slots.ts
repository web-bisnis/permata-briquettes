export const SITE_LOCALES_FOR_MEDIA = ["en", "id"] as const;
export type MediaLocale = (typeof SITE_LOCALES_FOR_MEDIA)[number];

/** The logo mark; its file name is the one supplied for the brand. */
export const LOGO_ID = "brand/logo-permata-briquettes";

export const MEDIA_FOLDERS = [
  "brand",
  "products",
  "packaging",
  "team",
  "documents",
  "shipping",
  "partners",
  "labs",
] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export type MediaPriority = "P1" | "P2" | "P3";
export type MediaAspect = "16/9" | "3/2" | "4/3" | "1/1" | "4/5" | "9/16" | "1.91/1";

export interface MediaSlot {
  /** `<folder>/<file>`; the image lives at src/assets/<id>.<extension>. */
  id: string;
  priority: MediaPriority;
  /** What the file must show, in Indonesian, for the asset checklist. */
  subject: string;
  aspect: MediaAspect;
  /** Minimum width in pixels of the original file. */
  minWidth: number;
  usedOn: string;
  /** Alt text is provisional until it has been checked against the real photo. */
  alt: Record<MediaLocale, string>;
  caption?: Record<MediaLocale, string>;
  /** The asset must not be published until this condition is met. */
  gate?: string;
  /**
   * A file has been supplied but must not be published yet. While this is set the slot
   * resolves to nothing, so pages render as if the file were absent. Delete the line to release it.
   */
  hold?: string;
}

function slot(definition: MediaSlot): MediaSlot {
  return definition;
}

export const MEDIA_SLOTS: readonly MediaSlot[] = [
  slot({
    id: LOGO_ID,
    priority: "P1",
    subject: "Lambang logo Permata Briquettes, PNG/SVG transparan, terbaca di latar terang dan gelap (nama ditulis situs di sebelahnya)",
    aspect: "4/3",
    minWidth: 300,
    usedOn: "Header dan footer",
    alt: { en: "Permata Briquettes logo", id: "Logo Permata Briquettes" },
  }),
  slot({
    id: "brand/whatsapp",
    priority: "P2",
    subject: "Logo WhatsApp resmi (WebP, PNG, atau SVG, latar transparan), persegi",
    aspect: "1/1",
    minWidth: 256,
    usedOn: "Tombol WhatsApp mengambang di semua halaman",
    alt: { en: "WhatsApp", id: "WhatsApp" },
  }),
  slot({
    id: "brand/favicon",
    priority: "P1",
    subject: "Ikon persegi dari logo (PNG 512×512 atau SVG)",
    aspect: "1/1",
    minWidth: 256,
    usedOn: "Tab browser",
    alt: { en: "Permata Briquettes icon", id: "Ikon Permata Briquettes" },
  }),
  slot({
    id: "brand/og-default",
    priority: "P1",
    subject: "Gambar pratinjau tautan (WhatsApp, LinkedIn): logo atau foto produk, komposisi lanskap",
    aspect: "1.91/1",
    minWidth: 1200,
    usedOn: "Pratinjau tautan semua halaman tanpa gambar sendiri",
    alt: {
      en: "Permata Briquettes coconut charcoal briquettes",
      id: "Briket arang tempurung kelapa Permata Briquettes",
    },
  }),
  slot({
    id: "team/group",
    priority: "P2",
    subject: "Foto bersama ketiga anggota tim, lanskap lebar, ruang lega di sisi kiri untuk teks judul",
    aspect: "16/9",
    minWidth: 1920,
    usedOn: "Hero halaman Tentang Kami",
    gate: "Izin publikasi dari seluruh anggota tim.",
    alt: { en: "The Permata Briquettes team", id: "Tim Permata Briquettes" },
  }),
  slot({
    id: "documents/hero",
    priority: "P3",
    subject: "Foto pemeriksaan mutu atau tumpukan dokumen asli (sampel briket, alat uji, laporan), lanskap lebar",
    aspect: "16/9",
    minWidth: 1920,
    usedOn: "Hero halaman Kualitas & Dokumen",
    gate: "Foto milik Permata, atau milik manufacturer dengan izin tertulis dan atribusi yang disetujui.",
    alt: {
      en: "Quality inspection of coconut charcoal briquettes",
      id: "Pemeriksaan mutu briket arang tempurung kelapa",
    },
  }),
  slot({
    id: "brand/office",
    priority: "P3",
    subject: "Foto kantor atau gedung Permata di Surabaya (Spazio Tower), lanskap lebar",
    aspect: "16/9",
    minWidth: 1920,
    usedOn: "Hero halaman Kontak",
    alt: { en: "The Permata Briquettes office in Surabaya", id: "Kantor Permata Briquettes di Surabaya" },
  }),
  slot({
    id: "products/hero-lineup",
    priority: "P1",
    subject: "Foto utama beranda: briket aneka bentuk tersusun rapi, cahaya baik, latar bersih",
    aspect: "4/3",
    minWidth: 1200,
    usedOn: "Hero beranda",
    alt: {
      en: "Coconut charcoal briquettes in several shapes",
      id: "Briket arang tempurung kelapa dalam beberapa bentuk",
    },
  }),
  slot({
    id: "products/hero-background",
    priority: "P2",
    subject: "Latar lebar hero beranda (arang dan daun kelapa); bagian atas boleh terang, teks berada di sisi kiri",
    aspect: "16/9",
    minWidth: 1920,
    usedOn: "Latar hero beranda",
    alt: {
      en: "Charcoal pieces on a wooden surface in front of palm leaves",
      id: "Potongan arang di atas permukaan kayu di depan daun palem",
    },
  }),
  slot({
    id: "products/line-shisha",
    priority: "P1",
    subject: "Foto produk shisha/hookah (briket cube yang menyala atau close-up produk)",
    aspect: "3/2",
    minWidth: 1100,
    usedOn: "Kartu lini produk, halaman detail produk shisha",
    alt: {
      en: "Coconut charcoal briquettes for shisha and hookah",
      id: "Briket arang tempurung kelapa untuk shisha dan hookah",
    },
  }),
  slot({
    id: "products/line-bbq",
    priority: "P1",
    subject: "Foto produk briket BBQ (Mix): briket utuh dan saat dipakai memanggang bila ada",
    aspect: "3/2",
    minWidth: 1100,
    usedOn: "Kartu lini produk, halaman detail produk BBQ",
    alt: {
      en: "Coconut charcoal briquettes for barbecue",
      id: "Briket arang kelapa untuk barbecue",
    },
  }),
  slot({
    id: "products/shape-cube",
    priority: "P1",
    subject: "Briket bentuk cube, satu kelompok pada latar polos, dengan penggaris/koin untuk skala bila memungkinkan",
    aspect: "4/3",
    minWidth: 720,
    usedOn: "Galeri bentuk produk",
    alt: { en: "A cube-shaped briquette", id: "Briket berbentuk cube" },
  }),
  slot({
    id: "products/shape-finger",
    priority: "P1",
    subject: "Briket bentuk finger, latar polos",
    aspect: "4/3",
    minWidth: 720,
    usedOn: "Galeri bentuk produk",
    alt: { en: "A finger-shaped briquette", id: "Briket berbentuk finger" },
  }),
  slot({
    id: "products/shape-hexagonal",
    priority: "P1",
    subject: "Briket bentuk hexagonal, latar polos",
    aspect: "4/3",
    minWidth: 720,
    usedOn: "Galeri bentuk produk",
    alt: { en: "A hexagonal briquette", id: "Briket berbentuk hexagonal" },
  }),
  slot({
    id: "products/shape-flat",
    priority: "P1",
    subject: "Briket bentuk flat/brix, latar polos",
    aspect: "4/3",
    minWidth: 720,
    usedOn: "Galeri bentuk produk",
    alt: { en: "A flat briquette", id: "Briket berbentuk flat" },
  }),
  slot({
    id: "products/shape-dome",
    priority: "P1",
    subject: "Briket bentuk dome, latar polos",
    aspect: "4/3",
    minWidth: 720,
    usedOn: "Galeri bentuk produk",
    alt: { en: "Dome-shaped briquettes", id: "Briket berbentuk dome" },
  }),
  slot({
    id: "products/ash-platinum",
    priority: "P2",
    subject: "Close-up abu hasil pembakaran grade Platinum",
    aspect: "4/3",
    minWidth: 600,
    usedOn: "Detail produk, perbandingan grade",
    alt: { en: "Platinum grade ash after burning", id: "Abu grade Platinum setelah pembakaran" },
  }),
  slot({
    id: "products/ash-super-premium",
    priority: "P2",
    subject: "Close-up abu hasil pembakaran grade Super Premium",
    aspect: "4/3",
    minWidth: 600,
    usedOn: "Detail produk, perbandingan grade",
    alt: {
      en: "Super Premium grade ash after burning",
      id: "Abu grade Super Premium setelah pembakaran",
    },
  }),
  slot({
    id: "products/ash-premium",
    priority: "P2",
    subject: "Close-up abu hasil pembakaran grade Premium",
    aspect: "4/3",
    minWidth: 600,
    usedOn: "Detail produk, perbandingan grade",
    alt: { en: "Premium grade ash after burning", id: "Abu grade Premium setelah pembakaran" },
  }),
  slot({
    id: "packaging/overview",
    priority: "P1",
    subject: "Semua jenis kemasan dalam satu foto: bulk, inner box, master carton",
    aspect: "4/3",
    minWidth: 1200,
    usedOn: "Hero halaman Kemasan",
    alt: { en: "Packaging options for the briquettes", id: "Pilihan kemasan briket" },
  }),
  slot({
    id: "packaging/inner-box",
    priority: "P1",
    subject: "Inner box produk (bagian luar dan isi)",
    aspect: "4/3",
    minWidth: 900,
    usedOn: "Halaman Kemasan",
    alt: { en: "Inner box of briquettes", id: "Inner box berisi briket" },
    caption: { en: "Inner box", id: "Inner box" },
  }),
  slot({
    id: "packaging/master-carton",
    priority: "P1",
    subject: "Master carton 10 kg atau 20 kg (tampak luar, label terbaca)",
    aspect: "4/3",
    minWidth: 900,
    usedOn: "Halaman Kemasan",
    alt: { en: "Master carton", id: "Master carton" },
    caption: { en: "Master carton", id: "Master carton" },
  }),
  slot({
    id: "packaging/private-label",
    priority: "P1",
    subject: "Contoh kemasan dengan merek pelanggan (private label) yang sudah pernah diproduksi",
    aspect: "4/3",
    minWidth: 900,
    usedOn: "Halaman Kemasan",
    alt: {
      en: "A private label carton",
      id: "Karton merek pelanggan (private label)",
    },
    caption: {
      en: "Private label carton example",
      id: "Contoh karton private label",
    },
  }),
  slot({
    id: "documents/preview-roa-carsurin",
    priority: "P2",
    subject: "Report of Analysis dari PT Carsurin (29 Agustus 2022), data produsen disensor",
    aspect: "4/5",
    minWidth: 800,
    usedOn: "Pratinjau dokumen, halaman Kualitas & Dokumen",
    alt: {
      en: "Report of Analysis issued by PT Carsurin, dated 29 August 2022",
      id: "Report of Analysis dari PT Carsurin, tertanggal 29 Agustus 2022",
    },
    gate: "Dokumen disetujui untuk publik; penerbit, tanggal, dan batch tercatat.",
  }),
  slot({
    id: "documents/preview-roa-beckjorindo",
    priority: "P2",
    subject: "Certificate of Analysis dari PT Beckjorindo Paryaweksana (14 Oktober 2023), data pengirim disensor",
    aspect: "4/5",
    minWidth: 800,
    usedOn: "Pratinjau dokumen, halaman Kualitas & Dokumen",
    alt: {
      en: "Certificate of Analysis issued by PT Beckjorindo Paryaweksana, dated 14 October 2023",
      id: "Certificate of Analysis dari PT Beckjorindo Paryaweksana, tertanggal 14 Oktober 2023",
    },
    gate: "Dokumen disetujui untuk publik; penerbit, tanggal, dan batch tercatat.",
  }),
  slot({
    id: "documents/preview-sht-carsurin",
    priority: "P2",
    subject: "Self-Heating Test dari PT Carsurin (31 Mei 2022), halaman 2",
    aspect: "4/5",
    minWidth: 800,
    usedOn: "Pratinjau dokumen, halaman Kualitas & Dokumen",
    alt: {
      en: "Self-Heating Test report issued by PT Carsurin, dated 31 May 2022",
      id: "Laporan Self-Heating Test dari PT Carsurin, tertanggal 31 Mei 2022",
    },
    gate: "Dokumen disetujui untuk publik; penerbit, tanggal, dan batch tercatat.",
  }),
  slot({
    id: "documents/preview-msds-sgs",
    priority: "P2",
    subject: "MSDS Report dari SGS Korea Co., Ltd. (19 Desember 2013), data penerima disensor",
    aspect: "4/5",
    minWidth: 800,
    usedOn: "Pratinjau dokumen, halaman Kualitas & Dokumen",
    alt: {
      en: "MSDS report issued by SGS Korea Co., Ltd., dated 19 December 2013",
      id: "Laporan MSDS dari SGS Korea Co., Ltd., tertanggal 19 Desember 2013",
    },
    gate: "Dokumen disetujui untuk publik.",
  }),
  slot({
    id: "documents/preview-sk-kemenkum",
    priority: "P2",
    subject: "Keputusan Menteri Hukum RI tentang Pengesahan Pendirian Badan Hukum PT Permata Bara Globalindo (8 September 2026)",
    aspect: "4/5",
    minWidth: 500,
    usedOn: "Pratinjau dokumen, halaman Tentang Kami dan Kualitas & Dokumen",
    alt: {
      en: "Decree of the Minister of Law approving the establishment of PT Permata Bara Globalindo, dated 8 September 2026",
      id: "Keputusan Menteri Hukum RI tentang pengesahan pendirian PT Permata Bara Globalindo, tertanggal 8 September 2026",
    },
    gate: "Dokumen disetujui untuk publik.",
  }),
  slot({
    id: "documents/preview-nib",
    priority: "P2",
    subject: "Perizinan Berusaha Berbasis Risiko (NIB) PT Permata Bara Globalindo (20 September 2026)",
    aspect: "4/5",
    minWidth: 500,
    usedOn: "Pratinjau dokumen, halaman Tentang Kami dan Kualitas & Dokumen",
    alt: {
      en: "Risk-based business licence (NIB) of PT Permata Bara Globalindo, dated 20 September 2026",
      id: "Perizinan Berusaha Berbasis Risiko (NIB) PT Permata Bara Globalindo, tertanggal 20 September 2026",
    },
    gate: "Dokumen disetujui untuk publik.",
  }),
  slot({
    id: "documents/preview-npwp",
    priority: "P2",
    subject: "Kartu NPWP PT Permata Bara Globalindo (terdaftar 10 September 2026)",
    aspect: "4/5",
    minWidth: 500,
    usedOn: "Pratinjau dokumen, halaman Tentang Kami dan Kualitas & Dokumen",
    alt: {
      en: "NPWP tax card of PT Permata Bara Globalindo, registered 10 September 2026",
      id: "Kartu NPWP PT Permata Bara Globalindo, terdaftar 10 September 2026",
    },
    gate: "Dokumen disetujui untuk publik.",
  }),
  slot({
    id: "shipping/container-loading",
    priority: "P2",
    subject: "Foto proses stuffing/loading briket ke kontainer 20 ft",
    aspect: "3/2",
    minWidth: 1100,
    usedOn: "Halaman Pemesanan & Pengiriman",
    alt: { en: "Branded shipping containers at a port", id: "Kontainer pengiriman bermerek di pelabuhan" },
  }),
  slot({
    id: "shipping/world-map",
    priority: "P2",
    subject: "Peta dunia datar (SVG, tanpa teks tertanam) dengan Indonesia dan wilayah tujuan ditandai, lisensi yang jelas",
    aspect: "16/9",
    minWidth: 1600,
    usedOn: "Halaman Pemesanan & Pengiriman, perkiraan durasi pengiriman",
    alt: {
      en: "World map showing Indonesia and the destination regions served",
      id: "Peta dunia yang menandai Indonesia dan wilayah tujuan pengiriman",
    },
    gate: "Sumber dan lisensi peta diketahui; wilayah yang ditandai sesuai tabel durasi.",
  }),
  slot({
    id: "labs/carsurin",
    priority: "P2",
    subject: "Logo resmi Carsurin dari pemiliknya, tanpa diubah warna atau bentuknya (SVG, atau PNG transparan)",
    aspect: "3/2",
    minWidth: 400,
    usedOn: "Bagian laboratorium dan surveyor (Beranda, Kualitas & Dokumen)",
    alt: { en: "Carsurin logo", id: "Logo Carsurin" },
    gate: "Izin atau ketentuan penggunaan logo dari Carsurin dipenuhi; rumusan tidak menyiratkan sertifikasi atau dukungan terhadap Permata Briquettes.",
  }),
  slot({
    id: "labs/beckjorindo",
    priority: "P2",
    subject: "Logo resmi Beckjorindo dari pemiliknya, tanpa diubah warna atau bentuknya (SVG, atau PNG transparan)",
    aspect: "3/2",
    minWidth: 400,
    usedOn: "Bagian laboratorium dan surveyor (Beranda, Kualitas & Dokumen)",
    alt: { en: "Beckjorindo logo", id: "Logo Beckjorindo" },
    gate: "Izin atau ketentuan penggunaan logo dari Beckjorindo dipenuhi; rumusan tidak menyiratkan sertifikasi atau dukungan terhadap Permata Briquettes.",
  }),
  slot({
    id: "labs/sgs",
    priority: "P2",
    subject: "Logo resmi SGS dari pemiliknya, tanpa diubah warna atau bentuknya (SVG, atau PNG transparan)",
    aspect: "3/2",
    minWidth: 400,
    usedOn: "Bagian laboratorium dan surveyor (Beranda, Kualitas & Dokumen)",
    alt: { en: "SGS logo", id: "Logo SGS" },
    gate: "Izin atau ketentuan penggunaan logo dari SGS dipenuhi; rumusan tidak menyiratkan sertifikasi atau dukungan terhadap Permata Briquettes.",
  }),
  slot({
    id: "labs/sucofindo",
    priority: "P2",
    subject: "Logo resmi Sucofindo dari pemiliknya, tanpa diubah warna atau bentuknya (SVG, atau PNG transparan)",
    aspect: "3/2",
    minWidth: 400,
    usedOn: "Bagian laboratorium dan surveyor (Beranda, Kualitas & Dokumen)",
    alt: { en: "Sucofindo logo", id: "Logo Sucofindo" },
    gate: "Izin atau ketentuan penggunaan logo dari Sucofindo dipenuhi; rumusan tidak menyiratkan sertifikasi atau dukungan terhadap Permata Briquettes.",
  }),
  slot({
    id: "partners/berkarindo-facility",
    priority: "P3",
    subject: "Foto fasilitas Berkarindo (bukan foto tim)",
    aspect: "3/2",
    minWidth: 1100,
    usedOn: "Seksi mitra produksi (ditunda)",
    alt: { en: "Facility of a manufacturing partner", id: "Fasilitas mitra produksi" },
    gate: "Izin tertulis dari Berkarindo dan rumusan atribusi yang disetujui.",
  }),
];

const SLOT_INDEX = new Map(MEDIA_SLOTS.map((entry) => [entry.id, entry]));

export function getMediaSlot(id: string): MediaSlot | undefined {
  return SLOT_INDEX.get(id);
}

export function isKnownMediaSlot(id: string): boolean {
  return SLOT_INDEX.has(id);
}

/** Maps a product shape name from the product data to its gallery slot id. */
export function shapeMediaId(shapeName: string): string | undefined {
  const key = shapeName.toLowerCase();
  if (key.startsWith("cube")) return "products/shape-cube";
  if (key.startsWith("finger")) return "products/shape-finger";
  if (key.startsWith("hex")) return "products/shape-hexagonal";
  if (key.startsWith("flat")) return "products/shape-flat";
  if (key.startsWith("dome")) return "products/shape-dome";
  return undefined;
}
