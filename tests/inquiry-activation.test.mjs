import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { buildDeployConfig, resolveBuildInquiryVariables } from "../scripts/inquiry-activation.mjs";

const projectRoot = process.cwd();
// A syntactically valid but non-sensitive dummy; never a real Turnstile key.
const DUMMY_SITE_KEY = "1x00000000000000000000AA";
const DATABASE_ID = "11111111-2222-4333-8444-555555555555";
const live = {
  PUBLIC_INQUIRY_FORM_ENABLED: "true",
  PUBLIC_INQUIRY_FORM_MODE: "live",
  PUBLIC_TURNSTILE_SITE_KEY: DUMMY_SITE_KEY,
};
const off = {
  PUBLIC_INQUIRY_FORM_ENABLED: "false",
  PUBLIC_INQUIRY_FORM_MODE: "off",
  PUBLIC_TURNSTILE_SITE_KEY: "",
};

describe("build-time inquiry guard", () => {
  it("lets staging enable the form with a complete live configuration", () => {
    expect(resolveBuildInquiryVariables("staging", live)).toEqual(live);
  });

  it("keeps staging disabled when no form variable is set", () => {
    expect(resolveBuildInquiryVariables("staging", {})).toEqual(off);
    expect(resolveBuildInquiryVariables("staging", { PUBLIC_INQUIRY_FORM_ENABLED: "" })).toEqual(off);
  });

  it("rejects an enabled staging form without a site key", () => {
    expect(() => resolveBuildInquiryVariables("staging", { ...live, PUBLIC_TURNSTILE_SITE_KEY: "" }))
      .toThrow(/PUBLIC_TURNSTILE_SITE_KEY is empty/u);
    expect(() => resolveBuildInquiryVariables("staging", { ...live, PUBLIC_TURNSTILE_SITE_KEY: "   " }))
      .toThrow(/PUBLIC_TURNSTILE_SITE_KEY is empty/u);
  });

  it("rejects an enabled staging form outside live mode or with a malformed key", () => {
    expect(() => resolveBuildInquiryVariables("staging", { ...live, PUBLIC_INQUIRY_FORM_MODE: "local-mock" }))
      .toThrow(/MODE must be "live"/u);
    expect(() => resolveBuildInquiryVariables("staging", { ...live, PUBLIC_INQUIRY_FORM_MODE: "" }))
      .toThrow(/MODE must be "live"/u);
    expect(() => resolveBuildInquiryVariables("staging", { ...live, PUBLIC_TURNSTILE_SITE_KEY: "not a key" }))
      .toThrow(/does not look like/u);
  });

  it("rejects a half-configured staging build instead of silently disabling the form", () => {
    expect(() => resolveBuildInquiryVariables("staging", { PUBLIC_TURNSTILE_SITE_KEY: DUMMY_SITE_KEY }))
      .toThrow(/Set all three or none/u);
    expect(() => resolveBuildInquiryVariables("staging", { PUBLIC_INQUIRY_FORM_MODE: "live" }))
      .toThrow(/Set all three or none/u);
  });

  it("lets production enable the form with a complete live configuration", () => {
    expect(resolveBuildInquiryVariables("production", live)).toEqual(live);
  });

  it("keeps production disabled when no form variable is set and accepts explicit off values", () => {
    expect(resolveBuildInquiryVariables("production", {})).toEqual(off);
    expect(resolveBuildInquiryVariables("production", off)).toEqual(off);
  });

  it.each([
    ["without a site key", { ...live, PUBLIC_TURNSTILE_SITE_KEY: "" }, /PUBLIC_TURNSTILE_SITE_KEY is empty/u],
    ["outside live mode", { ...live, PUBLIC_INQUIRY_FORM_MODE: "local-mock" }, /MODE must be "live"/u],
    ["with a malformed site key", { ...live, PUBLIC_TURNSTILE_SITE_KEY: "not a key" }, /does not look like/u],
    ["half configured (key only)", { PUBLIC_TURNSTILE_SITE_KEY: DUMMY_SITE_KEY }, /Set all three or none/u],
    ["half configured (live mode only)", { PUBLIC_INQUIRY_FORM_MODE: "live" }, /Set all three or none/u],
  ])("rejects a production build with the form enabled %s", (_name, variables, message) => {
    expect(() => resolveBuildInquiryVariables("production", variables)).toThrow(message);
  });

  it("refuses to enable the form for an unknown target", () => {
    expect(() => resolveBuildInquiryVariables("preview", live)).toThrow(/Refusing to build preview/u);
  });
});

describe("deploy configuration guard", () => {
  const source = JSON.parse(readFileSync(join(projectRoot, "wrangler.jsonc"), "utf8"));

  it("keeps the committed configuration fail closed in every environment", () => {
    expect(source.vars.INQUIRY_ENABLED).toBe("false");
    expect(source.env.staging.vars.INQUIRY_ENABLED).toBe("false");
    expect(source.env.production.vars.INQUIRY_ENABLED).toBe("false");
    for (const target of ["staging", "production"]) {
      expect(source.env[target].triggers.crons).toEqual([]);
    }
  });

  it.each(["staging", "production"])("enables the inquiry Worker only in the generated %s config, with no cron", (target) => {
    const config = buildDeployConfig(source, target, DATABASE_ID);
    expect(Object.keys(config.env)).toEqual([target]);
    expect(config.env[target].vars.INQUIRY_ENABLED).toBe("true");
    expect(config.env[target].vars.RUNTIME_MODE).toBe(target);
    expect(config.env[target].vars.USE_LOCAL_MOCKS).toBe("false");
    expect(config.env[target].triggers.crons).toEqual([]);
    expect(config.env[target].d1_databases[0].database_id).toBe(DATABASE_ID);
    expect(source.env[target].vars.INQUIRY_ENABLED).toBe("false");
  });

  it("refuses a source whose committed INQUIRY_ENABLED is not false", () => {
    for (const target of ["staging", "production"]) {
      const tampered = structuredClone(source);
      tampered.env[target].vars.INQUIRY_ENABLED = "true";
      expect(() => buildDeployConfig(tampered, target, DATABASE_ID)).toThrow(/INQUIRY_ENABLED="false"/u);
    }
  });

  it("refuses any target that declares cron triggers", () => {
    for (const target of ["staging", "production"]) {
      const tampered = structuredClone(source);
      tampered.env[target].triggers.crons = ["*/5 * * * *"];
      expect(() => buildDeployConfig(tampered, target, DATABASE_ID)).toThrow(/cron triggers must remain empty/u);
    }
  });
});

describe("safe environment builds", () => {
  const outputs = [];
  const buildScript = join(projectRoot, "scripts", "build-environment.mjs");

  function cleanEnvironment(extra = {}) {
    const environment = { ...process.env };
    for (const name of [
      "SITE_ENV",
      "PUBLIC_INQUIRY_FORM_ENABLED",
      "PUBLIC_INQUIRY_FORM_MODE",
      "PUBLIC_TURNSTILE_SITE_KEY",
    ]) {
      delete environment[name];
    }
    return { ...environment, ...extra };
  }

  function build(target, extra) {
    const output = mkdtempSync(join(tmpdir(), `permata-activation-${target}-`));
    outputs.push(output);
    const result = spawnSync(process.execPath, [buildScript, target, "--outDir", output], {
      cwd: projectRoot,
      env: cleanEnvironment(extra),
      encoding: "utf8",
    });
    return { output, result, read: (path) => readFileSync(join(output, path), "utf8") };
  }

  afterAll(() => {
    for (const output of outputs) rmSync(output, { recursive: true, force: true });
  });

  it("renders the live form on both contact pages for a complete staging build, and the audit passes", () => {
    const { output, result, read } = build("staging", live);
    expect(result.status, result.stderr).toBe(0);
    for (const path of ["en/contact/index.html", "id/kontak/index.html"]) {
      const html = read(path);
      expect(html).toContain("data-inquiry-form");
      expect(html).toContain(`data-sitekey="${DUMMY_SITE_KEY}"`);
      expect(html).toContain("challenges.cloudflare.com");
      expect(html).not.toContain("local-turnstile-pass");
      expect(html).not.toMatch(/type="file"/u);
      expect(html).toContain("mailto:marketing@permatabriquettes.com");
    }
    expect(read("en/index.html")).not.toContain("challenges.cloudflare.com");
    execFileSync(
      process.execPath,
      ["scripts/audit-static-build.mjs", "--dir", output, "--environment", "staging", "--analytics", "absent", "--quiet"],
      { cwd: projectRoot, stdio: "pipe" },
    );
  }, 120_000);

  it("fails a staging build that enables the form without a site key", () => {
    const { result } = build("staging", { ...live, PUBLIC_TURNSTILE_SITE_KEY: "" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/PUBLIC_TURNSTILE_SITE_KEY is empty/u);
  }, 30_000);

  it("renders the live form on both contact pages for a complete production build, and the audit passes", () => {
    const { output, result, read } = build("production", live);
    expect(result.status, result.stderr).toBe(0);
    for (const path of ["en/contact/index.html", "id/kontak/index.html"]) {
      const html = read(path);
      expect(html).toContain("data-inquiry-form");
      expect(html).toContain(`data-sitekey="${DUMMY_SITE_KEY}"`);
      expect(html).toContain("challenges.cloudflare.com");
      expect(html).not.toContain("local-turnstile-pass");
      expect(html).toContain("mailto:marketing@permatabriquettes.com");
    }
    expect(read("en/index.html")).toContain('content="index, follow"');
    execFileSync(
      process.execPath,
      ["scripts/audit-static-build.mjs", "--dir", output, "--environment", "production", "--analytics", "absent", "--quiet"],
      { cwd: projectRoot, stdio: "pipe" },
    );
  }, 120_000);

  it.each([
    ["without a site key", { ...live, PUBLIC_TURNSTILE_SITE_KEY: "" }, /PUBLIC_TURNSTILE_SITE_KEY is empty/u],
    ["half configured", { PUBLIC_TURNSTILE_SITE_KEY: DUMMY_SITE_KEY }, /Set all three or none/u],
  ])("fails a production build that enables the form %s", (_name, extra, message) => {
    const { result } = build("production", extra);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(message);
  }, 30_000);

  it("keeps a production build without form variables free of the form and of Turnstile", () => {
    const { result, read } = build("production");
    expect(result.status, result.stderr).toBe(0);
    for (const path of ["en/contact/index.html", "id/kontak/index.html"]) {
      const html = read(path);
      expect(html).not.toMatch(/<form\b/iu);
      expect(html).not.toContain("challenges.cloudflare.com");
      expect(html).toContain("mailto:marketing@permatabriquettes.com");
    }
  }, 120_000);
});
