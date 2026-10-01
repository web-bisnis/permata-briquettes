import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const astroBin = join(projectRoot, "node_modules", "astro", "bin", "astro.mjs");
const buildRoots = [];

function buildSite(featureEnvironment = {}) {
  const output = mkdtempSync(join(tmpdir(), "permata-seo-build-"));
  buildRoots.push(output);
  const environment = { ...process.env };
  delete environment.SITE_ENV;
  delete environment.PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED;
  delete environment.PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN;
  Object.assign(environment, featureEnvironment);
  execFileSync(process.execPath, [astroBin, "build", "--outDir", output], {
    cwd: projectRoot,
    env: environment,
    stdio: "pipe",
  });
  return {
    root: readFileSync(join(output, "index.html"), "utf8"),
    robots: readFileSync(join(output, "robots.txt"), "utf8"),
    sitemap: readFileSync(join(output, "sitemap.xml"), "utf8"),
  };
}

afterAll(() => {
  for (const output of buildRoots) rmSync(output, { recursive: true, force: true });
});

describe("environment-specific static SEO output", () => {
  it("keeps default builds noindex and analytics-free", () => {
    const build = buildSite();
    expect(build.root).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(build.robots).toBe("User-agent: *\nDisallow: /\n");
    expect(build.root).not.toContain("static.cloudflareinsights.com");
    expect(build.root).not.toContain("data-cf-beacon");
  }, 30_000);

  it("allows indexing only in an explicit production build", () => {
    const build = buildSite({ SITE_ENV: "production" });
    expect(build.root).toContain('<meta name="robots" content="index, follow">');
    expect(build.robots).toContain("Allow: /");
    expect(build.robots).toContain("Sitemap: https://www.permatabriquettes.com/sitemap.xml");
    expect(build.sitemap).toContain("https://www.permatabriquettes.com/en/");
    expect(build.root).not.toContain("static.cloudflareinsights.com");
  }, 30_000);

  it("requires production, an explicit flag, and a token for the analytics beacon", () => {
    const token = "test-token-not-a-production-secret";
    const staging = buildSite({
      SITE_ENV: "staging",
      PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED: "true",
      PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN: token,
    });
    expect(staging.root).not.toContain("static.cloudflareinsights.com");
    expect(staging.root).not.toContain(token);

    const production = buildSite({
      SITE_ENV: "production",
      PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED: "true",
      PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN: token,
    });
    expect(production.root).toContain("https://static.cloudflareinsights.com/beacon.min.js");
    expect(production.root).toContain(token);
  }, 30_000);
});
