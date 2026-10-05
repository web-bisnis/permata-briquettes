import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inspectContactPage, inspectInquiryProbes, parseAttributes } from "../scripts/smoke-checks.mjs";

const projectRoot = process.cwd();
// A syntactically valid, non-sensitive dummy key for local builds only.
const DUMMY_SITE_KEY = "1x00000000000000000000AA";
const PAGES = ["en/contact/index.html", "id/kontak/index.html"];
const outputs = [];

function build(target, extra = {}) {
  const output = mkdtempSync(join(tmpdir(), `permata-smoke-${target}-`));
  outputs.push(output);
  const environment = { ...process.env };
  for (const name of ["SITE_ENV", "PUBLIC_INQUIRY_FORM_ENABLED", "PUBLIC_INQUIRY_FORM_MODE", "PUBLIC_TURNSTILE_SITE_KEY"]) {
    delete environment[name];
  }
  const result = spawnSync(
    process.execPath,
    [join(projectRoot, "scripts", "build-environment.mjs"), target, "--outDir", output],
    { cwd: projectRoot, env: { ...environment, ...extra }, encoding: "utf8" },
  );
  expect(result.status, result.stderr).toBe(0);
  return (path) => readFileSync(join(output, path), "utf8");
}

const failures = (results) => results.filter((result) => !result.ok).map((result) => result.message);

let staging;
let productionLive;
let production;

beforeAll(() => {
  staging = build("staging", {
    PUBLIC_INQUIRY_FORM_ENABLED: "true",
    PUBLIC_INQUIRY_FORM_MODE: "live",
    PUBLIC_TURNSTILE_SITE_KEY: DUMMY_SITE_KEY,
  });
  productionLive = build("production", {
    PUBLIC_INQUIRY_FORM_ENABLED: "true",
    PUBLIC_INQUIRY_FORM_MODE: "live",
    PUBLIC_TURNSTILE_SITE_KEY: DUMMY_SITE_KEY,
  });
  // A production build without form variables: the form stays off.
  production = build("production");
}, 120_000);

afterAll(() => {
  for (const output of outputs) rmSync(output, { recursive: true, force: true });
});

describe("smoke contact-page checks on staging HTML", () => {
  it.each(PAGES)("pass against the local staging build: %s", (page) => {
    expect(failures(inspectContactPage(`/${page}`, staging(page), { formExpected: true }))).toEqual([]);
  });

  it("fail when the <form> element is removed but its attributes and text remain", () => {
    for (const page of PAGES) {
      const mangled = staging(page).replace(/<form(?=[\s>/])/giu, "<div").replace("</form>", "</div>");
      const messages = failures(inspectContactPage(`/${page}`, mangled, { formExpected: true }));
      expect(messages.join("\n")).toMatch(/exactly one inquiry <form/u);
    }
  });

  it("fail when the marker exists only as text, not on a real <form>", () => {
    const html = "<main><p>data-inquiry-form</p><div data-inquiry-form></div></main>";
    expect(failures(inspectContactPage("/x/", html, { formExpected: true }))
      .some((message) => message.includes("exactly one inquiry <form"))).toBe(true);
  });

  it("fail when Turnstile, the site key, or the mock-token guard regresses", () => {
    const page = PAGES[0];
    const withoutKey = staging(page).replace(/data-sitekey="[^"]*"/u, 'data-sitekey=""');
    expect(failures(inspectContactPage("/x/", withoutKey, { formExpected: true })).join("\n")).toMatch(/site key/u);
    const withMock = staging(page).replace("</form>", '<input type="hidden" value="local-turnstile-pass"></form>');
    expect(failures(inspectContactPage("/x/", withMock, { formExpected: true })).join("\n")).toMatch(/mock token/u);
  });

  it("fail on any file input, however its type attribute is quoted", () => {
    for (const markup of ['type="file"', "type='file'", "type=file"]) {
      const html = staging(PAGES[0]).replace("</form>", `<input ${markup} name="upload"></form>`);
      expect(failures(inspectContactPage("/x/", html, { formExpected: true })).join("\n")).toMatch(/file input/u);
    }
  });

  it("fail when the email or WhatsApp CTA disappears", () => {
    const html = staging(PAGES[0]).replaceAll("mailto:marketing@permatabriquettes.com", "mailto:x@example.invalid");
    expect(failures(inspectContactPage("/x/", html, { formExpected: true })).join("\n")).toMatch(/email CTA/u);
    const noWhatsApp = staging(PAGES[0]).replaceAll("https://wa.me/6281130887797", "https://wa.me/0");
    expect(failures(inspectContactPage("/x/", noWhatsApp, { formExpected: true })).join("\n")).toMatch(/WhatsApp CTA/u);
  });
});

describe("smoke contact-page checks on production HTML with the form enabled", () => {
  it.each(PAGES)("pass against the local production build with the live form: %s", (page) => {
    expect(failures(inspectContactPage(`/${page}`, productionLive(page), { formExpected: true }))).toEqual([]);
  });
});

describe("smoke contact-page checks on a build without the form", () => {
  it.each(PAGES)("pass against a local production build without form variables: %s", (page) => {
    expect(failures(inspectContactPage(`/${page}`, production(page), { formExpected: false }))).toEqual([]);
  });

  it("a production build without form variables really contains no form markup at all", () => {
    for (const page of PAGES) {
      const html = production(page);
      expect(html).not.toMatch(/<form(?=[\s>/])/iu);
      expect(html).not.toContain("data-inquiry-form");
      expect(html).not.toContain("challenges.cloudflare.com");
    }
  });

  it("fail when a form appears where none is expected", () => {
    for (const page of PAGES) {
      const messages = failures(inspectContactPage(`/${page}`, staging(page), { formExpected: false }));
      expect(messages.join("\n")).toMatch(/no <form> element/u);
      expect(messages.join("\n")).toMatch(/data-inquiry-form marker/u);
      expect(messages.join("\n")).toMatch(/Turnstile is absent/u);
    }
  });

  it("fail on a bare <form> or an attribute-only marker", () => {
    const base = production(PAGES[0]);
    expect(failures(inspectContactPage("/x/", base.replace("</main>", "<form></form></main>"), { formExpected: false })))
      .toContain("/x/ inquiry form is absent (no <form> element)");
    expect(failures(inspectContactPage("/x/", base.replace("</main>", "<div data-inquiry-form></div></main>"), { formExpected: false })))
      .toContain("/x/ has no data-inquiry-form marker");
  });
});

describe("smoke probe checks", () => {
  const response = (status, code) => ({ status, body: JSON.stringify({ ok: false, code }) });

  it("accept 405 from a configured staging Worker and reject 503", () => {
    const ok = { formExpected: true, inquiry: response(405, "method_not_allowed"), webhook: response(405, "method_not_allowed") };
    expect(failures(inspectInquiryProbes(ok))).toEqual([]);
    const closed = { formExpected: true, inquiry: response(503, "inquiry_unavailable"), webhook: response(503, "webhook_unavailable") };
    expect(failures(inspectInquiryProbes(closed))).toHaveLength(3);
  });

  it("require the closed gate when no form is expected", () => {
    const closed = { formExpected: false, inquiry: response(503, "inquiry_unavailable"), webhook: response(503, "webhook_unavailable") };
    expect(failures(inspectInquiryProbes(closed))).toEqual([]);
    const open = { formExpected: false, inquiry: response(405, "method_not_allowed"), webhook: response(405, "method_not_allowed") };
    expect(failures(inspectInquiryProbes(open))).toHaveLength(3);
  });
});

describe("attribute parsing", () => {
  it("handles valueless, quoted, and unquoted attributes", () => {
    expect(parseAttributes('<form class="a b" action=/api/inquiries data-inquiry-form novalidate>')).toEqual({
      class: "a b",
      action: "/api/inquiries",
      "data-inquiry-form": "",
      novalidate: "",
    });
  });
});

describe("smoke script source hygiene", () => {
  it.each(["scripts/smoke-deployment.mjs", "scripts/smoke-checks.mjs"])(
    "%s contains no stray control characters (a backspace once broke a form regex)",
    (file) => {
      const source = readFileSync(join(projectRoot, file), "utf8");
      // Allow tab, LF, and CR only.
      expect(source).not.toMatch(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u);
    },
  );
});
