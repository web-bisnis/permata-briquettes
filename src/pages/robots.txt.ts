import type { APIRoute } from "astro";
import {
  resolveSiteEnvironment,
  SITE_ORIGIN,
} from "../config/seo";

export const prerender = true;

export const GET: APIRoute = () => {
  const environment = resolveSiteEnvironment(import.meta.env.SITE_ENV);
  const lines = environment === "production"
    ? ["User-agent: *", "Allow: /", `Sitemap: ${SITE_ORIGIN}/sitemap.xml`]
    : ["User-agent: *", "Disallow: /"];

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
