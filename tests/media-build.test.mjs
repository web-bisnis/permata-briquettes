import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";

// These tests build a throwaway copy of the project with fixture images, so they neither
// depend on nor touch the real photos in src/assets.
const projectRoot = process.cwd();
const astroBin = join(projectRoot, "node_modules", "astro", "bin", "astro.mjs");
const scratchRoots = [];

function createProject() {
  const root = mkdtempSync(join(tmpdir(), "permata-media-"));
  scratchRoots.push(root);
  for (const entry of ["astro.config.ts", "tsconfig.json", "package.json"]) {
    cpSync(join(projectRoot, entry), join(root, entry));
  }
  cpSync(join(projectRoot, "public"), join(root, "public"), { recursive: true });
  cpSync(join(projectRoot, "src"), join(root, "src"), {
    recursive: true,
    filter: (source) => !/[\\/]src[\\/]assets([\\/]|$)/u.test(source) || /[\\/]src[\\/]assets$/u.test(source),
  });
  symlinkSync(join(projectRoot, "node_modules"), join(root, "node_modules"), "junction");
  return root;
}

async function addImage(root, id, width, height, background) {
  const file = join(root, "src", "assets", `${id}.png`);
  mkdirSync(dirname(file), { recursive: true });
  await sharp({ create: { width, height, channels: 4, background } }).png().toFile(file);
}

function build(root, extraEnvironment = {}) {
  const output = join(root, "out");
  const environment = { ...process.env };
  for (const name of ["SITE_ENV", "PUBLIC_COMPONENT_GALLERY"]) delete environment[name];
  Object.assign(environment, extraEnvironment);
  execFileSync(process.execPath, [astroBin, "build", "--outDir", output], {
    cwd: root,
    env: environment,
    stdio: "pipe",
  });
  return {
    output,
    read: (path) => readFileSync(join(output, path), "utf8"),
    emitted: () => (existsSync(join(output, "_astro")) ? readdirSync(join(output, "_astro")) : []),
  };
}

afterAll(() => {
  for (const root of scratchRoots) rmSync(root, { recursive: true, force: true });
});

describe("pages before any image has been supplied", () => {
  it("stay text-only, keep link-preview tags, and still render team and spec blocks", () => {
    const { read, output } = build(createProject());
    const home = read("id/index.html");
    expect(home).toContain('<meta property="og:title"');
    expect(home).toContain('<meta property="og:url" content="https://www.permatabriquettes.com/id/">');
    expect(home).toContain('<meta property="og:locale" content="id_ID">');
    expect(home).toContain('<meta name="twitter:card" content="summary">');
    expect(home).not.toContain("og:image");
    expect(home).not.toContain("<img");
    expect(home).not.toContain("hero-backdrop--photo");
    // The composed home page keeps working without photos: panels and calls to action stay text-only.
    expect(home).toContain('class="product-panels"');
    expect(home).toContain('href="mailto:marketing@permatabriquettes.com"');
    expect(home).toContain('href="https://wa.me/6281130887797"');
    expect(home).not.toContain("team-band__portraits");
    // The laboratory logo section stays hidden until a logo file is supplied.
    expect(home).not.toContain("partner-logos");
    // The floating WhatsApp button is on every content page, in both languages.
    expect(home).toContain('class="whatsapp-float" href="https://wa.me/6281130887797" aria-label="Chat WhatsApp"');
    expect(read("en/privacy/index.html")).toContain('aria-label="Chat on WhatsApp"');
    expect(home).not.toContain('rel="icon"');
    expect(home).toContain('<span class="logo-text">Permata Briquettes</span>');
    expect(existsSync(join(output, "id", "component-gallery"))).toBe(false);

    // Inner pages are composed from their markdown sections and degrade to text without photos.
    const ordering = read("id/pemesanan-pengiriman/index.html");
    expect(ordering).toContain('class="step-list"');
    expect(ordering).toContain('id="closing-cta"');
    expect(ordering).toContain('href="mailto:marketing@permatabriquettes.com"');
    expect(ordering).not.toContain("hero-backdrop--photo");
    expect(ordering).toContain('class="band"');
    const privacy = read("id/privasi/index.html");
    expect(privacy).not.toContain('id="closing-cta"');
    expect(privacy).toContain("composed--split");

    const about = read("en/about/index.html");
    expect(about).toContain('id="team"');
    for (const name of ["Wahyoe Kurniawan, S.E.", "Vera Eka Permatasari", "Selvi Febi Safitri, S.M."]) {
      expect(about).toContain(name);
    }
    expect(about).toContain("President Director");
    expect(about).not.toContain("<img");
    expect(read("id/tentang-kami/index.html")).toContain("Direktur Utama");

    const product = read("id/produk/briket-arang-tempurung-kelapa-untuk-shisha/index.html");
    expect(product).toContain('id="grade-comparison"');
    expect(product).toContain('class="table-scroll" role="region"');
    expect(product).toContain("Ukuran khusus perlu disetujui per pesanan.");
    expect(product).not.toMatch(/mm mm/u);
    expect(product.match(/<h1\b/gu)).toHaveLength(1);
  }, 90_000);

  it("keeps the component gallery out of normal builds and renders it without photos", () => {
    const { read } = build(createProject(), { PUBLIC_COMPONENT_GALLERY: "true" });
    for (const [lang, label] of [["en", "Ash content"], ["id", "Kadar abu"]]) {
      const gallery = read(`${lang}/component-gallery/index.html`);
      expect(gallery.match(/<h1\b/gu)).toHaveLength(1);
      expect(gallery).not.toContain("hero__layout--media");
      expect(gallery).not.toContain("<img");
      expect(gallery).not.toMatch(/\sstyle="/u);
      expect(gallery).toContain(label);
      expect(gallery).toContain("process-steps");
      expect(gallery).toContain("cta-band");
      expect(gallery).toContain('<meta name="robots" content="noindex, nofollow">');
    }
    expect(read("sitemap.xml")).not.toContain("component-gallery");
  }, 90_000);
});

describe("pages once images exist", () => {
  it("serve responsive images, labels, a sized og:image, the logo, and portraits; packaging examples appear", async () => {
    const root = createProject();
    await addImage(root, "brand/logo-permata-briquettes", 527, 474, "#c9a24a");
    await addImage(root, "products/hero-lineup", 2000, 1500, "#62735a");
    await addImage(root, "products/hero-background", 1600, 900, "#334433");
    await addImage(root, "shipping/container-loading", 1600, 900, "#223344");
    await addImage(root, "brand/whatsapp", 512, 512, "#33aa44");
    await addImage(root, "labs/carsurin", 520, 200, "#996633");
    await addImage(root, "labs/sgs", 420, 260, "#222222");
    await addImage(root, "products/shape-cube", 768, 576, "#222222");
    await addImage(root, "team/wahyoe-kurniawan", 373, 669, "#996644");
    await addImage(root, "packaging/inner-box", 900, 700, "#aa2222");

    const { read, output, emitted } = build(root);
    const home = read("id/index.html");

    expect(home).toContain("hero-backdrop--photo");
    // The hero background is decorative: empty alt text and no label or caption over it.
    expect(home).not.toContain("hero-backdrop__label");
    expect(home).not.toContain("Ilustrasi");
    expect(home).toContain("product-panel--dark");
    expect(home).toContain("product-panel--accent");
    expect(home).toContain("team-band__portraits");
    expect(home.match(/class="logo-tile"/gu)).toHaveLength(2);
    // With the logo file the button shows the picture only, no text.
    expect(home).toMatch(/<a class="whatsapp-float whatsapp-float--logo" href="https:\/\/wa\.me\/6281130887797" aria-label="Chat WhatsApp"><picture>/u);
    expect(home).not.toMatch(/whatsapp-float__label/u);
    expect(home).toContain('alt="Logo Carsurin"');
    expect(read("id/kualitas-dokumen/index.html")).toContain("partner-logos");
    expect(read("id/produk/index.html")).not.toContain("partner-logos");
    expect(home.match(/<h1[ >]/gu)).toHaveLength(1);
    expect(home).toMatch(/<picture>[\s\S]*type="image\/avif"[\s\S]*type="image\/webp"[\s\S]*<img /u);
    // Link previews keep the real product photo, never the illustration.
    expect(home).toContain('<meta property="og:image:alt" content="Briket arang tempurung kelapa dalam beberapa bentuk">');
    expect(home).toContain('fetchpriority="high"');
    expect(home).not.toMatch(/\sstyle="/u);

    // Header: the mark plus the visible brand name, and the logo doubles as the favicon.
    expect(home).toMatch(/<a class="site-home"[^>]*><img [^>]*alt(?:="")?[ >][^>]*class="logo__img"[\s\S]*?<span class="logo-text">Permata Briquettes<\/span>/u);
    expect(home).toMatch(/<link rel="icon" href="\/_astro\/logo-permata-briquettes[^"]+\.png">/u);

    const ogImage = home.match(/<meta property="og:image" content="([^"]+)"/u)?.[1];
    expect(ogImage).toMatch(/^https:\/\/www\.permatabriquettes\.com\/_astro\/.+\.jpg$/u);
    expect(home).toContain('<meta property="og:image:width" content="1200">');
    expect(home).toContain('<meta name="twitter:card" content="summary_large_image">');
    const ogFile = join(output, new URL(ogImage).pathname);
    const ogMeta = await sharp(ogFile).metadata();
    expect([ogMeta.width, ogMeta.height]).toEqual([1200, 630]);

    // A page without its own photo falls back to the logo on a plain backdrop.
    const contact = read("id/kontak/index.html");
    expect(contact).toMatch(/<meta property="og:image" content="https:\/\/www\.permatabriquettes\.com\/_astro\/logo-permata-briquettes[^"]+\.jpg">/u);

    // Renders and mockups are labeled; portraits use the person's name as alt text.
    const product = read("id/produk/briket-arang-tempurung-kelapa-untuk-shisha/index.html");
    expect(product).not.toContain("Ilustrasi");
    expect(product).toMatch(/alt="Briket berbentuk cube"/u);
    expect(product).toContain('class="grade-list"');
    const ordering = read("id/pemesanan-pengiriman/index.html");
    expect(ordering).toContain("hero-backdrop--photo");
    expect(ordering).not.toContain("Ilustrasi");
    expect(product).toContain("Pilihan grade");
    const about = read("en/about/index.html");
    expect(about).toMatch(/alt="Wahyoe Kurniawan, S\.E\."/u);
    expect(about).toContain("team-card__media");

    // Packaging examples: the supplied photos are published, each with its caption.
    const packaging = read("id/kemasan/index.html");
    expect(packaging).toContain('id="packaging-examples"');
    expect(packaging).toContain("<figcaption>Inner box</figcaption>");
    expect(emitted().some((file) => file.startsWith("inner-box"))).toBe(true);
    expect(read("en/packaging/index.html")).toContain("Packaging examples");
  }, 120_000);
});
