import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const astroBin = join(projectRoot, "node_modules", "astro", "bin", "astro.mjs");
const buildRoots = [];

function buildSite(featureEnvironment = {}) {
  const output = mkdtempSync(join(tmpdir(), "permata-security-build-"));
  buildRoots.push(output);
  const environment = { ...process.env };
  for (const name of [
    "SITE_ENV",
    "PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED",
    "PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN",
    "PUBLIC_INQUIRY_FORM_ENABLED",
    "PUBLIC_INQUIRY_FORM_MODE",
    "PUBLIC_TURNSTILE_SITE_KEY",
  ]) {
    delete environment[name];
  }
  Object.assign(environment, featureEnvironment);
  execFileSync(process.execPath, [astroBin, "build", "--outDir", output], {
    cwd: projectRoot,
    env: environment,
    stdio: "pipe",
  });
  return (path) => readFileSync(join(output, path), "utf8");
}

function cspOf(html) {
  const policy = html.match(/<meta http-equiv="content-security-policy" content="([^"]*)"/u)?.[1];
  expect(policy).toBeDefined();
  return Object.fromEntries(
    policy.split(";")
      .map((directive) => directive.trim().split(/\s+/u))
      .filter(([name]) => Boolean(name))
      .map(([name, ...sources]) => [name, sources]),
  );
}

function inlineScripts(html) {
  return [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gu)].map((match) => match[1]);
}

const sha256 = (source) => `'sha256-${createHash("sha256").update(source).digest("base64")}'`;

afterAll(() => {
  for (const output of buildRoots) rmSync(output, { recursive: true, force: true });
});

describe("content security policy", () => {
  it("hashes every inline script, including the theme bootstrap", () => {
    const read = buildSite();
    for (const path of ["index.html", "id/index.html", "en/contact/index.html"]) {
      const html = read(path);
      const csp = cspOf(html);
      expect(csp["default-src"]).toEqual(["'self'"]);
      expect(csp["object-src"]).toEqual(["'none'"]);
      expect(csp["script-src"]).toContain("'self'");
      expect(html).not.toContain("'unsafe-inline'");
      const scripts = inlineScripts(html);
      expect(scripts.some((source) => source.includes('localStorage.getItem("theme")'))).toBe(true);
      for (const source of scripts) expect(csp["script-src"]).toContain(sha256(source));
    }
    const headers = read("_headers");
    expect(headers).toContain("Content-Security-Policy: frame-ancestors 'none'");
    expect(headers).toContain("X-Content-Type-Options: nosniff");
    expect(headers).not.toMatch(/Strict-Transport-Security/iu);
  }, 30_000);

  it("allows the analytics beacon only when it is rendered, keeping same-origin scripts", () => {
    const read = buildSite({
      SITE_ENV: "production",
      PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED: "true",
      PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN: "test-token-not-a-production-secret",
    });
    const csp = cspOf(read("id/index.html"));
    expect(csp["script-src"]).toEqual(expect.arrayContaining([
      "'self'",
      "https://static.cloudflareinsights.com",
    ]));
    expect(csp["connect-src"]).toEqual(expect.arrayContaining(["'self'", "https://cloudflareinsights.com"]));
  }, 30_000);

  it("allows Turnstile only on the live contact form pages", () => {
    const read = buildSite({
      PUBLIC_INQUIRY_FORM_ENABLED: "true",
      PUBLIC_INQUIRY_FORM_MODE: "live",
      PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    });
    const contact = cspOf(read("id/kontak/index.html"));
    expect(contact["script-src"]).toEqual(expect.arrayContaining(["'self'", "https://challenges.cloudflare.com"]));
    expect(contact["frame-src"]).toEqual(["https://challenges.cloudflare.com"]);
    const home = cspOf(read("id/index.html"));
    expect(home["script-src"]).not.toContain("https://challenges.cloudflare.com");
  }, 30_000);
});
