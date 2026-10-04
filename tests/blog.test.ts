import { describe, expect, it } from "vitest";
import {
  BLOG_NAV_ALWAYS,
  createArticleJsonLd,
  createBlogFeed,
  formatBlogDate,
  resolveBlogFeature,
  serializeJsonLd,
} from "../src/config/blog";
import { getNavigationItems, isCurrentNavigationItem } from "../src/config/navigation";
import { removeInlineStyles, secureExternalLinks } from "../src/lib/blog-html";
import { blogSchema, type BlogData } from "../src/lib/blog-schema";
import { validateBlogEntries } from "../src/lib/blog-validate";

const base = { title: "T", description: "D", date: "2026-10-04" };

function data(overrides: Partial<BlogData> = {}): BlogData {
  return blogSchema.parse({ ...base, ...overrides });
}

function entry(id: string, overrides: Partial<BlogData> = {}) {
  return { id, data: data(overrides) };
}

const hasCover = () => true;

describe("blog schema", () => {
  it("defaults to a private draft with no tags", () => {
    const parsed = data();
    expect(parsed.draft).toBe(true);
    expect(parsed.tags).toEqual([]);
    expect(parsed.date).toBeInstanceOf(Date);
  });

  it("treats empty cover fields as not filled in", () => {
    const parsed = blogSchema.parse({ ...base, cover: "", coverAlt: "" });
    expect(parsed.cover).toBeUndefined();
    expect(parsed.coverAlt).toBeUndefined();
  });

  it("requires coverAlt whenever there is a cover, and the reverse", () => {
    expect(blogSchema.safeParse({ ...base, cover: "a.jpg" }).success).toBe(false);
    expect(blogSchema.safeParse({ ...base, coverAlt: "alt" }).success).toBe(false);
    expect(blogSchema.safeParse({ ...base, cover: "a.jpg", coverAlt: "alt" }).success).toBe(true);
  });

  it("rejects unknown fields, missing text and malformed slugs", () => {
    expect(blogSchema.safeParse({ ...base, extra: 1 }).success).toBe(false);
    expect(blogSchema.safeParse({ ...base, title: "" }).success).toBe(false);
    expect(blogSchema.safeParse({ ...base, date: "not a date" }).success).toBe(false);
    expect(blogSchema.safeParse({ ...base, slug: "Has Spaces" }).success).toBe(false);
    expect(blogSchema.safeParse({ ...base, slug: "good-slug" }).success).toBe(true);
  });
});

describe("translation pairs", () => {
  it("accepts a complete pair and defaults the slug to the file name", () => {
    const records = validateBlogEntries([entry("en/a"), entry("id/a")], hasCover);
    expect(records.map((record) => [record.locale, record.slug])).toEqual([["en", "a"], ["id", "a"]]);
  });

  it("lets each language choose its own slug", () => {
    const records = validateBlogEntries([entry("en/a", { slug: "market" }), entry("id/a", { slug: "pasar" })], hasCover);
    expect(records.map((record) => record.slug)).toEqual(["market", "pasar"]);
  });

  it("fails with a clear message when a translation is missing", () => {
    expect(() => validateBlogEntries([entry("en/a")], hasCover)).toThrow(
      /"a" exists in English but has no Indonesian translation; add src\/content\/blog\/id\/a\.md/u,
    );
    expect(() => validateBlogEntries([entry("id/b")], hasCover)).toThrow(
      /"b" exists in Indonesian but has no English translation/u,
    );
  });

  it("fails when only one half of a pair is published", () => {
    expect(() => validateBlogEntries([entry("en/a", { draft: false }), entry("id/a")], hasCover)).toThrow(
      /both be drafts or both be published/u,
    );
  });

  it("fails on duplicate slugs within a language and on a missing cover file", () => {
    expect(() => validateBlogEntries(
      [entry("en/a", { slug: "x" }), entry("id/a"), entry("en/b", { slug: "x" }), entry("id/b")],
      hasCover,
    )).toThrow(/slug "x" is used by both/u);
    expect(() => validateBlogEntries(
      [entry("en/a", { cover: "c.jpg", coverAlt: "alt" }), entry("id/a")],
      () => false,
    )).toThrow(/cover "c\.jpg" not found in src\/assets\/blog\/a\//u);
  });

  it("reports every problem in one error", () => {
    expect(() => validateBlogEntries([entry("en/a"), entry("id/b")], hasCover)).toThrow(/"a" exists[\s\S]*"b" exists/u);
  });
});

describe("draft preview flag", () => {
  it("is on only under astro dev with the exact value true", () => {
    expect(resolveBlogFeature({ dev: true, previewFlag: "true" }).previewDrafts).toBe(true);
    expect(resolveBlogFeature({ dev: false, previewFlag: "true" }).previewDrafts).toBe(false);
    expect(resolveBlogFeature({ dev: true, previewFlag: "TRUE" }).previewDrafts).toBe(false);
    expect(resolveBlogFeature({ dev: true, previewFlag: "1" }).previewDrafts).toBe(false);
    expect(resolveBlogFeature({ dev: true, previewFlag: undefined }).previewDrafts).toBe(false);
  });
});

describe("blog navigation", () => {
  it("adds Blog before Contact only when asked", () => {
    expect(getNavigationItems("en", false).some((item) => item.href === "/en/blog/")).toBe(false);
    const withBlog = getNavigationItems("id", true);
    expect(withBlog.map((item) => item.label).slice(-2)).toEqual(["Blog", "Kontak"]);
    expect(BLOG_NAV_ALWAYS).toBe(false);
  });

  it("marks Blog current on article pages but not other items", () => {
    const [blog] = getNavigationItems("en", true).filter((item) => item.href === "/en/blog/");
    expect(isCurrentNavigationItem(blog, "/en/blog/")).toBe(true);
    expect(isCurrentNavigationItem(blog, "/en/blog/some-article/")).toBe(true);
    const about = getNavigationItems("en", true).find((item) => item.href === "/en/about/")!;
    expect(isCurrentNavigationItem(about, "/en/about/team/")).toBe(false);
  });
});

describe("article metadata and feed", () => {
  const input = {
    headline: "A </script> title",
    description: "Desc",
    datePublished: new Date("2026-10-04T00:00:00Z"),
    locale: "id" as const,
    url: "https://www.permatabriquettes.com/id/blog/a/",
    imageUrl: "https://www.permatabriquettes.com/_astro/c.jpg",
  };

  it("describes an Article from PT Permata Bara Globalindo", () => {
    const json = createArticleJsonLd(input);
    expect(json).toMatchObject({
      "@type": "Article",
      headline: "A </script> title",
      datePublished: "2026-10-04",
      inLanguage: "id",
      image: [input.imageUrl],
      publisher: { "@type": "Organization", name: "PT Permata Bara Globalindo" },
    });
    expect(createArticleJsonLd({ ...input, imageUrl: undefined })).not.toHaveProperty("image");
  });

  it("cannot close its own script tag", () => {
    expect(serializeJsonLd(createArticleJsonLd(input))).not.toContain("</script>");
  });

  it("formats dates in the page language without a timezone shift", () => {
    const date = new Date("2026-10-04T00:00:00Z");
    expect(formatBlogDate(date, "en")).toBe("4 October 2026");
    expect(formatBlogDate(date, "id")).toBe("4 Oktober 2026");
  });

  it("escapes feed text and lists only the given items", () => {
    const feed = createBlogFeed("en", [
      { title: "Tom & <Jerry>", description: "d", url: "https://x.test/en/blog/a/", date: new Date("2026-10-04T00:00:00Z") },
    ]);
    expect(feed).toContain("<title>Tom &amp; &lt;Jerry&gt;</title>");
    expect(feed.match(/<item>/gu)).toHaveLength(1);
    expect(createBlogFeed("id", []).match(/<item>/gu)).toBeNull();
  });
});

describe("external links in article HTML", () => {
  it("adds rel to http(s) links only and replaces an existing rel", () => {
    expect(secureExternalLinks('<a href="https://example.com/x">x</a>')).toBe(
      '<a href="https://example.com/x" rel="noopener noreferrer">x</a>',
    );
    expect(secureExternalLinks('<a href="/en/contact/">c</a><a href="#top">t</a>')).toBe(
      '<a href="/en/contact/">c</a><a href="#top">t</a>',
    );
    expect(secureExternalLinks('<a rel="opener" href="http://a.test">a</a>')).toBe(
      '<a href="http://a.test" rel="noopener noreferrer">a</a>',
    );
  });
});

describe("inline styles in article HTML", () => {
  it("drops style attributes from aligned table cells and leaves other attributes", () => {
    expect(removeInlineStyles(`<th style="text-align: left">A</th><td style='text-align:right' class="x">B</td>`)).toBe(
      '<th>A</th><td class="x">B</td>',
    );
    expect(removeInlineStyles('<p class="a">no style</p>')).toBe('<p class="a">no style</p>');
  });
});
