import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const BASE_URL = "https://staging.permatabriquettes.com";
const PRODUCTION_ORIGIN = "https://www.permatabriquettes.com";
const REDIRECT_QUERY = "qa_redirect=path-query";
const audit = JSON.parse(readFileSync(resolve("reports/audits/07-staging.json"), "utf8"));
const routes = audit.pages.map((page) => page.route);
const routeSet = new Set(routes);
const failures = [];

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/gu)) {
    result[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "giu"))].map((match) => match[0]);
}

function elements(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)<\\/${name}>`, "giu"))];
}

function plainText(value) {
  return decodeHtml(value.replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim());
}

function record(condition, message) {
  if (!condition) failures.push(message);
  return condition;
}

async function request(url, options = {}) {
  return fetch(url, {
    cache: "no-store",
    redirect: options.redirect ?? "follow",
    headers: { "User-Agent": "permata-briquettes-final-qa-read-only/1.0" },
  });
}

const pages = [];
for (const route of routes) {
  const httpsResponse = await request(`${BASE_URL}${route}`);
  const html = await httpsResponse.text();
  const httpUrl = `http://staging.permatabriquettes.com${route}?${REDIRECT_QUERY}`;
  const expectedRedirect = `${BASE_URL}${route}?${REDIRECT_QUERY}`;
  const httpResponse = await request(httpUrl, { redirect: "manual" });
  const httpBody = await httpResponse.text();
  const httpLocation = httpResponse.headers.get("location");
  const title = elements(html, "title").map((match) => plainText(match[2]));
  const meta = tags(html, "meta").map(attributes);
  const links = tags(html, "link").map(attributes);
  const anchors = elements(html, "a").map((match) => ({ ...attributes(match[1]), text: plainText(match[2]) }));
  const hrefs = anchors.map((anchor) => anchor.href).filter(Boolean);
  const canonical = links.filter((link) => link.rel === "canonical").map((link) => link.href);
  const hreflang = Object.fromEntries(
    links
      .filter((link) => link.rel === "alternate" && link.hreflang)
      .map((link) => [link.hreflang, link.href]),
  );
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/giu)]
    .map((match) => ({ level: Number(match[1]), text: plainText(match[2]) }));
  const ids = new Set(
    [...html.matchAll(/\sid=(?:"([^"]+)"|'([^']+)')/giu)].map((match) => match[1] ?? match[2]),
  );
  const internalLinks = hrefs.filter((href) => href.startsWith("/"));
  const brokenInternalLinks = [];
  for (const href of internalLinks) {
    const target = new URL(href, BASE_URL);
    if (!routeSet.has(target.pathname)) brokenInternalLinks.push(href);
    if (target.pathname === route && target.hash && !ids.has(target.hash.slice(1))) brokenInternalLinks.push(href);
  }
  const scripts = tags(html, "script").map(attributes);
  const scriptSources = scripts.map((script) => script.src).filter(Boolean);
  const emailCtas = hrefs.filter((href) => href === "mailto:marketing@permatabriquettes.com");
  const whatsappCtas = hrefs.filter((href) => href === "https://wa.me/6281130887797");
  const expected = audit.pages.find((page) => page.route === route);
  const ownLanguage = route === "/" ? null : route.split("/")[1];
  const expectedContactCtas = route === "/en/contact/" || route === "/id/kontak/";

  record(httpsResponse.ok, `${route}: HTTPS returned ${httpsResponse.status}`);
  record(httpsResponse.url.startsWith(BASE_URL), `${route}: HTTPS left the staging host`);
  record([301, 302, 307, 308].includes(httpResponse.status), `${route}: HTTP did not redirect (${httpResponse.status})`);
  record(httpLocation === expectedRedirect, `${route}: HTTP redirect does not preserve the staging host, path, and query`);
  record(httpsResponse.headers.get("strict-transport-security") === null, `${route}: HSTS must remain absent pending a separate rollout decision`);
  record(title.length === 1 && title[0] === expected.title, `${route}: title differs from audited build`);
  record(canonical.length === 1 && canonical[0] === expected.canonical, `${route}: canonical differs from audited build`);
  record(meta.find((entry) => entry.name === "robots")?.content === "noindex, nofollow", `${route}: robots is not fail closed`);
  record(JSON.stringify(hreflang) === JSON.stringify(expected.hreflang), `${route}: hreflang differs from audited build`);
  record(brokenInternalLinks.length === 0, `${route}: broken internal links: ${brokenInternalLinks.join(", ")}`);
  record(headings.filter((heading) => heading.level === 1).length === 1, `${route}: expected exactly one h1`);
  record(headings[0]?.level === 1, `${route}: first heading is not h1`);
  record(tags(html, "main").length === 1, `${route}: expected one main landmark`);
  record(tags(html, "header").length >= 1, `${route}: expected a header landmark`);
  record(tags(html, "nav").length >= (route === "/" ? 0 : 2), `${route}: navigation landmarks are incomplete`);
  record(tags(html, "footer").length === (route === "/" ? 0 : 1), `${route}: footer landmark count is incorrect`);
  record(hrefs.includes("#main-content") && ids.has("main-content"), `${route}: skip link or target is missing`);
  record(!/<form\b/iu.test(html), `${route}: active form found`);
  record(!/<input\b[^>]*\btype=["']?file/iu.test(html), `${route}: file input found`);
  record(!/static\.cloudflareinsights\.com|data-cf-beacon/iu.test(html), `${route}: analytics found`);
  record(!/challenges\.cloudflare\.com|turnstile/iu.test(html), `${route}: Turnstile found`);
  record(scriptSources.length === 0, `${route}: unexpected external scripts: ${scriptSources.join(", ")}`);
  record(
    !/\b(?:TODO|TBD|FIXME|LOREM IPSUM)\b|\{\{|\}\}|__PLACEHOLDER__|%[A-Z][A-Z0-9_]+%/iu.test(
      html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, ""),
    ),
    `${route}: raw placeholder marker found`,
  );
  if (expectedContactCtas) {
    record(emailCtas.length === 1, `${route}: email CTA missing or duplicated`);
    record(whatsappCtas.length === 1, `${route}: WhatsApp CTA missing or duplicated`);
  }
  if (ownLanguage) record(hreflang[ownLanguage] === canonical[0], `${route}: own hreflang is not canonical`);

  pages.push({
    route,
    http: {
      requestedUrl: httpUrl,
      status: httpResponse.status,
      location: httpLocation,
      expectedLocation: expectedRedirect,
      contentType: httpResponse.headers.get("content-type"),
      bytes: httpBody.length,
      servesPageBody: httpBody.includes(`<title>${title[0]}</title>`),
    },
    https: {
      status: httpsResponse.status,
      finalUrl: httpsResponse.url,
      strictTransportSecurity: httpsResponse.headers.get("strict-transport-security"),
    },
    title: title[0],
    canonical: canonical[0],
    robots: meta.find((entry) => entry.name === "robots")?.content,
    hreflang,
    internalLinks: internalLinks.length,
    brokenInternalLinks,
    cta: { email: emailCtas.length, whatsapp: whatsappCtas.length, hrefOnly: true },
    headings: headings.map((heading) => `h${heading.level}`),
    landmarks: {
      header: tags(html, "header").length,
      nav: tags(html, "nav").length,
      main: tags(html, "main").length,
      footer: tags(html, "footer").length,
    },
    forms: tags(html, "form").length,
    fileInputs: tags(html, "input").map(attributes).filter((input) => input.type === "file").length,
    externalScripts: scriptSources,
  });
}

const robotsResponse = await request(`${BASE_URL}/robots.txt`);
const robotsText = await robotsResponse.text();
record(robotsResponse.ok, `robots.txt returned ${robotsResponse.status}`);
record(/^User-agent: \*$/mu.test(robotsText), "robots.txt lacks User-agent: *");
record(/^Disallow: \/$/mu.test(robotsText), "robots.txt does not block crawling");
record(!/^Sitemap:/mu.test(robotsText), "robots.txt advertises a sitemap on staging");

const sitemapResponse = await request(`${BASE_URL}/sitemap.xml`);
const sitemapText = await sitemapResponse.text();
const sitemapUrls = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => decodeHtml(match[1])).sort();
const expectedSitemapUrls = routes.map((route) => `${PRODUCTION_ORIGIN}${route}`).sort();
record(sitemapResponse.ok, `sitemap.xml returned ${sitemapResponse.status}`);
record(JSON.stringify(sitemapUrls) === JSON.stringify(expectedSitemapUrls), "sitemap does not exactly match all 19 production canonicals");
record(!/staging|localhost|127\.0\.0\.1|\/api\//iu.test(sitemapText), "sitemap leaks a non-production or API URL");

const probes = {};
for (const path of ["/api/inquiries", "/api/", "/api/contact", "/api/upload", "/admin/", "/.env"]) {
  const response = await request(`${BASE_URL}${path}`, { redirect: "manual" });
  const body = await response.text();
  probes[path] = { status: response.status, contentType: response.headers.get("content-type"), bytes: body.length };
  if (path === "/api/inquiries") {
    record(response.status === 503 && body.includes("inquiry_unavailable"), "/api/inquiries is not 503 inquiry_unavailable");
  } else {
    record([404, 405].includes(response.status), `${path}: unexpected endpoint status ${response.status}`);
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  target: BASE_URL,
  method: "Read-only GET requests; CTA hrefs inspected but not opened",
  status: failures.length === 0 ? "pass" : "fail",
  summary: { routes: pages.length, failures: failures.length },
  robots: { status: robotsResponse.status, body: robotsText },
  sitemap: { status: sitemapResponse.status, urls: sitemapUrls },
  inquiry: probes["/api/inquiries"],
  endpointProbes: probes,
  pages,
  failures,
};

const outputPath = resolve("reports/audits/08-staging-live.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${result.status.toUpperCase()}: ${pages.length} live routes; ${failures.length} failures; output ${outputPath}\n`);
if (failures.length > 0) process.exitCode = 1;
