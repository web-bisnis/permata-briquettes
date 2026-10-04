import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { resolveBuildInquiryVariables } from "./inquiry-activation.mjs";

const environment = process.argv[2];
if (environment !== "staging" && environment !== "production") {
  throw new Error("Usage: node scripts/build-environment.mjs <staging|production> [astro build args]");
}

const buildEnvironment = {
  ...process.env,
  SITE_ENV: environment,
  // Staging may enable the form (all three variables, validated); production
  // throws if any of them tries to.
  ...resolveBuildInquiryVariables(environment, process.env),
  PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED: "false",
};

delete buildEnvironment.PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN;
// Draft preview is for `astro dev` only; a deployed build must never see it.
delete buildEnvironment.PUBLIC_BLOG_PREVIEW_DRAFTS;

const astro = join(process.cwd(), "node_modules", "astro", "bin", "astro.mjs");
const result = spawnSync(process.execPath, [astro, "build", ...process.argv.slice(3)], {
  cwd: process.cwd(),
  env: buildEnvironment,
  stdio: "inherit",
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const formState = buildEnvironment.PUBLIC_INQUIRY_FORM_ENABLED === "true"
  ? "inquiry form enabled (live)"
  : "inquiry form disabled";
process.stdout.write(
  `Safe ${environment} build complete: ${formState}; Cloudflare Web Analytics disabled.\n`,
);
