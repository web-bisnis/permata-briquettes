// Pure, network-free checks used by smoke-deployment.mjs and unit-tested against
// locally built HTML. Each check returns { ok, message } so callers decide how
// to report. Patterns avoid word-boundary escapes and match whole tags, so a
// truncated or mangled pattern cannot silently pass or fail.

const CONTROL_TAG = /<(input|textarea|select)(?=[\s>/])[^>]*>/giu;

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

/** Parses a start tag into a lowercase attribute map; valueless attributes become "". */
export function parseAttributes(tag) {
  const inner = tag.replace(/^<[a-z][\w-]*/iu, "").replace(/\/?>$/u, "");
  const result = {};
  for (const match of inner.matchAll(/([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gu)) {
    result[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}

function startTags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}(?=[\\s>/])[^>]*>`, "giu"))].map((match) => match[0]);
}

function check(ok, message) {
  return { ok, message };
}

/**
 * Checks one contact page. With formExpected the real inquiry form must be
 * present (a genuine <form> element carrying data-inquiry-form, posting to the
 * inquiry endpoint, with its closing tag, an email field and a submit button,
 * plus a Turnstile widget with a site key and no mock token or file input).
 * Otherwise no form markup of any kind may appear.
 */
export function inspectContactPage(path, html, { formExpected }) {
  const results = [
    check(html.includes("mailto:marketing@permatabriquettes.com"), `${path} keeps the email CTA`),
    check(html.includes("https://wa.me/6281130887797"), `${path} keeps the WhatsApp CTA`),
  ];

  const forms = startTags(html, "form");

  if (!formExpected) {
    results.push(
      check(forms.length === 0, `${path} inquiry form is absent (no <form> element)`),
      check(!html.includes("data-inquiry-form"), `${path} has no data-inquiry-form marker`),
      check(!html.includes("challenges.cloudflare.com"), `${path} Turnstile is absent`),
      check(!/class="[^"]*\bcf-turnstile\b/u.test(html), `${path} has no Turnstile widget`),
    );
    return results;
  }

  const inquiryForms = forms.filter((tag) => Object.hasOwn(parseAttributes(tag), "data-inquiry-form"));
  const form = inquiryForms[0];
  const attributes = form ? parseAttributes(form) : {};
  const start = form ? html.indexOf(form) : -1;
  const end = start === -1 ? -1 : html.indexOf("</form>", start);
  const body = start !== -1 && end !== -1 ? html.slice(start, end) : "";

  const controls = [...body.matchAll(CONTROL_TAG)].map((match) => ({ name: match[1].toLowerCase(), attributes: parseAttributes(match[0]) }));
  const submitButtons = startTags(body, "button").map(parseAttributes).filter((entry) => entry.type === "submit");
  const turnstileWidgets = startTags(html, "div")
    .map(parseAttributes)
    .filter((entry) => (entry.class ?? "").split(/\s+/u).includes("cf-turnstile"));
  const turnstileScripts = startTags(html, "script")
    .map(parseAttributes)
    .filter((entry) => entry.src?.startsWith("https://challenges.cloudflare.com/turnstile/"));

  results.push(
    check(inquiryForms.length === 1, `${path} renders exactly one inquiry <form data-inquiry-form> element (found ${inquiryForms.length})`),
    check(attributes.action === "/api/inquiries" && attributes.method?.toLowerCase() === "post", `${path} form posts to /api/inquiries`),
    check(end !== -1, `${path} inquiry form has its closing </form>`),
    check(controls.some((entry) => entry.attributes.name === "email"), `${path} form has an email field`),
    check(controls.some((entry) => entry.attributes.name === "message"), `${path} form has a message field`),
    check(submitButtons.length === 1, `${path} form has one submit button`),
    check(turnstileWidgets.some((entry) => (entry["data-sitekey"] ?? "").trim() !== ""), `${path} carries a Turnstile widget with a site key`),
    check(turnstileScripts.length === 1, `${path} loads the Turnstile script`),
    check(html.includes("challenges.cloudflare.com"), `${path} loads Turnstile`),
    check(!html.includes("local-turnstile-pass"), `${path} does not use the local mock token`),
    check(!controls.some((entry) => entry.attributes.type?.toLowerCase() === "file"), `${path} has no file input`),
  );
  return results;
}

/**
 * Evaluates the two read-only GET probes. A configured staging Worker answers
 * 405 to GET; 503 means the gate is closed, which is correct for production
 * and a failure for staging (a secret, binding or D1 is missing).
 */
export function inspectInquiryProbes({ formExpected, inquiry, webhook }) {
  if (formExpected) {
    return [
      check(inquiry.status === 405, `read-only inquiry probe returns 405 on a configured staging Worker (got ${inquiry.status})`),
      check(inquiry.body.includes("method_not_allowed"), "inquiry probe reports method_not_allowed"),
      check(webhook.status === 405, `read-only webhook probe returns 405 on a configured staging Worker (got ${webhook.status})`),
    ];
  }
  return [
    check(inquiry.status === 503, "read-only inquiry probe returns 503 fail closed"),
    check(inquiry.body.includes("inquiry_unavailable"), "inquiry probe reports unavailable"),
    check(webhook.status === 503, "read-only webhook probe returns 503 fail closed"),
  ];
}
