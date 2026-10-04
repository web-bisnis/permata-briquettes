interface ImportMetaEnv {
  readonly SITE_ENV?: "local" | "staging" | "production";
  readonly PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED?: "true" | "false";
  readonly PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN?: string;
  /** Local `astro dev` only; builds ignore it. */
  readonly PUBLIC_BLOG_PREVIEW_DRAFTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
