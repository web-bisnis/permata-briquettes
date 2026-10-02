import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const astroBin = join(projectRoot, "node_modules", "astro", "bin", "astro.mjs");
const output = mkdtempSync(join(tmpdir(), "permata-defaults-build-"));

execFileSync(process.execPath, [astroBin, "build", "--outDir", output], {
  cwd: projectRoot,
  stdio: "pipe",
});

afterAll(() => rmSync(output, { recursive: true, force: true }));

describe("default language and theme", () => {
  it("forwards the root to English without asking the visitor", () => {
    const html = readFileSync(join(output, "index.html"), "utf8");
    expect(html).toContain('<meta http-equiv="refresh" content="0;url=/en/"');
  });

  it("is light by default and never follows the operating-system theme", () => {
    const css = readdirSync(join(output, "_astro"))
      .filter((file) => file.endsWith(".css"))
      .map((file) => readFileSync(join(output, "_astro", file), "utf8"))
      .join("\n");
    expect(css).not.toContain("prefers-color-scheme");

    for (const path of ["index.html", "en/index.html", "id/index.html"]) {
      const html = readFileSync(join(output, path), "utf8");
      expect(html).toContain('<meta name="color-scheme" content="light"');
    }
  });

  it("keeps a single icon-only theme toggle in the header", () => {
    for (const path of ["en/index.html", "id/index.html"]) {
      const html = readFileSync(join(output, path), "utf8");
      expect(html.match(/data-theme-toggle/gu)?.length).toBeGreaterThanOrEqual(1);
      expect(html).toMatch(/<button[^>]*data-theme-toggle[^>]*aria-label="[^"]+"/u);
      expect(html).not.toContain("<select");
    }
  });

  it("shows the brand tagline and the flag of the current language", () => {
    const en = readFileSync(join(output, "en/index.html"), "utf8");
    const id = readFileSync(join(output, "id/index.html"), "utf8");
    for (const html of [en, id]) expect(html).toContain("Beyond Briquettes, Beyond Trust.");
    expect(en).toContain('id="flag-gb-clip"');
    expect(en).toContain('hreflang="id"');
    expect(id).not.toContain('id="flag-gb-clip"');
    expect(id).toContain('hreflang="en"');
  });
});
