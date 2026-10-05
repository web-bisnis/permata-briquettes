import { inspectContactPage, inspectInquiryProbes, withNetworkRetry } from "./smoke-checks.mjs";

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

// Only network/DNS failures are retried (a new custom domain may not have propagated yet);
// failed assertions and HTTP responses are never retried.
const retryOptions = {
  attempts: Number(process.env.SMOKE_RETRY_ATTEMPTS ?? 5),
  delayMs: Number(process.env.SMOKE_RETRY_DELAY_MS ?? 30_000),
  onRetry: (error, attempt) => process.stderr.write(
    `Network error (${error.cause?.code}), retry ${attempt} in ${retryOptions.delayMs / 1000}s
`,
  ),
};

const checks = [];
function requireCheck(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

async function get(path) {
  const { response, body } = await withNetworkRetry(async () => {
    const response = await fetch(new URL(path, baseUrl), {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "permata-briquettes-read-only-smoke/1.0" },
    });
    return { response, body: await response.text() };
  }, retryOptions);
  requireCheck(response.url.startsWith("https://"), `${path} remains on HTTPS`);
  requireCheck(new URL(response.url).hostname === expectedHost, `${path} remains on the target host`);
  return { response, body };
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

// Both staging and production serve the live inquiry form.
const formExpected = true;

async function probe(path) {
  return withNetworkRetry(async () => {
    const response = await fetch(new URL(path, baseUrl), {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "permata-briquettes-read-only-smoke/1.0" },
    });
    return { status: response.status, body: await response.text() };
  }, retryOptions);
}

for (const path of ["/en/contact/", "/id/kontak/"]) {
  const page = await get(path);
  requireCheck(page.response.ok, `${path} is served`);
  for (const result of inspectContactPage(path, page.body, { formExpected })) {
    requireCheck(result.ok, result.message);
  }
}

// GET is never a valid inquiry call. A configured Worker answers 405; 503 means
// the gate is closed (a secret, binding, or D1 is missing), which fails the smoke test.
const inquiry = await probe("/api/inquiries");
const webhook = await probe("/api/webhooks/resend");
for (const result of inspectInquiryProbes({ formExpected, inquiry, webhook })) {
  requireCheck(result.ok, result.message);
}

process.stdout.write(`PASS: ${environment} read-only smoke test; ${checks.length} checks.\n`);
