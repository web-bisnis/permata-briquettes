import type { ImageMetadata } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import {
  BLOG_NAV_ALWAYS,
  blogArticlePath,
  resolveBlogFeature,
  type BlogLocale,
} from "../config/blog";
import { validateBlogEntries } from "./blog-validate";

const COVER_MODULES = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/blog/*/*.{jpg,jpeg,png,webp,avif}",
  { eager: true },
);

export interface BlogPost {
  entry: CollectionEntry<"blog">;
  locale: BlogLocale;
  name: string;
  slug: string;
  route: string;
  /** The same article in the other language. */
  alternateRoute: string;
  cover?: ImageMetadata;
}

export interface BlogIndex {
  posts: Record<BlogLocale, BlogPost[]>;
  previewDrafts: boolean;
}

function coverFor(name: string, cover: string | undefined): ImageMetadata | undefined {
  return cover ? COVER_MODULES[`/src/assets/blog/${name}/${cover}`]?.default : undefined;
}

async function readBlog(): Promise<BlogIndex> {
  const { previewDrafts } = resolveBlogFeature({
    dev: import.meta.env.DEV,
    previewFlag: import.meta.env.PUBLIC_BLOG_PREVIEW_DRAFTS,
  });
  const entries = await getCollection("blog");
  // Validation covers drafts too, so a broken pair fails the build before it can be published.
  const records = validateBlogEntries(entries, (name, cover) => coverFor(name, cover) !== undefined);
  const slugOf = new Map(records.map((record) => [`${record.locale}/${record.name}`, record.slug]));

  const posts: Record<BlogLocale, BlogPost[]> = { en: [], id: [] };
  for (const { entry, locale, name, slug } of records) {
    if (entry.data.draft && !previewDrafts) continue;
    const otherLocale: BlogLocale = locale === "en" ? "id" : "en";
    posts[locale].push({
      entry,
      locale,
      name,
      slug,
      route: blogArticlePath(locale, slug),
      alternateRoute: blogArticlePath(otherLocale, slugOf.get(`${otherLocale}/${name}`) ?? name),
      cover: coverFor(name, entry.data.cover),
    });
  }
  for (const locale of ["en", "id"] as const) {
    posts[locale].sort((left, right) => right.entry.data.date.getTime() - left.entry.data.date.getTime());
  }
  return { posts, previewDrafts };
}

let cached: Promise<BlogIndex> | undefined;

/** Every page asks for the blog through here, so drafts are filtered in exactly one place. */
export function loadBlog(): Promise<BlogIndex> {
  if (import.meta.env.DEV) return readBlog();
  cached ??= readBlog();
  return cached;
}

/** Menu and footer link: any visible article, the preview mode, or the config constant. */
export async function shouldShowBlogNav(): Promise<boolean> {
  if (BLOG_NAV_ALWAYS) return true;
  const { posts } = await loadBlog();
  return posts.en.length + posts.id.length > 0;
}
