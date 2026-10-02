import { getImage } from "astro:assets";
import { getMedia, getMediaAlt } from "./media";
import { LOGO_ID, type MediaLocale } from "./media-slots";
import { SOCIAL_IMAGE_SIZE, toAbsoluteUrl, type SeoImage } from "./seo";

export const DEFAULT_SOCIAL_IMAGE_ID = "brand/og-default";
export const FAVICON_ID = "brand/favicon";

// The paper color from tokens.css, used as the backdrop when the logo stands in for a photo.
const LOGO_BACKDROP = "#efefe8";

/**
 * Link-preview image, cropped to 1200×630 as JPEG. Order of preference: the page's own slot,
 * brand/og-default, then the logo centered on a plain backdrop. Undefined until any exists.
 */
export async function resolveSocialImage(
  id: string | undefined,
  locale: MediaLocale,
): Promise<SeoImage | undefined> {
  const photoCandidates = [id, DEFAULT_SOCIAL_IMAGE_ID].filter(
    (candidate): candidate is string => candidate !== undefined,
  );
  for (const candidate of photoCandidates) {
    const source = getMedia(candidate);
    if (!source) continue;
    const optimized = await getImage({
      src: source,
      width: SOCIAL_IMAGE_SIZE.width,
      height: SOCIAL_IMAGE_SIZE.height,
      fit: "cover",
      format: "jpg",
      quality: 82,
    });
    return {
      url: toAbsoluteUrl(optimized.src),
      alt: getMediaAlt(candidate, locale),
      ...SOCIAL_IMAGE_SIZE,
    };
  }

  const logo = getMedia(LOGO_ID);
  if (!logo || logo.format === "svg") return undefined;
  const optimized = await getImage({
    src: logo,
    width: SOCIAL_IMAGE_SIZE.width,
    height: SOCIAL_IMAGE_SIZE.height,
    fit: "contain",
    background: LOGO_BACKDROP,
    format: "jpg",
    quality: 82,
  });
  return {
    url: toAbsoluteUrl(optimized.src),
    alt: getMediaAlt(LOGO_ID, locale),
    ...SOCIAL_IMAGE_SIZE,
  };
}

/** The favicon slot, or the logo mark until a dedicated square icon is supplied. */
export async function resolveFaviconHref(): Promise<string | undefined> {
  const source = getMedia(FAVICON_ID) ?? getMedia(LOGO_ID);
  if (!source) return undefined;
  if (source.format === "svg") return source.src;
  const optimized = await getImage({
    src: source,
    width: 96,
    height: 96,
    fit: "contain",
    format: "png",
  });
  return optimized.src;
}
