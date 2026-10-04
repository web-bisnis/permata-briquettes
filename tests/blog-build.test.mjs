import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";

// Each build runs in a throwaway copy of the project with its own blog content, so these tests
// neither depend on which real articles are published nor touch src/content/blog.
const projectRoot = process.cwd();
const astroBin = join(projectRoot, "node_modules", "astro", "bin", "astro.mjs");
const scratchRoots = [];

function createProject() {
  const root = mkdtempSync(join(tmpdir(), "permata-blog-"));
  scratchRoots.push(root);
  for (const entry of ["astro.config.ts", "tsconfig.json", "package.json"]) {
    cpSync(join(projectRoot, entry), join(root, entry));
  }
  cpSync(join(projectRoot, "public"), join(root, "public"), { recursive: true });
  cpSync(join(projectRoot, "src"), join(root, "src"), {
    recursive: true,
    // No real articles and no images: the copy starts with an empty blog.
    filter: (source) => !/[\\/]src[\\/]content[\\/]blog[\\/](?:en|id)[\\/]/u.test(source)
      && (!/[\\/]src[\\/]assets([\\/]|$)/u.test(source) || /[\\/]src[\\/]assets$/u.test(source)),
  });
  symlinkSync(join(projectRoot, "node_modules"), join(root, "node_modules"), "junction");
  return root;
}

function article(root, locale, name, { draft, slug, cover }) {
  const lines = [
    "---",
    `title: "Fixture article ${name} (${locale})"`,
    `description: "Fixture description (${locale})"`,
    "date: 2026-09-01",
    `draft: ${draft}`,
    ...(cover ? ["cover: cover.png", `coverAlt: "Fixture cover (${locale})"`] : []),
    "tags: [fixture]",
    ...(slug ? [`slug: ${slug}`] : []),
    "---",
    "",
    "## Section",
    "",
    "Body with an [external link](https://example.com/page).",
    "",
    // Aligned columns make the renderer emit inline styles, which the page CSP blocks.
    "| Year | Volume |",
    "| :--- | ---: |",
    "| 2024 | 203,010 |",
    "",
    "## References",
    "",
    "1. Fixture source",
    "",
  ];
  mkdirSync(join(root, "src", "content", "blog", locale), { recursive: true });
  writeFileSync(join(root, "src", "content", "blog", locale, `${name}.md`), lines.join("\n"));
}

async function addCover(root, name) {
  const folder = join(root, "src", "assets", "blog", name);
  mkdirSync(folder, { recursive: true });
  await sharp({ create: { width: 1600, height: 900, channels: 4, background: "#62735a" } })
    .png()
    .toFile(join(folder, "cover.png"));
}

function build(root, featureEnvironment = {}) {
  const output = join(root, "out");
  const environment = { ...process.env };
  delete environment.SITE_ENV;
  delete environment.PUBLIC_BLOG_PREVIEW_DRAFTS;
  Object.assign(environment, featureEnvironment);
  execFileSync(process.execPath, [astroBin, "build", "--outDir", output], {
    cwd: root,
    env: environment,
    stdio: "pipe",
  });
  return output;
}

function read(output, ...segments) {
  return readFileSync(join(output, ...segments), "utf8");
}

afterAll(() => {
  for (const root of scratchRoots) rmSync(root, { recursive: true, force: true });
});

const DRAFT_TITLE = "Fixture article secret-draft";

describe("blog with only draft articles", () => {
  // The preview flag is set on purpose: no build may honour it, in any environment.
  for (const siteEnv of [undefined, "staging", "production"]) {
    it(`renders an empty list and no articles (SITE_ENV=${siteEnv ?? "unset"}, preview flag set)`, () => {
      const root = createProject();
      article(root, "en", "secret-draft", { draft: true });
      article(root, "id", "secret-draft", { draft: true });
      const output = build(root, {
        PUBLIC_BLOG_PREVIEW_DRAFTS: "true",
        ...(siteEnv ? { SITE_ENV: siteEnv } : {}),
      });

      expect(readdirSync(join(output, "en", "blog"))).toEqual(["index.html"]);
      expect(readdirSync(join(output, "id", "blog"))).toEqual(["index.html"]);

      const en = read(output, "en", "blog", "index.html");
      const id = read(output, "id", "blog", "index.html");
      expect(en).toContain("No articles yet");
      expect(id).toContain("Belum ada artikel");
      expect(en).not.toContain("blog-card");
      expect(en).not.toContain("application/rss+xml");
      expect(en).toContain('hreflang="id" href="https://www.permatabriquettes.com/id/blog/"');
      expect(id).toContain('hreflang="en" href="https://www.permatabriquettes.com/en/blog/"');

      // No Blog menu entry until something is published.
      // (The language switch on the Blog pages themselves legitimately links to the other Blog list.)
      for (const html of [read(output, "en", "index.html"), read(output, "id", "index.html"), en, id]) {
        expect(html).not.toMatch(/class="site-navigation__link" href="\/(?:en|id)\/blog\/"/u);
        expect(html).not.toMatch(/<li><a href="\/(?:en|id)\/blog\/">/u);
      }

      const sitemap = read(output, "sitemap.xml");
      expect(sitemap).toContain("/en/blog/</loc>");
      expect(sitemap).toContain("/id/blog/</loc>");
      expect(sitemap).not.toMatch(/\/blog\/[^<]+\/<\/loc>/u);
      expect(existsSync(join(output, "en", "blog", "rss.xml"))).toBe(false);
      expect(existsSync(join(output, "id", "blog", "rss.xml"))).toBe(false);

      for (const file of [en, id, sitemap]) {
        expect(file).not.toContain(DRAFT_TITLE);
      }
    }, 60_000);
  }

  it("keeps the preview flag out of both safe build scripts", () => {
    const script = readFileSync(join(projectRoot, "scripts", "build-environment.mjs"), "utf8");
    expect(script).toContain("delete buildEnvironment.PUBLIC_BLOG_PREVIEW_DRAFTS");
    const manifest = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8"));
    for (const name of ["build:staging", "build:production"]) {
      expect(manifest.scripts[name]).toContain("scripts/build-environment.mjs");
      expect(manifest.scripts[name]).not.toContain("PUBLIC_BLOG_PREVIEW_DRAFTS");
    }
  });
});

describe("blog with a published article", () => {
  it("renders, lists and feeds only the published article, with reciprocal hreflang", async () => {
    const root = createProject();
    await addCover(root, "fixture");
    article(root, "en", "fixture", { draft: false, slug: "fixture-en", cover: true });
    article(root, "id", "fixture", { draft: false, slug: "fixture-id", cover: true });
    article(root, "en", "secret-draft", { draft: true });
    article(root, "id", "secret-draft", { draft: true });
    const output = build(root, { SITE_ENV: "production" });

    const en = read(output, "en", "blog", "fixture-en", "index.html");
    const id = read(output, "id", "blog", "fixture-id", "index.html");
    expect(en).toContain('<html lang="en"');
    expect(en).toContain('hreflang="id" href="https://www.permatabriquettes.com/id/blog/fixture-id/"');
    expect(id).toContain('hreflang="en" href="https://www.permatabriquettes.com/en/blog/fixture-en/"');
    expect(en).toContain('rel="canonical" href="https://www.permatabriquettes.com/en/blog/fixture-en/"');
    expect(en).toContain('content="index, follow"');
    expect(en).toContain('property="og:type" content="article"');
    expect(en).toMatch(/property="og:image" content="https:\/\/www\.permatabriquettes\.com\/_astro\//u);
    expect(en).toContain('alt="Fixture cover (en)"');
    const externalLink = en.match(/<a [^>]*href="https:\/\/example\.com\/page"[^>]*>/u)?.[0];
    expect(externalLink).toContain('rel="noopener noreferrer"');
    expect((en.match(/<title>/gu) ?? []).length).toBe(1);

    const jsonLd = en.match(/<script type="application\/ld\+json">([^<]+)<\/script>/u);
    expect(jsonLd).not.toBeNull();
    expect(JSON.parse(jsonLd[1])).toMatchObject({
      "@type": "Article",
      headline: "Fixture article fixture (en)",
      datePublished: "2026-09-01",
      inLanguage: "en",
      publisher: { name: "PT Permata Bara Globalindo" },
    });

    const list = read(output, "en", "blog", "index.html");
    expect(list).toContain("Fixture article fixture (en)");
    expect(list).toContain('href="/en/blog/fixture-en/"');
    expect(list).toContain('rel="alternate" type="application/rss+xml"');
    expect(read(output, "en", "index.html")).toContain('href="/en/blog/"');
    expect(en).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/en\/blog\/"|<a[^>]*href="\/en\/blog\/"[^>]*aria-current="page"/u);

    const sitemap = read(output, "sitemap.xml");
    expect(sitemap).toContain("/en/blog/fixture-en/</loc>");
    expect(sitemap).toContain("/id/blog/fixture-id/</loc>");

    const feed = read(output, "en", "blog", "rss.xml");
    expect(feed).toContain("<title>Fixture article fixture (en)</title>");
    expect(feed.match(/<item>/gu)).toHaveLength(1);
    expect(read(output, "id", "blog", "rss.xml")).toContain("<language>id</language>");

    // A draft stays out even next to a published article.
    for (const html of [list, sitemap, feed]) {
      expect(html).not.toContain(DRAFT_TITLE);
    }

    // The audit must accept the new page types, the JSON-LD hash and the feeds.
    expect(() => execFileSync(
      process.execPath,
      ["scripts/audit-static-build.mjs", "--dir", output, "--environment", "production", "--analytics", "absent", "--quiet"],
      { cwd: projectRoot, stdio: "pipe" },
    )).not.toThrow();
  }, 90_000);
});
