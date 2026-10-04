import type { BlogLocale } from "../config/blog";
import { BLOG_NAME_PATTERN, type BlogData } from "./blog-schema";

export interface BlogEntryInput {
  /** Collection id: "<locale>/<file name without .md>". */
  id: string;
  data: BlogData;
}

export interface BlogRecord<Entry extends BlogEntryInput = BlogEntryInput> {
  entry: Entry;
  locale: BlogLocale;
  /** File name shared by both translations; also the cover folder name. */
  name: string;
  /** URL segment in this language. */
  slug: string;
}

const LOCALE_NAMES: Record<BlogLocale, string> = { en: "English", id: "Indonesian" };

function otherLocale(locale: BlogLocale): BlogLocale {
  return locale === "en" ? "id" : "en";
}

/**
 * Checks every article, drafts included, and returns one record per entry.
 * All problems are collected into a single error so one build shows the whole list.
 */
export function validateBlogEntries<Entry extends BlogEntryInput>(
  entries: readonly Entry[],
  coverExists: (name: string, cover: string) => boolean,
): BlogRecord<Entry>[] {
  const problems: string[] = [];
  const records: BlogRecord<Entry>[] = [];
  const byKey = new Map<string, BlogRecord<Entry>>();

  for (const entry of entries) {
    const [locale, name, ...rest] = entry.id.split("/");
    if ((locale !== "en" && locale !== "id") || !name || rest.length > 0 || !BLOG_NAME_PATTERN.test(name)) {
      problems.push(
        `src/content/blog/${entry.id}.md: put the file directly in en/ or id/ and name it with lowercase words joined by hyphens.`,
      );
      continue;
    }
    const record: BlogRecord<Entry> = { entry, locale, name, slug: entry.data.slug ?? name };
    records.push(record);
    byKey.set(`${locale}/${name}`, record);
  }

  for (const record of records) {
    const { locale, name, entry } = record;
    const partner = byKey.get(`${otherLocale(locale)}/${name}`);
    if (!partner) {
      problems.push(
        `Blog article "${name}" exists in ${LOCALE_NAMES[locale]} but has no ${LOCALE_NAMES[otherLocale(locale)]} translation; add src/content/blog/${otherLocale(locale)}/${name}.md (same file name marks a translation pair).`,
      );
    } else if (partner.entry.data.draft !== entry.data.draft) {
      problems.push(
        `Blog article "${name}": the ${LOCALE_NAMES[locale]} and ${LOCALE_NAMES[otherLocale(locale)]} files must both be drafts or both be published (set the same \`draft\` value).`,
      );
    }
    if (entry.data.cover && !coverExists(name, entry.data.cover)) {
      problems.push(
        `src/content/blog/${entry.id}.md: cover "${entry.data.cover}" not found in src/assets/blog/${name}/.`,
      );
    }
  }

  const seenSlugs = new Map<string, string>();
  for (const record of records) {
    const key = `${record.locale}/${record.slug}`;
    const first = seenSlugs.get(key);
    if (first) {
      problems.push(`Blog slug "${record.slug}" is used by both ${first} and ${record.entry.id} (${LOCALE_NAMES[record.locale]}); slugs must be unique per language.`);
    } else {
      seenSlugs.set(key, record.entry.id);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Blog content is invalid:\n- ${problems.join("\n- ")}`);
  }
  return records;
}
