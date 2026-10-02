import { spawn } from "node:child_process";
import { join } from "node:path";

// Starts the dev server with the component gallery enabled:
// /en/component-gallery/ and /id/component-gallery/.
const astroBin = join(process.cwd(), "node_modules", "astro", "bin", "astro.mjs");
const child = spawn(process.execPath, [astroBin, "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, PUBLIC_COMPONENT_GALLERY: "true" },
});
child.on("exit", (code) => process.exit(code ?? 0));
