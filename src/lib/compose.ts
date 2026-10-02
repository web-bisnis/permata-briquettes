// Splits the HTML that Astro renders from a page's markdown into the pieces the composed
// layouts need. The approved copy stays in markdown; only its presentation changes.

export interface HtmlSection {
  id: string;
  title: string;
  /** HTML between this heading and the next. */
  body: string;
}

export interface HtmlItem {
  id?: string;
  title: string;
  body: string;
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

/** Plain text of an HTML fragment, for headings and short call-to-action copy. */
export function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/gu, "")
    .replace(/&#(\d+);/gu, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/giu, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/gu, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/gu, " ")
    .trim();
}

const H2 = /<h2(?:\s+id="([^"]*)")?[^>]*>([\s\S]*?)<\/h2>/gu;
const H3 = /<h3(?:\s+id="([^"]*)")?[^>]*>([\s\S]*?)<\/h3>/gu;

function splitByHeading(html: string, pattern: RegExp): { before: string; items: HtmlItem[] } {
  const matches = [...html.matchAll(pattern)];
  if (matches.length === 0) return { before: html.trim(), items: [] };
  const before = html.slice(0, matches[0].index).trim();
  const items = matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? html.length;
    return { id: match[1], title: textOf(match[2]), body: html.slice(start, end).trim() };
  });
  return { before, items };
}

/** Content before the first h2, plus one entry per h2. */
export function splitSections(html: string): { intro: string; sections: HtmlSection[] } {
  const { before, items } = splitByHeading(html, H2);
  return {
    intro: before,
    sections: items.map((item) => ({ id: item.id ?? "", title: item.title, body: item.body })),
  };
}

/** Content before the first h3, plus one entry per h3. */
export function splitSubsections(html: string): { lead: string; items: HtmlItem[] } {
  const { before, items } = splitByHeading(html, H3);
  return { lead: before, items };
}

/**
 * The first ordered list as steps. Each item's leading <strong> becomes the step title;
 * HTML before and after the list is returned so no copy is dropped.
 */
export function splitSteps(html: string): { before: string; steps: HtmlItem[]; after: string } {
  const list = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/u);
  if (!list || list.index === undefined) return { before: html.trim(), steps: [], after: "" };
  const steps = [...list[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gu)].map((item) => {
    const content = item[1].trim();
    const lead = content.match(/^<strong>([\s\S]*?)<\/strong>\s*([\s\S]*)$/u);
    return lead
      ? { title: textOf(lead[1]), body: lead[2].trim() }
      : { title: "", body: content };
  });
  return {
    before: html.slice(0, list.index).trim(),
    steps,
    after: html.slice(list.index + list[0].length).trim(),
  };
}
