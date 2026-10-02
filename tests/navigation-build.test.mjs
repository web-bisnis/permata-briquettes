import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const astroBin = join(projectRoot, "node_modules", "astro", "bin", "astro.mjs");
const buildRoots = [];

function buildNavigationPages() {
  const output = mkdtempSync(join(tmpdir(), "permata-navigation-build-"));
  buildRoots.push(output);
  const environment = { ...process.env, SITE_ENV: "staging" };
  delete environment.PUBLIC_INQUIRY_FORM_ENABLED;
  delete environment.PUBLIC_INQUIRY_FORM_MODE;
  delete environment.PUBLIC_TURNSTILE_SITE_KEY;
  delete environment.PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED;
  delete environment.PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN;
  execFileSync(process.execPath, [astroBin, "build", "--outDir", output], {
    cwd: projectRoot,
    env: environment,
    stdio: "pipe",
  });
  return [
    readFileSync(join(output, "en", "contact", "index.html"), "utf8"),
    readFileSync(join(output, "id", "kontak", "index.html"), "utf8"),
  ];
}

afterAll(() => {
  for (const output of buildRoots) rmSync(output, { recursive: true, force: true });
});

describe("responsive header navigation build", () => {
  it("keeps navigation semantically open by default and synchronizes it at the desktop breakpoint", () => {
    for (const html of buildNavigationPages()) {
      expect(html).toMatch(/<details\b[^>]*\bdata-site-navigation\b[^>]*\bopen\b/iu);
      expect(html).toContain("[data-site-navigation]");
      expect(html).toContain("(min-width: 75rem)");
      expect(html).toMatch(/\.open\s*=\s*[^;{}]+\.matches/gu);
      expect(html).toMatch(/addEventListener\([`'"]change[`'"]/gu);
    }
  }, 30_000);
});
