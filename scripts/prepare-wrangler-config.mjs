import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildDeployConfig } from "./inquiry-activation.mjs";

const environment = process.argv[2];
if (environment !== "staging" && environment !== "production") {
  throw new Error("Usage: npm run prepare:deploy-config -- <staging|production>");
}

const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID?.trim();
if (!databaseId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(databaseId)) {
  throw new Error("CLOUDFLARE_D1_DATABASE_ID must be a non-empty D1 UUID supplied outside Git.");
}

const sourcePath = resolve("wrangler.jsonc");
const outputPath = resolve("wrangler.deploy.jsonc");
const config = buildDeployConfig(JSON.parse(readFileSync(sourcePath, "utf8")), environment, databaseId, process.env);

writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });

const state = config.env[environment].vars.INQUIRY_ENABLED === "true"
  ? "inquiry is enabled for this target"
  : "inquiry remains disabled";
process.stdout.write(`Generated ignored deploy config for ${environment}; ${state}; cron stays empty.\n`);
