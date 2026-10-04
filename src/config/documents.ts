import type { MediaLocale } from "./media-slots";

/**
 * Document previews shown on the Quality & Documents page. Issuer and dates are copied from
 * the documents themselves; descriptions reuse the wording of the page's document table.
 */
export interface DocumentEntry {
  /** Preview slot in src/assets/documents. */
  mediaId: string;
  /** "legal" documents belong to the company itself; "quality" documents describe the product. */
  kind: "quality" | "legal";
  title: Record<MediaLocale, string>;
  description: Record<MediaLocale, string>;
  /** Issuing laboratory, surveyor, or certification body, as printed on the document. */
  issuer: string;
  /** Date of the report, certificate, or audit (ISO, UTC). */
  date: string;
  /** Printed expiry, only where the document states one. */
  validUntil?: string;
  /** Set only where the page already states whose document it is. */
  owner?: Record<MediaLocale, string>;
}

const COMPANY = { id: "PT Permata Bara Globalindo", en: "PT Permata Bara Globalindo" } as const;

export const DOCUMENTS: readonly DocumentEntry[] = [
  {
    mediaId: "documents/preview-sk-kemenkum",
    kind: "legal",
    title: {
      id: "Keputusan Menteri Hukum RI tentang Pengesahan Pendirian Badan Hukum",
      en: "Decree of the Minister of Law approving the company's establishment",
    },
    description: {
      id: "Pengesahan pendirian badan hukum Perseroan Terbatas PT Permata Bara Globalindo, Nomor AHU-0072428.AH.01.01.Tahun 2026.",
      en: "Approval of the establishment of PT Permata Bara Globalindo as a limited liability company, No. AHU-0072428.AH.01.01.Tahun 2026.",
    },
    issuer: "Kementerian Hukum Republik Indonesia",
    date: "2026-09-08",
    owner: COMPANY,
  },
  {
    mediaId: "documents/preview-nib",
    kind: "legal",
    title: {
      id: "Perizinan Berusaha Berbasis Risiko (NIB)",
      en: "Risk-Based Business Licensing (NIB)",
    },
    description: {
      id: "Nomor Induk Berusaha (NIB) PT Permata Bara Globalindo: 2009260012752.",
      en: "Business Identification Number (NIB) of PT Permata Bara Globalindo: 2009260012752.",
    },
    issuer: "Pemerintah Republik Indonesia (OSS)",
    date: "2026-09-20",
    owner: COMPANY,
  },
  {
    mediaId: "documents/preview-npwp",
    kind: "legal",
    title: {
      id: "Nomor Pokok Wajib Pajak (NPWP)",
      en: "Taxpayer Identification Number (NPWP)",
    },
    description: {
      id: "Kartu NPWP PT Permata Bara Globalindo: 1000 0000 1113 8680.",
      en: "NPWP card of PT Permata Bara Globalindo: 1000 0000 1113 8680.",
    },
    issuer: "Direktorat Jenderal Pajak",
    date: "2026-09-10",
    owner: COMPANY,
  },
  {
    mediaId: "documents/preview-roa-carsurin",
    kind: "quality",
    title: { id: "ROA / Report of Analysis", en: "ROA / Report of Analysis" },
    description: { id: "Analisis produk atau batch.", en: "Product or batch analysis." },
    issuer: "PT Carsurin",
    date: "2022-08-29",
  },
  {
    mediaId: "documents/preview-roa-beckjorindo",
    kind: "quality",
    title: { id: "ROA / Report of Analysis", en: "ROA / Report of Analysis" },
    description: { id: "Analisis produk atau batch.", en: "Product or batch analysis." },
    issuer: "PT Beckjorindo Paryaweksana",
    date: "2023-10-14",
  },
  {
    mediaId: "documents/preview-sht-carsurin",
    kind: "quality",
    title: { id: "SHT / Self-Heating Test", en: "SHT / Self-Heating Test" },
    description: { id: "Dokumen uji terkait pengangkutan.", en: "Transport-related test document." },
    issuer: "PT Carsurin",
    date: "2022-05-31",
  },
  {
    mediaId: "documents/preview-msds-sgs",
    kind: "quality",
    title: { id: "MSDS", en: "MSDS" },
    description: { id: "Dokumen keselamatan dan penanganan produk.", en: "Product safety and handling document." },
    issuer: "SGS Korea Co., Ltd.",
    date: "2013-12-19",
  },
];
