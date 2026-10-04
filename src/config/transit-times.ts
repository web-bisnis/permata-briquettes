import type { MediaLocale } from "./media-slots";

/** Estimated transit time by destination region, as approved for publication by the company. */
export interface TransitRegion {
  /** Stable key linking the table row to the map outline. */
  key: string;
  /** ISO 3166-1 alpha-2 ids of the countries coloured on the map. */
  countries: readonly string[];
  region: Record<MediaLocale, string>;
  /** Destination ports or countries; proper names are the same in both languages unless written per locale. */
  ports: Record<MediaLocale, string>;
  /** Days, written as the range shown to buyers. */
  days: string;
}

const same = (value: string): Record<MediaLocale, string> => ({ id: value, en: value });

export const TRANSIT_REGIONS: readonly TransitRegion[] = [
  { key: "usa", countries: ["US"], region: { id: "Amerika Serikat", en: "USA" }, ports: same("Houston, New York, Los Angeles, Seattle"), days: "35–65" },
  { key: "eu", countries: ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"], region: { id: "Uni Eropa", en: "EU" }, ports: same("Antwerp, Bremerhaven, Gdansk, Le Havre"), days: "35–45" },
  { key: "australia", countries: ["AU"], region: same("Australia"), ports: same("Melbourne, Sydney"), days: "25–35" },
  { key: "russia", countries: ["RU"], region: { id: "Rusia", en: "Russia" }, ports: same("Vladivostok, Vostochny, St Petersburg, Novorossiysk"), days: "15–25" },
  { key: "uk", countries: ["GB"], region: { id: "Inggris", en: "UK" }, ports: same("London Gateway, Felixstowe"), days: "35–45" },
  {
    key: "mediterranean",
    countries: ["TR","LY","LB","GR","IL","MA","TN","AL"],
    region: { id: "Mediterania", en: "Mediterranean" },
    ports: {
      id: "Turki, Libya, Lebanon, Yunani, Israel, Maroko, Tunisia, Albania",
      en: "Turkey, Libya, Lebanon, Greece, Israel, Morocco, Tunisia, Albania",
    },
    days: "35–45",
  },
  {
    key: "middle-east",
    countries: ["AE","SA","OM","BH","KW","IQ"],
    region: { id: "Timur Tengah", en: "Middle East" },
    ports: {
      id: "Uni Emirat Arab, Arab Saudi, Oman, Bahrain, Kuwait, Irak",
      en: "UAE, Saudi Arabia, Oman, Bahrain, Kuwait, Iraq",
    },
    days: "25–45",
  },
  { key: "canada", countries: ["CA"], region: { id: "Kanada", en: "Canada" }, ports: same("Halifax, Montreal, Vancouver"), days: "35–65" },
  { key: "india", countries: ["IN"], region: same("India"), ports: same("Mumbai, Chennai"), days: "35–65" },
  { key: "japan", countries: ["JP"], region: { id: "Jepang", en: "Japan" }, ports: same("Nagoya"), days: "35–65" },
];

/** Indonesia, drawn as the point of departure. */
export const ORIGIN_COUNTRIES = ["ID"] as const;
