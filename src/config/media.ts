import type { ImageMetadata } from "astro";
import { getMediaSlot, type MediaLocale } from "./media-slots";

// Every file matched here is emitted into dist/_astro, so a held file must also be excluded
// by path with a negated glob line for that file (see the pattern list below). Those lines must list exactly the
// slots that carry `hold` in media-slots.ts (tests/media-slots.test.mjs enforces it);
// `hold` alone only hides a file from pages. No slot is on hold at the moment.
const IMAGE_MODULES = import.meta.glob<{ default: ImageMetadata }>(
  [
    "/src/assets/**/*.{jpg,jpeg,png,webp,avif,svg}",
  ],
  { eager: true },
);

const ASSET_ROOT = "/src/assets/";

function buildIndex(): Map<string, ImageMetadata> {
  const index = new Map<string, ImageMetadata>();
  for (const [path, module] of Object.entries(IMAGE_MODULES)) {
    const id = path.slice(ASSET_ROOT.length).replace(/\.[^./]+$/u, "");
    if (index.has(id)) {
      throw new Error(`Two image files share the id "${id}"; keep one extension per asset.`);
    }
    index.set(id, module.default);
  }
  return index;
}

const MEDIA_INDEX = buildIndex();

/**
 * The delivered file for a slot, or undefined while it is missing or on hold.
 * Team portraits and other unregistered ids resolve by file name alone.
 */
export function getMedia(id: string): ImageMetadata | undefined {
  if (getMediaSlot(id)?.hold) return undefined;
  return MEDIA_INDEX.get(id);
}

export function hasMedia(id: string | undefined): id is string {
  return id !== undefined && getMedia(id) !== undefined;
}

export function getMediaAlt(id: string, locale: MediaLocale): string {
  return getMediaSlot(id)?.alt[locale] ?? "";
}

export function getMediaCaption(id: string, locale: MediaLocale): string | undefined {
  return getMediaSlot(id)?.caption?.[locale];
}
