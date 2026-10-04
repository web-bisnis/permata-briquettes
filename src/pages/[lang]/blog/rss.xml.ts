import type { APIRoute } from "astro";
import { createBlogFeed, type BlogLocale } from "../../../config/blog";
import { toAbsoluteUrl } from "../../../config/seo";
import { loadBlog } from "../../../lib/blog";

export const prerender = true;

// A language without published articles gets no feed file at all.
export async function getStaticPaths() {
  const { posts } = await loadBlog();
  return (["en", "id"] as const)
    .filter((locale) => posts[locale].length > 0)
    .map((locale) => ({ params: { lang: locale } }));
}

export const GET: APIRoute = async ({ params }) => {
  const locale = params.lang as BlogLocale;
  const { posts } = await loadBlog();
  const body = createBlogFeed(
    locale,
    posts[locale].map((post) => ({
      title: post.entry.data.title,
      description: post.entry.data.description,
      url: toAbsoluteUrl(post.route),
      date: post.entry.data.date,
    })),
  );
  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
};
