import type { APIContext } from "astro";

// Runs before first paint so a saved theme never flashes. Rendered with
// `is:inline`, so Astro does not hash it; registerPageCsp adds its hash.
export const THEME_BOOTSTRAP_SCRIPT = `(() => {
  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.dataset.theme = savedTheme;
    }
  } catch {}
})();`;

export async function sha256Source(source: string): Promise<`sha256-${string}`> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return `sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}`;
}

export const THEME_BOOTSTRAP_HASH = await sha256Source(THEME_BOOTSTRAP_SCRIPT);

// Added to every page's CSP <meta>. Astro supplies script-src and style-src.
// frame-ancestors cannot be set from <meta>; public/_headers sends it.
export const CSP_DIRECTIVES = [
  "default-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
] as const;

interface ThirdPartyScripts {
  analytics: boolean;
  turnstile?: boolean;
}

// The CSP <meta> is written when <head> renders, so this must run in page or
// layout frontmatter, never in a component placed later in <body>.
export function registerPageCsp(
  csp: APIContext["csp"] | undefined,
  scripts: ThirdPartyScripts,
): void {
  if (!csp) return;
  csp.insertScriptHash(THEME_BOOTSTRAP_HASH);
  // Inserting any script resource replaces Astro's default 'self', which the
  // bundled /_astro/*.js files need.
  if (scripts.analytics || scripts.turnstile) csp.insertScriptResource("'self'");
  if (scripts.analytics) {
    csp.insertScriptResource("https://static.cloudflareinsights.com");
    csp.insertDirective("connect-src 'self' https://cloudflareinsights.com");
  }
  if (scripts.turnstile) {
    csp.insertScriptResource("https://challenges.cloudflare.com");
    csp.insertDirective("frame-src https://challenges.cloudflare.com");
  }
}
