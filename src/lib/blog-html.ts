/** Gives every http(s) link in rendered Markdown rel="noopener noreferrer"; other links are left alone. */
export function secureExternalLinks(html: string): string {
  return html.replace(/<a\s[^>]*>/giu, (tag) => {
    if (!/\shref=["']https?:\/\//iu.test(tag)) return tag;
    const withoutRel = tag.replace(/\srel=(?:"[^"]*"|'[^']*')/iu, "");
    return withoutRel.replace(/>$/u, ' rel="noopener noreferrer">');
  });
}
