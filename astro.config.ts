import { defineConfig } from "astro/config";
import { CSP_DIRECTIVES } from "./src/config/security";

export default defineConfig({
  output: "static",
  // Shiki writes inline styles that the page CSP blocks; the site has no code blocks.
  markdown: { syntaxHighlight: false },
  site: "https://www.permatabriquettes.com",
  security: {
    csp: {
      directives: [...CSP_DIRECTIVES],
    },
  },
});
