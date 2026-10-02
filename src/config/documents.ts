import type { MediaLocale } from "./media-slots";

/**
 * Document previews shown on the Quality & Documents page. Issuer and dates are copied from
 * the documents themselves; descriptions reuse the wording of the page's document table.
 */
export interface DocumentEntry {
  /** Preview slot in src/assets/documents. */
  mediaId: string;
  title: string;
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

const MANUFACTURER = { id: "Manufacturer", en: "Manufacturer" } as const;

export const DOCUMENTS: readonly DocumentEntry[] = [
  {
    mediaId: "documents/preview-roa-carsurin",
    title: "ROA / Report of Analysis",
    description: { id: "Analisis produk atau batch.", en: "Product or batch analysis." },
    issuer: "PT Carsurin",
    date: "2022-08-29",
  },
  {
    mediaId: "documents/preview-roa-beckjorindo",
    title: "ROA / Report of Analysis",
    description: { id: "Analisis produk atau batch.", en: "Product or batch analysis." },
    issuer: "PT Beckjorindo Paryaweksana",
    date: "2023-10-14",
  },
  {
    mediaId: "documents/preview-sht-carsurin",
    title: "SHT / Self-Heating Test",
    description: { id: "Dokumen uji terkait pengangkutan.", en: "Transport-related test document." },
    issuer: "PT Carsurin",
    date: "2022-05-31",
  },
  {
    mediaId: "documents/preview-msds-sgs",
    title: "MSDS",
    description: { id: "Dokumen keselamatan dan penanganan produk.", en: "Product safety and handling document." },
    issuer: "SGS Korea Co., Ltd.",
    date: "2013-12-19",
  },
  {
    mediaId: "documents/preview-iso",
    title: "ISO 9001:2015",
    description: {
      id: "Sertifikasi manufacturer, bukan sertifikasi PT Permata Bara Globalindo.",
      en: "Manufacturer's certification, not PT Permata Bara Globalindo's certification.",
    },
    issuer: "PT SOA Sertifikasi Indonesia",
    date: "2024-04-16",
    validUntil: "2027-04-16",
    owner: MANUFACTURER,
  },
  {
    mediaId: "documents/preview-factory-audit",
    title: "Factory Audit",
    description: { id: "Dokumen audit terkait manufacturer.", en: "Manufacturer-related audit document." },
    issuer: "PT Carsurin",
    date: "2023-03-02",
    validUntil: "2025-03-01",
    owner: MANUFACTURER,
  },
];
