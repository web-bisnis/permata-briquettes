import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

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
const config = JSON.parse(readFileSync(sourcePath, "utf8"));
const selected = config.env?.[environment];

if (!selected) throw new Error(`Wrangler environment is missing: ${environment}`);
if (selected.vars?.INQUIRY_ENABLED !== "false") {
  throw new Error(`${environment} must remain fail closed for the initial deployment.`);
}
if (selected.triggers?.crons?.length !== 0) {
  throw new Error(`${environment} cron triggers must remain empty.`);
}

const databases = selected.d1_databases;
if (!Array.isArray(databases) || databases.length !== 1 || databases[0].binding !== "DB") {
  throw new Error(`${environment} must declare exactly one D1 binding named DB.`);
}

databases[0].database_id = databaseId;
config.env = { [environment]: selected };
writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });

process.stdout.write(
  `Generated ignored deploy config for ${environment}; inquiry and cron remain disabled.\n`,
);
