const args = process.argv.slice(2);

function argument(name) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
}

const environment = argument("environment");
const baseUrl = new URL(argument("base-url") ?? "");
if (environment !== "staging" && environment !== "production") {
  throw new Error("--environment must be staging or production");
}
if (baseUrl.protocol !== "https:") throw new Error("Smoke tests require an HTTPS URL");

const expectedHost = environment === "staging"
  ? "staging.permatabriquettes.com"
  : "www.permatabriquettes.com";
if (baseUrl.hostname !== expectedHost) {
  throw new Error(`Expected ${expectedHost}, received ${baseUrl.hostname}`);
}

const checks = [];
function requireCheck(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

async function get(path) {
  const response = await fetch(new URL(path, baseUrl), {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": "permata-briquettes-read-only-smoke/1.0" },
  });
  requireCheck(response.url.startsWith("https://"), `${path} remains on HTTPS`);
  requireCheck(new URL(response.url).hostname === expectedHost, `${path} remains on the target host`);
  return { response, body: await response.text() };
}

const root = await get("/");
requireCheck(root.response.ok, "/ returns success");
const robotsDirective = environment === "staging" ? "noindex, nofollow" : "index, follow";
requireCheck(
  root.body.includes(`<meta name="robots" content="${robotsDirective}">`),
  `/ has ${robotsDirective}`,
);
requireCheck(root.body.includes('rel="canonical" href="https://www.permatabriquettes.com/"'), "/ canonical points to production");
requireCheck(!root.body.includes("static.cloudflareinsights.com"), "analytics beacon is absent");

const stylesheetPath = root.body.match(/href="(\/_astro\/[^"]+\.css)"/u)?.[1];
requireCheck(Boolean(stylesheetPath), "root references a built stylesheet");
const stylesheet = await get(stylesheetPath);
requireCheck(stylesheet.response.ok && stylesheet.body.length > 0, "built stylesheet is served");

const robots = await get("/robots.txt");
requireCheck(robots.response.ok, "robots.txt is served");
if (environment === "staging") {
  requireCheck(/^Disallow: \/$/mu.test(robots.body), "staging robots.txt blocks crawling");
  requireCheck(!/^Sitemap:/mu.test(robots.body), "staging robots.txt does not advertise sitemap");
} else {
  requireCheck(/^Allow: \/$/mu.test(robots.body), "production robots.txt allows crawling");
  requireCheck(robots.body.includes("Sitemap: https://www.permatabriquettes.com/sitemap.xml"), "production robots.txt advertises sitemap");
}

const sitemap = await get("/sitemap.xml");
requireCheck(sitemap.response.ok && sitemap.body.includes("<urlset"), "sitemap.xml is served");
requireCheck(sitemap.body.includes("https://www.permatabriquettes.com/"), "sitemap uses the production origin");
requireCheck(!/staging|localhost|127\.0\.0\.1|\/api\//iu.test(sitemap.body), "sitemap excludes non-production origins and API routes");

for (const path of ["/en/contact/", "/id/kontak/"]) {
  const page = await get(path);
  requireCheck(page.response.ok, `${path} is served`);
  requireCheck(page.body.includes("mailto:marketing@permatabriquettes.com"), `${path} keeps the email CTA`);
  requireCheck(page.body.includes("https://wa.me/6281130887797"), `${path} keeps the WhatsApp CTA`);
  requireCheck(!/<form\b/iu.test(page.body), `${path} inquiry form is absent`);
  requireCheck(!page.body.includes("challenges.cloudflare.com"), `${path} Turnstile is absent`);
}

const inquiry = await get("/api/inquiries");
requireCheck(inquiry.response.status === 503, "read-only inquiry probe returns 503 fail closed");
requireCheck(inquiry.body.includes("inquiry_unavailable"), "inquiry probe reports unavailable");

process.stdout.write(`PASS: ${environment} read-only smoke test; ${checks.length} checks.\n`);
