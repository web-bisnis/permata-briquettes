/** Gives every http(s) link in rendered Markdown rel="noopener noreferrer"; other links are left alone. */
export function secureExternalLinks(html: string): string {
  return html.replace(/<a\s[^>]*>/giu, (tag) => {
    if (!/\shref=["']https?:\/\//iu.test(tag)) return tag;
    const withoutRel = tag.replace(/\srel=(?:"[^"]*"|'[^']*')/iu, "");
    return withoutRel.replace(/>$/u, ' rel="noopener noreferrer">');
  });
}

/**
 * Markdown tables with aligned columns come out with style="text-align: ..." attributes, which the
 * page CSP blocks. Alignment is set in blog.css / global.css instead, so the attributes are dropped.
 */
export function removeInlineStyles(html: string): string {
  return html.replace(/\sstyle=(?:"[^"]*"|'[^']*')/giu, "");
}
