import { spawnSync } from "node:child_process";
import { join } from "node:path";

const environment = process.argv[2];
if (environment !== "staging" && environment !== "production") {
  throw new Error("Usage: node scripts/build-environment.mjs <staging|production>");
}

const buildEnvironment = {
  ...process.env,
  SITE_ENV: environment,
  PUBLIC_INQUIRY_FORM_ENABLED: "false",
  PUBLIC_INQUIRY_FORM_MODE: "off",
  PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED: "false",
};

delete buildEnvironment.PUBLIC_TURNSTILE_SITE_KEY;
delete buildEnvironment.PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN;
// Draft preview is for `astro dev` only; a deployed build must never see it.
delete buildEnvironment.PUBLIC_BLOG_PREVIEW_DRAFTS;

const astro = join(process.cwd(), "node_modules", "astro", "bin", "astro.mjs");
const result = spawnSync(process.execPath, [astro, "build"], {
  cwd: process.cwd(),
  env: buildEnvironment,
  stdio: "inherit",
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

process.stdout.write(
  `Safe ${environment} build complete: inquiry form disabled; Cloudflare Web Analytics disabled.\n`,
);
