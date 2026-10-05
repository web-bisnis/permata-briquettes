import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { INQUIRY_SUCCESS_COPY, INQUIRY_SUCCESS_PATH } from "../src/config/inquiry-copy";

const projectRoot = process.cwd();
const astroBin = join(projectRoot, "node_modules", "astro", "bin", "astro.mjs");
const buildRoots = [];

function buildSite(featureEnvironment = {}) {
  const output = mkdtempSync(join(tmpdir(), "permata-inquiry-success-"));
  buildRoots.push(output);
  const environment = { ...process.env };
  delete environment.PUBLIC_INQUIRY_FORM_ENABLED;
  delete environment.PUBLIC_INQUIRY_FORM_MODE;
  delete environment.PUBLIC_TURNSTILE_SITE_KEY;
  Object.assign(environment, featureEnvironment);
  execFileSync(process.execPath, [astroBin, "build", "--outDir", output], {
    cwd: projectRoot,
    env: environment,
    stdio: "pipe",
  });
  return output;
}

const pagePath = (output, route) => join(output, ...route.split("/").filter(Boolean), "index.html");

afterAll(() => {
  for (const output of buildRoots) rmSync(output, { recursive: true, force: true });
});

describe("inquiry confirmation page", () => {
  it("is absent from a build where the form is off", () => {
    const output = buildSite();
    for (const route of Object.values(INQUIRY_SUCCESS_PATH)) {
      expect(existsSync(pagePath(output, route))).toBe(false);
    }
  }, 60_000);

  it("is built in both locales, noindex and pointing back at the form target, when the form is on", () => {
    const output = buildSite({
      PUBLIC_INQUIRY_FORM_ENABLED: "true",
      PUBLIC_INQUIRY_FORM_MODE: "local-mock",
    });

    for (const locale of ["en", "id"]) {
      const route = INQUIRY_SUCCESS_PATH[locale];
      const copy = INQUIRY_SUCCESS_COPY[locale];
      const html = readFileSync(pagePath(output, route), "utf8");
      expect(html).toContain(`<title>${copy.title}</title>`);
      expect(html).toContain(copy.lead);
      expect(html).toMatch(/name="robots" content="noindex, nofollow"/u);
      expect(html).toContain(`href="${copy.primaryHref}"`);

      const contact = readFileSync(
        pagePath(output, locale === "en" ? "/en/contact/" : "/id/kontak/"),
        "utf8",
      );
      expect(contact).toContain(`data-success-href="${route}"`);
    }

    expect(readFileSync(join(output, "sitemap.xml"), "utf8")).not.toMatch(
      /inquiry-received|inquiry-diterima/u,
    );
  }, 60_000);
});
