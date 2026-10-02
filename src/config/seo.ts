export const SITE_ORIGIN = "https://www.permatabriquettes.com" as const;

export const SITE_LOCALES = ["en", "id"] as const;

export type SiteLocale = (typeof SITE_LOCALES)[number];
export type SiteEnvironment = "local" | "staging" | "production";
export type RobotsDirective = "index, follow" | "noindex, nofollow";

export interface SeoAlternates {
  en: string;
  id: string;
  xDefault: string;
}

export interface SeoImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface SeoMetadata {
  title: string;
  description: string;
  canonical: string;
  locale: SiteLocale | "mul";
  indexable: boolean;
  robots: RobotsDirective;
  alternates: SeoAlternates;
  image?: SeoImage;
}

export const SITE_NAME = "Permata Briquettes";
export const SITE_TAGLINE = "Beyond Briquettes, Beyond Trust.";
export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export const OPEN_GRAPH_LOCALES: Record<SiteLocale, string> = {
  en: "en_US",
  id: "id_ID",
};

interface LocalizedSeoInput {
  title: string;
  description: string;
  locale: SiteLocale;
  route: string;
  alternateRoute: string;
  indexable: boolean;
  environment: SiteEnvironment;
  image?: SeoImage;
}

interface AnalyticsEnvironment {
  SITE_ENV?: string;
  PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED?: string;
  PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN?: string;
}

export const ROOT_SEO = {
  route: "/",
  locale: "mul",
  title: "Choose a language / Pilih bahasa",
  description: "Choose English or Bahasa Indonesia. / Pilih English atau Bahasa Indonesia.",
  indexable: true,
  alternateRoutes: {
    en: "/en/",
    id: "/id/",
    xDefault: "/",
  },
} as const;

export function resolveSiteEnvironment(value: string | undefined): SiteEnvironment {
  if (value === "production" || value === "staging" || value === "local") return value;
  return "local";
}

export function toAbsoluteUrl(route: string): string {
  if (!route.startsWith("/")) throw new Error(`SEO route must start with "/": ${route}`);
  return new URL(route, `${SITE_ORIGIN}/`).href;
}

export function getRobotsDirective(
  environment: SiteEnvironment,
  indexable: boolean,
): RobotsDirective {
  return environment === "production" && indexable ? "index, follow" : "noindex, nofollow";
}

export function createRootSeo(environment: SiteEnvironment, image?: SeoImage): SeoMetadata {
  return {
    ...(image ? { image } : {}),
    title: ROOT_SEO.title,
    description: ROOT_SEO.description,
    canonical: toAbsoluteUrl(ROOT_SEO.route),
    locale: ROOT_SEO.locale,
    indexable: ROOT_SEO.indexable,
    robots: getRobotsDirective(environment, ROOT_SEO.indexable),
    alternates: {
      en: toAbsoluteUrl(ROOT_SEO.alternateRoutes.en),
      id: toAbsoluteUrl(ROOT_SEO.alternateRoutes.id),
      xDefault: toAbsoluteUrl(ROOT_SEO.alternateRoutes.xDefault),
    },
  };
}

export function createLocalizedSeo(input: LocalizedSeoInput): SeoMetadata {
  const ownLocalePrefix = `/${input.locale}/`;
  const alternateLocale: SiteLocale = input.locale === "en" ? "id" : "en";
  const alternateLocalePrefix = `/${alternateLocale}/`;

  if (!input.route.startsWith(ownLocalePrefix)) {
    throw new Error(`SEO route ${input.route} does not match locale ${input.locale}`);
  }
  if (!input.alternateRoute.startsWith(alternateLocalePrefix)) {
    throw new Error(
      `SEO alternate ${input.alternateRoute} does not match locale ${alternateLocale}`,
    );
  }

  const localeRoutes: Record<SiteLocale, string> = input.locale === "en"
    ? { en: input.route, id: input.alternateRoute }
    : { en: input.alternateRoute, id: input.route };

  return {
    ...(input.image ? { image: input.image } : {}),
    title: input.title,
    description: input.description,
    canonical: toAbsoluteUrl(input.route),
    locale: input.locale,
    indexable: input.indexable,
    robots: getRobotsDirective(input.environment, input.indexable),
    alternates: {
      en: toAbsoluteUrl(localeRoutes.en),
      id: toAbsoluteUrl(localeRoutes.id),
      xDefault: toAbsoluteUrl(ROOT_SEO.route),
    },
  };
}

export function resolveCloudflareAnalytics(environment: AnalyticsEnvironment): {
  enabled: boolean;
  token: string | undefined;
} {
  const token = environment.PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN?.trim();
  const enabled = resolveSiteEnvironment(environment.SITE_ENV) === "production"
    && environment.PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED === "true"
    && Boolean(token);

  return { enabled, token: enabled ? token : undefined };
}
