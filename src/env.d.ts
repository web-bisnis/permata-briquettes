interface ImportMetaEnv {
  readonly SITE_ENV?: "local" | "staging" | "production";
  readonly PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED?: "true" | "false";
  readonly PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
