import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { INQUIRY_COPY, MARKETING_CONSENT_TEXT } from "../src/config/inquiry-copy";

const projectRoot = process.cwd();
const astroBin = join(projectRoot, "node_modules", "astro", "bin", "astro.mjs");
const buildRoots = [];

function buildSite(featureEnvironment = {}) {
  const output = mkdtempSync(join(tmpdir(), "permata-inquiry-build-"));
  buildRoots.push(output);
  const environment = { ...process.env, ...featureEnvironment };
  delete environment.PUBLIC_INQUIRY_FORM_ENABLED;
  delete environment.PUBLIC_INQUIRY_FORM_MODE;
  delete environment.PUBLIC_TURNSTILE_SITE_KEY;
  Object.assign(environment, featureEnvironment);
  execFileSync(process.execPath, [astroBin, "build", "--outDir", output], {
    cwd: projectRoot,
    env: environment,
    stdio: "pipe",
  });
  return {
    en: readFileSync(join(output, "en", "contact", "index.html"), "utf8"),
    id: readFileSync(join(output, "id", "kontak", "index.html"), "utf8"),
  };
}

function decodeHtml(value) {
  return value
    .replace(/<[^>]+>/gu, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/gu, " ")
    .trim();
}

afterAll(() => {
  for (const output of buildRoots) rmSync(output, { recursive: true, force: true });
});

describe("gated inquiry builds", () => {
  it("keeps the default contact build free of forms while preserving direct CTA", () => {
    const pages = buildSite();
    for (const html of Object.values(pages)) {
      expect(html).not.toMatch(/<form\b/iu);
      expect(html).toContain("mailto:marketing@permatabriquettes.com");
      expect(html).toContain("https://wa.me/6281130887797");
    }
  }, 30_000);

  it("renders approved locale copy only in explicit local-mock mode", () => {
    const pages = buildSite({
      PUBLIC_INQUIRY_FORM_ENABLED: "true",
      PUBLIC_INQUIRY_FORM_MODE: "local-mock",
    });

    for (const [locale, html] of Object.entries(pages)) {
      const copy = INQUIRY_COPY[locale];
      const visible = decodeHtml(html);
      expect(html).toMatch(/<form\b/iu);
      expect(html).toContain('data-local-mock="true"');
      expect(html).not.toContain("challenges.cloudflare.com");
      expect(html).not.toMatch(/<input[^>]+type=["']file["']/iu);
      expect(html).toMatch(/name="name"[^>]+maxlength="100"/iu);
      expect(html).toMatch(/name="email"[^>]+maxlength="254"/iu);
      expect(html).toMatch(/name="company"[^>]+maxlength="150"/iu);
      expect(html).toMatch(/name="phone"[^>]+maxlength="30"/iu);
      expect(html).toMatch(/name="message"[^>]+maxlength="2000"/iu);
      expect(html).toMatch(/data-privacy-version="sha256-[a-f0-9]{64}"/u);
      expect(html).toMatch(/data-consent-version="sha256-[a-f0-9]{64}"/u);
      expect(visible).toContain(copy.warning);
      expect(visible).toContain(MARKETING_CONSENT_TEXT[locale]);
      for (const message of [
        copy.validation.name,
        copy.validation.emailRequired,
        copy.validation.emailInvalid,
        copy.validation.company,
        copy.validation.phone,
        copy.validation.message,
      ]) expect(html).toContain(message);
      expect(html).toContain(locale === "en" ? 'href="/en/privacy/"' : 'href="/id/privasi/"');
      const consentInput = html.match(/<input[^>]+name="marketingConsent"[^>]*>/iu)?.[0];
      expect(consentInput).toBeDefined();
      expect(consentInput).not.toMatch(/\schecked(?:\s|=|>)/iu);
      expect(consentInput).not.toMatch(/\srequired(?:\s|=|>)/iu);
    }
  }, 30_000);
});
