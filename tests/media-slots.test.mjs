import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LOGO_ID,
  MEDIA_FOLDERS,
  MEDIA_SLOTS,
  getMediaSlot,
  isKnownMediaSlot,
  shapeMediaId,
} from "../src/config/media-slots";

describe("media slot registry", () => {
  it("has unique ids that point into a known folder with a kebab-case file name", () => {
    const ids = MEDIA_SLOTS.map((slot) => slot.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      const [folder, file, ...rest] = id.split("/");
      expect(rest).toEqual([]);
      expect(MEDIA_FOLDERS).toContain(folder);
      expect(file).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
    }
  });

  it("gives every slot alt text in both languages and a usable minimum size", () => {
    for (const slot of MEDIA_SLOTS) {
      expect(slot.alt.en.trim(), slot.id).not.toBe("");
      expect(slot.alt.id.trim(), slot.id).not.toBe("");
      expect(slot.minWidth, slot.id).toBeGreaterThanOrEqual(256);
      expect(slot.subject.trim(), slot.id).not.toBe("");
    }
  });

  it("requires a publication condition for documents, partner material, and people", () => {
    for (const slot of MEDIA_SLOTS) {
      const [folder] = slot.id.split("/");
      if (folder === "documents" || folder === "partners" || folder === "team") {
        expect(slot.gate, `${slot.id} needs a gate`).toBeTruthy();
      }
    }
  });

  it("resolves a gallery slot for every product shape in the product data", () => {
    for (const locale of [
      "en/coconut-charcoal-briquettes",
      "id/briket-arang-tempurung-kelapa",
      "en/barbecue-charcoal-briquettes",
      "id/briket-arang-barbecue",
    ]) {
      const yaml = readFileSync(join(process.cwd(), "src/content/products", `${locale}.yaml`), "utf8");
      const shapeNames = [...yaml.matchAll(/^ {2}- name: (.+)$/gmu)]
        .map((match) => match[1].trim())
        .filter((name) => !["Platinum", "Super Premium", "Premium"].includes(name));
      expect(shapeNames.length).toBeGreaterThan(0);
      for (const name of shapeNames) {
        const id = shapeMediaId(name);
        expect(id, name).toBeDefined();
        expect(isKnownMediaSlot(id), name).toBe(true);
      }
    }
    expect(shapeMediaId("Unknown shape")).toBeUndefined();
    expect(getMediaSlot("products/shape-cube")?.alt.id).toContain("cube");
  });

  it("excludes every held file from the published bundle and explains each hold", () => {
    const mediaSource = readFileSync(join(process.cwd(), "src/config/media.ts"), "utf8");
    const excluded = [...mediaSource.matchAll(/"!\/src\/assets\/([^"]+)\.\*"/gu)].map((match) => match[1]).sort();
    const held = MEDIA_SLOTS.filter((slot) => slot.hold).map((slot) => slot.id).sort();
    expect(excluded).toEqual(held);
    for (const slot of MEDIA_SLOTS.filter((entry) => entry.hold)) {
      expect(slot.hold.length, slot.id).toBeGreaterThan(20);
    }
  });

  it("registers the logo under the supplied file name", () => {
    expect(LOGO_ID).toBe("brand/logo-permata-briquettes");
    expect(isKnownMediaSlot(LOGO_ID)).toBe(true);
  });

  it("points every team member at a portrait that exists and keeps both languages in step", () => {
    const folders = ["en", "id"].map((locale) => {
      const directory = join(process.cwd(), "src/content/team", locale);
      return readdirSync(directory).filter((file) => file.endsWith(".yaml")).sort();
    });
    expect(folders[0]).toEqual(folders[1]);
    expect(folders[0].length).toBeGreaterThan(0);
    for (const file of folders[0]) {
      for (const locale of ["en", "id"]) {
        const yaml = readFileSync(join(process.cwd(), "src/content/team", locale, file), "utf8");
        const photo = yaml.match(/^photo: (team\/[a-z0-9-]+)$/mu)?.[1];
        expect(photo, `${locale}/${file}`).toBeDefined();
        const found = ["jpg", "jpeg", "png", "webp", "avif"].some((extension) =>
          existsSync(join(process.cwd(), "src/assets", `${photo}.${extension}`)),
        );
        expect(found, `${photo} is missing from src/assets/team`).toBe(true);
      }
    }
  });

  it("keeps the generated asset folders and checklist in sync with the registry", () => {
    expect(() =>
      execFileSync(process.execPath, ["scripts/sync-asset-folders.mjs", "--check"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });
});
