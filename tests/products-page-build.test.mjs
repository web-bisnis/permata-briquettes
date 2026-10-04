import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const astroBin = join(projectRoot, "node_modules", "astro", "bin", "astro.mjs");
const output = mkdtempSync(join(tmpdir(), "permata-products-build-"));

execFileSync(process.execPath, [astroBin, "build", "--outDir", output], {
  cwd: projectRoot,
  stdio: "pipe",
});

afterAll(() => rmSync(output, { recursive: true, force: true }));

const pages = [
  {
    path: "en/products/index.html",
    shisha: "/en/products/coconut-charcoal-briquettes-for-shisha/",
    bbq: "/en/products/barbecue-charcoal-briquettes/",
    title: /Shisha and Barbecue/u,
  },
  {
    path: "id/produk/index.html",
    shisha: "/id/produk/briket-arang-tempurung-kelapa-untuk-shisha/",
    bbq: "/id/produk/briket-arang-barbecue/",
    title: /Shisha dan Barbecue/u,
  },
];

describe("product list page", () => {
  for (const page of pages) {
    it(`presents both product lines on ${page.path}`, () => {
      const html = readFileSync(join(output, page.path), "utf8");
      expect(html).toMatch(new RegExp(`<title>[^<]*${page.title.source}`, "u"));
      expect(html).toContain("product-panel--dark");
      expect(html).toContain("product-panel--accent");
      expect(html).toContain(`href="${page.shisha}"`);
      expect(html).toContain(`href="${page.bbq}"`);
    });

    it(`links to a detail page that exists for ${page.path}`, () => {
      const html = readFileSync(join(output, page.path), "utf8");
      for (const href of [page.shisha, page.bbq]) {
        expect(html).toContain(href);
        expect(() => readFileSync(join(output, href, "index.html"), "utf8")).not.toThrow();
      }
    });
  }

  it("renders the barbecue reference table without the shisha grade comparison", () => {
    const html = readFileSync(join(output, "en/products/barbecue-charcoal-briquettes/index.html"), "utf8");
    expect(html).toContain('id="reference-specs"');
    expect(html).not.toContain('id="grade-comparison"');
    expect(html).toContain("Above 6,500 kcal/kg");
    expect(html).not.toMatch(/btu/iu);
  });
});
