import type { MediaLocale } from "./media-slots";

export const SPEC_KEYS = [
  "ashContent",
  "burnTime",
  "ignitionTime",
  "moisture",
  "fixedCarbon",
  "volatileMatter",
  "ashColor",
] as const;
export type SpecKey = (typeof SPEC_KEYS)[number];

/** Shared by the comparison table and the grade list so both label a value the same way. */
export function specRows(lang: MediaLocale): { key: SpecKey; label: string }[] {
  const id = lang === "id";
  const labels: Record<SpecKey, string> = {
    ashContent: id ? "Kadar abu" : "Ash content",
    burnTime: id ? "Waktu bakar" : "Burn time",
    ignitionTime: id ? "Waktu penyalaan" : "Ignition time",
    moisture: id ? "Kadar air" : "Moisture",
    fixedCarbon: "Fixed carbon",
    volatileMatter: "Volatile matter",
    ashColor: id ? "Warna abu" : "Ash color",
  };
  return SPEC_KEYS.map((key) => ({ key, label: labels[key] }));
}
