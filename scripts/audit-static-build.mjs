import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, extname, join, relative, resolve, sep } from "node:path";

const SITE_ORIGIN = "https://www.permatabriquettes.com";
const args = process.argv.slice(2);

function argument(name, fallback) {
  const position = args.indexOf(`--${name}`);
  return position === -1 ? fallback : args[position + 1];
}

const buildDirectory = resolve(argument("dir", "dist"));
const environment = argument("environment", "local");
const outputFile = argument("output", undefined);
const analyticsExpectation = argument("analytics", "absent");
const quiet = args.includes("--quiet");

if (!existsSync(buildDirectory)) throw new Error(`Build directory does not exist: ${buildDirectory}`);
if (!["local", "staging", "production"].includes(environment)) {
  throw new Error(`Unsupported environment: ${environment}`);
}
if (!["absent", "present"].includes(analyticsExpectation)) {
  throw new Error(`Unsupported analytics expectation: ${analyticsExpectation}`);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function routeFromHtmlFile(file) {
  const localPath = relative(buildDirectory, file).split(sep).join("/");
  if (localPath === "index.html") return "/";
  return `/${localPath.replace(/index\.html$/u, "")}`;
}

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

function sha256(source) {
  return `sha256-${createHash("sha256").update(source).digest("base64")}`;
}

function parseCsp(policy) {
  return Object.fromEntries(
    policy.split(";")
      .map((directive) => directive.trim().split(/\s+/u))
      .filter(([name]) => Boolean(name))
      .map(([name, ...sources]) => [name.toLowerCase(), sources]),
  );
}

function hasAnalyticsMarkup(html) {
  return html.includes("static.cloudflareinsights.com/beacon.min.js") || html.includes("data-cf-beacon");
}

function plainText(value) {
  return decodeHtml(value.replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim());
}

const allFiles = walk(buildDirectory);
const htmlFiles = allFiles.filter((file) => file.endsWith(".html"));
const routes = new Set(htmlFiles.map(routeFromHtmlFile));
// Ids per built page, so a link such as /id/tentang-kami/#team is checked against its target page.
const idsByRoute = new Map(htmlFiles.map((file) => [
  routeFromHtmlFile(file),
  new Set([...readFileSync(file, "utf8").matchAll(/\sid=(?:"([^"]+)"|'([^']+)')/giu)].map((match) => match[1] ?? match[2])),
]));
const failures = [];
const warnings = [];

function requireCheck(condition, message) {
  if (!condition) failures.push(message);
}

const pages = htmlFiles
  .map((file) => {
    const html = readFileSync(file, "utf8");
    const route = routeFromHtmlFile(file);
    const htmlTag = attributes(tags(html, "html")[0] ?? "");
    // Only the document title counts; inline SVG <title> tooltips (e.g. the transit map) live in <body>.
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/iu)?.[1] ?? "";
    const titleValues = elements(head, "title").map((match) => plainText(match[2]));
    const metaTags = tags(html, "meta").map(attributes);
    const linkTags = tags(html, "link").map(attributes);
    const description = metaTags.find((tag) => tag.name === "description")?.content;
    const robots = metaTags.find((tag) => tag.name === "robots")?.content;
    const canonicals = linkTags.filter((tag) => tag.rel === "canonical").map((tag) => tag.href);
    const alternates = Object.fromEntries(
      linkTags
        .filter((tag) => tag.rel === "alternate" && tag.hreflang)
        .map((tag) => [tag.hreflang, tag.href]),
    );
    const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/giu)]
      .map((match) => ({ level: Number(match[1]), text: plainText(match[2]) }));
    const idList = [...html.matchAll(/\sid=(?:"([^"]+)"|'([^']+)')/giu)]
      .map((match) => match[1] ?? match[2]);
    const idValues = new Set(idList);
    const inlineJavascriptBytes = elements(html, "script")
      .filter((match) => !attributes(match[1]).src)
      .reduce((total, match) => total + Buffer.byteLength(match[2]), 0);

    requireCheck(titleValues.length === 1 && Boolean(titleValues[0]), `${route}: requires one non-empty title`);
    requireCheck(Boolean(description), `${route}: requires a non-empty meta description`);
    requireCheck(canonicals.length === 1, `${route}: requires exactly one canonical`);
    requireCheck(canonicals[0] === `${SITE_ORIGIN}${route}`, `${route}: canonical does not match its route`);
    requireCheck(htmlTag.lang === (route === "/" ? "mul" : route.split("/")[1]), `${route}: incorrect html lang`);
    requireCheck(
      robots === (environment === "production" ? "index, follow" : "noindex, nofollow"),
      `${route}: incorrect robots directive for ${environment}`,
    );
    requireCheck(Object.keys(alternates).length === 3, `${route}: requires exactly three language alternates`);
    requireCheck(alternates["x-default"] === `${SITE_ORIGIN}/`, `${route}: x-default must point to root`);
    requireCheck(alternates.en?.startsWith(`${SITE_ORIGIN}/en/`), `${route}: invalid English alternate`);
    requireCheck(alternates.id?.startsWith(`${SITE_ORIGIN}/id/`), `${route}: invalid Indonesian alternate`);
    for (const alternate of [alternates.en, alternates.id]) {
      if (alternate) requireCheck(routes.has(new URL(alternate).pathname), `${route}: alternate route is not built: ${alternate}`);
    }

    requireCheck(headings.filter((heading) => heading.level === 1).length === 1, `${route}: requires exactly one h1`);
    requireCheck(headings[0]?.level === 1, `${route}: first heading must be h1`);
    for (let index = 1; index < headings.length; index += 1) {
      requireCheck(
        headings[index].level <= headings[index - 1].level + 1,
        `${route}: heading level skips from h${headings[index - 1].level} to h${headings[index].level}`,
      );
    }
    requireCheck(tags(html, "main").length === 1, `${route}: requires one main landmark`);
    requireCheck(tags(html, "header").length >= 1, `${route}: requires a header landmark`);
    requireCheck(tags(html, "nav").length >= 1, `${route}: requires a navigation landmark`);
    if (route !== "/") requireCheck(tags(html, "footer").length === 1, `${route}: requires one footer landmark`);
    requireCheck(idList.length === idValues.size, `${route}: duplicate id found`);

    const labels = tags(html, "label").map(attributes);
    // A control wrapped in a <label> with text is implicitly labelled (the
    // inquiry form uses this); only controls outside labels need for/aria.
    const wrappingLabels = elements(html, "label");
    for (const label of wrappingLabels) {
      const wrapped = ["input", "select", "textarea"]
        .flatMap((name) => tags(label[2], name).map(attributes))
        .filter((entry) => entry.type !== "hidden");
      if (wrapped.length > 0) {
        requireCheck(plainText(label[2]) !== "", `${route}: wrapping label has no text`);
      }
    }
    const htmlOutsideLabels = html.replace(/<label\b[^>]*>[\s\S]*?<\/label>/giu, "");
    const controls = ["input", "select", "textarea"].flatMap((name) => tags(htmlOutsideLabels, name).map(attributes));
    for (const control of controls.filter((entry) => entry.type !== "hidden")) {
      const hasName = Boolean(control["aria-label"] || control["aria-labelledby"])
        || (Boolean(control.id) && labels.some((label) => label.for === control.id));
      requireCheck(hasName, `${route}: form control has no accessible label`);
    }
    for (const button of elements(html, "button")) {
      const attrs = attributes(button[1]);
      requireCheck(Boolean(attrs["aria-label"] || plainText(button[2])), `${route}: button has no accessible name`);
    }
    for (const table of elements(html, "table")) {
      requireCheck(tags(table[0], "th").length > 0, `${route}: data table has no header cells`);
    }

    const anchors = elements(html, "a");
    const hrefs = [];
    for (const anchor of anchors) {
      const attrs = attributes(anchor[1]);
      const name = attrs["aria-label"] || plainText(anchor[2]);
      requireCheck(Boolean(name), `${route}: link has no accessible name`);
      requireCheck(Boolean(attrs.href), `${route}: link has an empty href`);
      if (!attrs.href) continue;
      hrefs.push(attrs.href);
      if (attrs.href.startsWith("#")) {
        requireCheck(idValues.has(attrs.href.slice(1)), `${route}: missing fragment target ${attrs.href}`);
      } else if (attrs.href.startsWith("/_astro/")) {
        // Links to emitted files, such as the full-size document previews.
        requireCheck(
          existsSync(join(buildDirectory, decodeURIComponent(new URL(attrs.href, SITE_ORIGIN).pathname))),
          `${route}: linked asset is not built: ${attrs.href}`,
        );
      } else if (attrs.href.startsWith("/")) {
        const target = new URL(attrs.href, SITE_ORIGIN);
        requireCheck(routes.has(target.pathname), `${route}: internal link target is not built: ${attrs.href}`);
        if (target.hash) {
          requireCheck(
            idsByRoute.get(target.pathname)?.has(target.hash.slice(1)) === true,
            `${route}: missing target ${target.hash} on ${target.pathname}`,
          );
        }
      }
    }
    requireCheck(
      anchors.some((anchor) => attributes(anchor[1]).href === "#main-content"),
      `${route}: skip link to #main-content is missing`,
    );
    requireCheck(idValues.has("main-content"), `${route}: #main-content target is missing`);

    for (const image of tags(html, "img").map(attributes)) {
      requireCheck(Object.hasOwn(image, "alt"), `${route}: image is missing alt`);
      requireCheck(Boolean(image.width) && Boolean(image.height), `${route}: image lacks intrinsic dimensions`);
    }

    const cspValues = metaTags
      .filter((tag) => tag["http-equiv"]?.toLowerCase() === "content-security-policy")
      .map((tag) => tag.content);
    requireCheck(cspValues.length === 1, `${route}: requires exactly one CSP meta element`);
    const csp = parseCsp(cspValues[0] ?? "");
    for (const directive of ["default-src", "script-src", "style-src", "object-src", "base-uri"]) {
      requireCheck(Boolean(csp[directive]), `${route}: CSP lacks ${directive}`);
    }
    requireCheck(!/'unsafe-inline'|'unsafe-eval'/u.test(cspValues[0] ?? ""), `${route}: CSP allows unsafe sources`);
    requireCheck(csp["script-src"]?.includes("'self'"), `${route}: CSP script-src blocks same-origin bundles`);
    if (hasAnalyticsMarkup(html)) {
      requireCheck(
        csp["script-src"]?.includes("https://static.cloudflareinsights.com")
          && csp["connect-src"]?.includes("https://cloudflareinsights.com"),
        `${route}: CSP blocks the analytics beacon`,
      );
    }
    for (const script of elements(html, "script").filter((match) => !attributes(match[1]).src)) {
      requireCheck(
        csp["script-src"]?.includes(`'${sha256(script[2])}'`),
        `${route}: inline script is not covered by a CSP hash`,
      );
    }
    for (const style of elements(html, "style")) {
      requireCheck(
        csp["style-src"]?.includes(`'${sha256(style[2])}'`),
        `${route}: inline style is not covered by a CSP hash`,
      );
    }
    requireCheck(!/<[a-z][^>]*\sstyle=/iu.test(html), `${route}: style attribute is blocked by CSP`);

    const htmlWithoutExecutableContent = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, "");
    requireCheck(
      !/\b(?:TODO|TBD|FIXME|LOREM IPSUM)\b|\{\{|\}\}|__PLACEHOLDER__|%[A-Z][A-Z0-9_]+%/iu.test(htmlWithoutExecutableContent),
      `${route}: raw placeholder marker found`,
    );
    requireCheck(!/internalNotes|pending-approval/iu.test(html), `${route}: internal content marker found`);

    const hasAnalytics = hasAnalyticsMarkup(html);
    requireCheck(
      hasAnalytics === (analyticsExpectation === "present"),
      `${route}: analytics beacon is unexpectedly ${hasAnalytics ? "present" : "absent"}`,
    );

    return {
      route,
      canonical: canonicals[0],
      locale: htmlTag.lang,
      indexing: robots,
      hreflang: alternates,
      title: titleValues[0],
      descriptionLength: description?.length ?? 0,
      headings: headings.map((heading) => `h${heading.level}`),
      links: hrefs.length,
      images: tags(html, "img").length,
      controls: controls.length,
      tables: tags(html, "table").length,
      inlineJavascriptBytes,
      bytes: statSync(file).size,
    };
  })
  .sort((left, right) => left.route.localeCompare(right.route));

for (const page of pages.filter((entry) => entry.route !== "/")) {
  const ownLanguage = page.locale;
  requireCheck(page.hreflang[ownLanguage] === page.canonical, `${page.route}: own hreflang must equal canonical`);
  const alternateRoute = new URL(page.hreflang[ownLanguage === "en" ? "id" : "en"]).pathname;
  const alternatePage = pages.find((entry) => entry.route === alternateRoute);
  requireCheck(Boolean(alternatePage), `${page.route}: localized alternate page is missing`);
  if (alternatePage) {
    requireCheck(
      alternatePage.hreflang[ownLanguage] === page.canonical,
      `${page.route}: localized alternate is not reciprocal`,
    );
  }
}

const rootPage = pages.find((page) => page.route === "/");
requireCheck(rootPage?.hreflang.en === `${SITE_ORIGIN}/en/`, "/: English alternate must be /en/");
requireCheck(rootPage?.hreflang.id === `${SITE_ORIGIN}/id/`, "/: Indonesian alternate must be /id/");

const sitemapPath = join(buildDirectory, "sitemap.xml");
requireCheck(existsSync(sitemapPath), "sitemap.xml is missing");
const sitemap = existsSync(sitemapPath) ? readFileSync(sitemapPath, "utf8") : "";
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => decodeHtml(match[1])).sort();
// The inquiry confirmation pages exist only in builds with the form on, are noindex by design and stay out of the sitemap.
const INQUIRY_SUCCESS_ROUTES = new Set(["/en/inquiry-received/", "/id/inquiry-diterima/"]);
if (environment === "production") {
  for (const route of INQUIRY_SUCCESS_ROUTES) {
    requireCheck(!routes.has(route), `${route}: the inquiry confirmation page must not be built for production`);
  }
}
const canonicalUrls = pages
  .filter((page) => !INQUIRY_SUCCESS_ROUTES.has(page.route))
  .map((page) => page.canonical)
  .filter(Boolean)
  .sort();
requireCheck(new Set(sitemapUrls).size === sitemapUrls.length, "sitemap.xml contains duplicate URLs");
requireCheck(JSON.stringify(sitemapUrls) === JSON.stringify(canonicalUrls), "sitemap.xml does not exactly match built indexable routes");
requireCheck(!/\/api\/|staging|localhost|127\.0\.0\.1|\.html(?:<|$)/iu.test(sitemap), "sitemap.xml contains a disallowed route or origin");

const robotsPath = join(buildDirectory, "robots.txt");
requireCheck(existsSync(robotsPath), "robots.txt is missing");
const robotsText = existsSync(robotsPath) ? readFileSync(robotsPath, "utf8") : "";
if (environment === "production") {
  requireCheck(/^User-agent: \*$/mu.test(robotsText), "production robots.txt lacks User-agent");
  requireCheck(/^Allow: \/$/mu.test(robotsText), "production robots.txt lacks Allow: /");
  requireCheck(
    robotsText.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`),
    "production robots.txt lacks the production sitemap reference",
  );
  requireCheck(!/^Disallow: \/$/mu.test(robotsText), "production robots.txt blocks the site");
} else {
  requireCheck(/^Disallow: \/$/mu.test(robotsText), `${environment} robots.txt must block crawling`);
  requireCheck(!/^Sitemap:/mu.test(robotsText), `${environment} robots.txt must not advertise a sitemap`);
}

const STATIC_ROOT_FILES = new Set(["robots.txt", "sitemap.xml", "_headers", "en/blog/rss.xml", "id/blog/rss.xml"]);
const knownOutput = allFiles.every((file) => {
  const path = relative(buildDirectory, file).split(sep).join("/");
  return path.endsWith(".html") || STATIC_ROOT_FILES.has(path) || path.startsWith("_astro/");
});
requireCheck(knownOutput, "build contains an unexpected endpoint or internal artifact");

const headersPath = join(buildDirectory, "_headers");
requireCheck(existsSync(headersPath), "build lacks _headers");
const headersText = existsSync(headersPath) ? readFileSync(headersPath, "utf8") : "";
for (const header of [
  "Content-Security-Policy: frame-ancestors 'none'",
  "X-Frame-Options: DENY",
  "X-Content-Type-Options: nosniff",
  "Referrer-Policy: strict-origin-when-cross-origin",
  "Permissions-Policy:",
]) {
  requireCheck(headersText.includes(header), `_headers lacks ${header}`);
}
requireCheck(!/Strict-Transport-Security/iu.test(headersText), "_headers sets HSTS before its rollout decision");

const sizeGroups = {};
for (const file of allFiles) {
  const extension = extname(file).toLowerCase() || "[no extension]";
  sizeGroups[extension] ??= { files: 0, bytes: 0 };
  sizeGroups[extension].files += 1;
  sizeGroups[extension].bytes += statSync(file).size;
}
const assetFiles = allFiles
  .filter((file) => relative(buildDirectory, file).split(sep)[0] === "_astro")
  .map((file) => ({
    path: relative(buildDirectory, file).split(sep).join("/"),
    bytes: statSync(file).size,
  }))
  .sort((left, right) => right.bytes - left.bytes);

if (assetFiles.some((asset) => asset.bytes > 500_000)) {
  warnings.push("At least one emitted asset exceeds 500 kB; review the asset-size list.");
}

const result = {
  status: failures.length === 0 ? "pass" : "fail",
  environment,
  buildDirectory,
  analyticsExpectation,
  summary: {
    pages: pages.length,
    sitemapUrls: sitemapUrls.length,
    outputFiles: allFiles.length,
    outputBytes: allFiles.reduce((total, file) => total + statSync(file).size, 0),
    cssBytes: sizeGroups[".css"]?.bytes ?? 0,
    javascriptBytes: sizeGroups[".js"]?.bytes ?? 0,
    inlineJavascriptBytes: pages.reduce((total, page) => total + page.inlineJavascriptBytes, 0),
    maximumInlineJavascriptBytesPerPage: Math.max(...pages.map((page) => page.inlineJavascriptBytes)),
    fontBytes: (sizeGroups[".woff"]?.bytes ?? 0) + (sizeGroups[".woff2"]?.bytes ?? 0),
  },
  sizeGroups,
  assets: assetFiles,
  pages,
  warnings,
  failures,
};

const serialized = `${JSON.stringify(result, null, 2)}\n`;
if (outputFile) {
  const resolvedOutput = resolve(outputFile);
  mkdirSync(dirname(resolvedOutput), { recursive: true });
  writeFileSync(resolvedOutput, serialized, "utf8");
}
process.stdout.write(quiet
  ? `${result.status.toUpperCase()}: ${environment}; ${pages.length} pages; ${failures.length} failures; ${warnings.length} warnings\n`
  : serialized);
if (failures.length > 0) process.exitCode = 1;
