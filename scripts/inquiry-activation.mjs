// Single source of truth for which environments may switch the inquiry form on.
// Staging and production are both activatable; any other target must stay
// disabled and fails loudly if anything tries to enable it. Shared by the build
// and deploy-config scripts.

const FORM_VARIABLES = [
  "PUBLIC_INQUIRY_FORM_ENABLED",
  "PUBLIC_INQUIRY_FORM_MODE",
  "PUBLIC_TURNSTILE_SITE_KEY",
];

const ACTIVATABLE_ENVIRONMENTS = new Set(["staging", "production"]);

// Public Turnstile site keys are 20+ URL-safe characters; real keys start 0x4,
// test keys 1x/2x/3x. Reject empty, spaced, or implausibly short values.
const SITE_KEY_PATTERN = /^[0-9A-Za-z_-]{16,64}$/u;

function value(environment, name) {
  return environment[name]?.trim() ?? "";
}

/**
 * Returns the public form variables a build for `target` must use.
 * Throws when an activatable environment is asked to enable the form without a
 * usable live configuration (all three variables, or none).
 */
export function resolveBuildInquiryVariables(target, environment) {
  const requested = value(environment, "PUBLIC_INQUIRY_FORM_ENABLED");
  const mode = value(environment, "PUBLIC_INQUIRY_FORM_MODE");
  const siteKey = value(environment, "PUBLIC_TURNSTILE_SITE_KEY");

  if (!ACTIVATABLE_ENVIRONMENTS.has(target)) {
    const attempted = FORM_VARIABLES.filter((name) => {
      const current = value(environment, name);
      if (name === "PUBLIC_INQUIRY_FORM_ENABLED") return current !== "" && current !== "false";
      if (name === "PUBLIC_INQUIRY_FORM_MODE") return current !== "" && current !== "off";
      return current !== "";
    });
    if (attempted.length > 0) {
      throw new Error(
        `Refusing to build ${target}: the inquiry form must stay disabled there, `
        + `but these variables try to enable it: ${attempted.join(", ")}.`,
      );
    }
    return { PUBLIC_INQUIRY_FORM_ENABLED: "false", PUBLIC_INQUIRY_FORM_MODE: "off", PUBLIC_TURNSTILE_SITE_KEY: "" };
  }

  if (requested !== "true") {
    if (mode === "live" || siteKey !== "") {
      throw new Error(
        `Refusing to build ${target}: PUBLIC_INQUIRY_FORM_MODE/PUBLIC_TURNSTILE_SITE_KEY are set `
        + "but PUBLIC_INQUIRY_FORM_ENABLED is not \"true\". Set all three or none.",
      );
    }
    return { PUBLIC_INQUIRY_FORM_ENABLED: "false", PUBLIC_INQUIRY_FORM_MODE: "off", PUBLIC_TURNSTILE_SITE_KEY: "" };
  }

  if (mode !== "live") {
    throw new Error(
      `Refusing to build ${target} with the inquiry form enabled: PUBLIC_INQUIRY_FORM_MODE must be "live", received "${mode || "(empty)"}".`,
    );
  }
  if (siteKey === "") {
    throw new Error(
      `Refusing to build ${target} with the inquiry form enabled: PUBLIC_TURNSTILE_SITE_KEY is empty. `
      + "Set the Turnstile site key (a public value) before building.",
    );
  }
  if (!SITE_KEY_PATTERN.test(siteKey)) {
    throw new Error(
      `Refusing to build ${target} with the inquiry form enabled: PUBLIC_TURNSTILE_SITE_KEY does not look like a Turnstile site key.`,
    );
  }
  return {
    PUBLIC_INQUIRY_FORM_ENABLED: "true",
    PUBLIC_INQUIRY_FORM_MODE: "live",
    PUBLIC_TURNSTILE_SITE_KEY: siteKey,
  };
}

/**
 * Builds the ignored deploy config for one target from the committed
 * wrangler.jsonc. The committed file stays fail-closed ("false") everywhere;
 * only the generated config turns the Worker on. Cron stays empty.
 */
export function buildDeployConfig(source, target, databaseId, environment = {}) {
  const selected = source.env?.[target];
  if (!selected) throw new Error(`Wrangler environment is missing: ${target}`);

  if (selected.vars?.INQUIRY_ENABLED !== "false") {
    throw new Error(`${target} in wrangler.jsonc must keep INQUIRY_ENABLED="false"; activation is applied only to the generated config.`);
  }
  if (selected.triggers?.crons?.length !== 0) {
    throw new Error(`${target} cron triggers must remain empty.`);
  }

  const databases = selected.d1_databases;
  if (!Array.isArray(databases) || databases.length !== 1 || databases[0].binding !== "DB") {
    throw new Error(`${target} must declare exactly one D1 binding named DB.`);
  }

  const activate = ACTIVATABLE_ENVIRONMENTS.has(target);
  if (!activate && value(environment, "INQUIRY_ENABLED") === "true") {
    throw new Error(`Refusing to prepare ${target}: INQUIRY_ENABLED=true is not allowed there.`);
  }

  const config = structuredClone(source);
  const generated = config.env[target];
  generated.d1_databases[0].database_id = databaseId;
  generated.vars.INQUIRY_ENABLED = activate ? "true" : "false";
  generated.triggers = { crons: [] };
  config.env = { [target]: generated };
  return config;
}
