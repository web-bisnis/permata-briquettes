import { SITE_ORIGIN } from "./seo";

export type BlogLocale = "en" | "id";

/** Shows Blog in the menu and footer even before any article is published. */
export const BLOG_NAV_ALWAYS = false;

export const BLOG_PUBLISHER_NAME = "PT Permata Bara Globalindo";

interface BlogFeatureEnvironment {
  /** `import.meta.env.DEV`: true only under `astro dev`, never in a build. */
  dev: boolean;
  previewFlag: string | undefined;
}

/**
 * Draft preview is for local development only. It needs `astro dev` and the exact value "true";
 * any build, whatever its environment variables say, ignores it.
 */
export function resolveBlogFeature(environment: BlogFeatureEnvironment): { previewDrafts: boolean } {
  return { previewDrafts: environment.dev === true && environment.previewFlag === "true" };
}

export function blogListPath(locale: BlogLocale): string {
  return `/${locale}/blog/`;
}

export function blogArticlePath(locale: BlogLocale, slug: string): string {
  return `/${locale}/blog/${slug}/`;
}

export function blogFeedPath(locale: BlogLocale): string {
  return `/${locale}/blog/rss.xml`;
}

export const BLOG_COPY = {
  en: {
    title: "Blog",
    description: "Market notes and export insight on coconut charcoal briquettes from Permata Briquettes.",
    eyebrow: "Blog",
    summary: "Market notes and export insight for buyers of coconut charcoal briquettes.",
    empty: "No articles yet. Check back soon.",
    back: "Back to all articles",
    published: "Published",
    draftBadge: "Draft",
    tags: "Tags",
    cta: {
      title: "Questions about your next order?",
      body: "Tell us the grade, packaging and destination. We reply by email or WhatsApp.",
      contact: "Contact us",
    },
    feed: "Permata Briquettes blog (RSS)",
    dateLocale: "en-GB",
  },
  id: {
    title: "Blog",
    description: "Catatan pasar dan wawasan ekspor briket arang tempurung kelapa dari Permata Briquettes.",
    eyebrow: "Blog",
    summary: "Catatan pasar dan wawasan ekspor untuk pembeli briket arang tempurung kelapa.",
    empty: "Belum ada artikel. Silakan kembali lagi nanti.",
    back: "Kembali ke daftar artikel",
    published: "Terbit",
    draftBadge: "Draf",
    tags: "Tag",
    cta: {
      title: "Ada pertanyaan untuk pesanan Anda berikutnya?",
      body: "Sampaikan grade, kemasan, dan tujuan pengiriman. Kami balas lewat email atau WhatsApp.",
      contact: "Hubungi kami",
    },
    feed: "Blog Permata Briquettes (RSS)",
    dateLocale: "id-ID",
  },
} as const satisfies Record<BlogLocale, unknown>;

/** Long date in the page language; UTC keeps the day the author wrote. */
export function formatBlogDate(date: Date, locale: BlogLocale): string {
  return new Intl.DateTimeFormat(BLOG_COPY[locale].dateLocale, { dateStyle: "long", timeZone: "UTC" }).format(date);
}

interface ArticleJsonLdInput {
  headline: string;
  description: string;
  datePublished: Date;
  locale: BlogLocale;
  url: string;
  imageUrl?: string;
}

export function createArticleJsonLd(input: ArticleJsonLdInput): Record<string, unknown> {
  const publisher = { "@type": "Organization", name: BLOG_PUBLISHER_NAME, url: SITE_ORIGIN };
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished.toISOString().slice(0, 10),
    inLanguage: input.locale,
    mainEntityOfPage: input.url,
    ...(input.imageUrl ? { image: [input.imageUrl] } : {}),
    author: publisher,
    publisher,
  };
}

/** JSON for an inline <script>: "<" is escaped so the content can never close the tag. */
export function serializeJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

interface FeedItem {
  title: string;
  description: string;
  url: string;
  date: Date;
}

export function createBlogFeed(locale: BlogLocale, items: readonly FeedItem[]): string {
  const copy = BLOG_COPY[locale];
  const rows = items.map((item) => [
    "    <item>",
    `      <title>${escapeXml(item.title)}</title>`,
    `      <link>${escapeXml(item.url)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(item.url)}</guid>`,
    `      <pubDate>${item.date.toUTCString()}</pubDate>`,
    `      <description>${escapeXml(item.description)}</description>`,
    "    </item>",
  ].join("\n"));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(copy.feed)}</title>`,
    `    <link>${SITE_ORIGIN}${blogListPath(locale)}</link>`,
    `    <description>${escapeXml(copy.description)}</description>`,
    `    <language>${locale}</language>`,
    ...rows,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
