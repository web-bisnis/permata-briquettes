import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { ROOT_SEO, toAbsoluteUrl } from "../config/seo";

export const prerender = true;

export const GET: APIRoute = async () => {
  const pages = await getCollection("pages");
  const routes = [
    ...(ROOT_SEO.indexable ? [ROOT_SEO.route] : []),
    ...pages.filter((page) => page.data.indexable).map((page) => page.data.route),
  ].sort((left, right) => left.localeCompare(right));

  const urls = routes
    .map((route) => `  <url><loc>${toAbsoluteUrl(route)}</loc></url>`)
    .join("\n");
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
