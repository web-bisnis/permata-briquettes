import { describe, expect, it } from "vitest";
import { splitSections, splitSteps, splitSubsections, textOf } from "../src/lib/compose";

describe("compose helpers", () => {
  it("splits rendered markdown at h2 headings and keeps the intro", () => {
    const html = [
      '<p><a href="/x/">Intro link</a></p>',
      '<h2 id="one">First &amp; second</h2>',
      "<p>Body one.</p>",
      '<h2 id="two">Two</h2>',
      "<p>Body two.</p><ul><li>a</li></ul>",
    ].join("\n");
    const { intro, sections } = splitSections(html);
    expect(intro).toBe('<p><a href="/x/">Intro link</a></p>');
    expect(sections.map((section) => section.id)).toEqual(["one", "two"]);
    expect(sections[0].title).toBe("First & second");
    expect(sections[0].body).toBe("<p>Body one.</p>");
    expect(sections[1].body).toContain("<ul><li>a</li></ul>");
  });

  it("returns the whole html as intro when there is no heading", () => {
    expect(splitSections("<p>Only text</p>")).toEqual({ intro: "<p>Only text</p>", sections: [] });
  });

  it("splits h3 groups and keeps the lead text", () => {
    const { lead, items } = splitSubsections('<p>Lead</p><h3 id="a">A</h3><p>One</p><h3 id="b">B</h3><p>Two</p>');
    expect(lead).toBe("<p>Lead</p>");
    expect(items).toEqual([
      { id: "a", title: "A", body: "<p>One</p>" },
      { id: "b", title: "B", body: "<p>Two</p>" },
    ]);
  });

  it("turns an ordered list into titled steps without dropping surrounding copy", () => {
    const html = "<p>Before</p><ol>\n<li><strong>Send.</strong> Say what you need.</li>\n<li>Plain step</li>\n</ol><p>After</p>";
    const { before, steps, after } = splitSteps(html);
    expect(before).toBe("<p>Before</p>");
    expect(after).toBe("<p>After</p>");
    expect(steps).toEqual([
      { title: "Send.", body: "Say what you need." },
      { title: "", body: "Plain step" },
    ]);
  });

  it("extracts plain text with decoded entities", () => {
    expect(textOf("<p>Kami &amp; <em>Anda</em> &#8212; siap</p>")).toBe("Kami & Anda — siap");
  });
});
