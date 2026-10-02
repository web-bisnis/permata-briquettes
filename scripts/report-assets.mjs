import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { MEDIA_SLOTS, getMediaSlot } from "../src/config/media-slots.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = join(root, "src", "assets");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"]);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function ratioOf(aspect) {
  const [w, h] = aspect.split("/").map(Number);
  return w / h;
}

const files = existsSync(assetRoot)
  ? walk(assetRoot).filter((file) => IMAGE_EXTENSIONS.has(extname(file).toLowerCase()))
  : [];
const delivered = new Map();
const rows = [];
const problems = { missing: [], unregistered: [], small: [], ratio: [], held: [], large: [] };

for (const file of files) {
  const id = relative(assetRoot, file).split("\\").join("/").replace(/\.[^./]+$/u, "");
  delivered.set(id, file);
  const slot = getMediaSlot(id);
  const bytes = statSync(file).size;
  const meta = extname(file).toLowerCase() === ".svg" ? undefined : await sharp(file).metadata();
  const dimensions = meta ? `${meta.width}x${meta.height}` : "svg";
  const notes = [];

  if (!slot) {
    if (!id.startsWith("team/")) {
      problems.unregistered.push(id);
      notes.push("tidak terdaftar di media-slots.ts (tidak dipakai halaman mana pun)");
    }
  } else {
    if (slot.hold) {
      problems.held.push(id);
      notes.push("DITAHAN");
    }
    if (meta?.width && meta.width < slot.minWidth) {
      problems.small.push(`${id} (${meta.width}px, minimum ${slot.minWidth}px)`);
      notes.push(`resolusi rendah: ${meta.width}px < ${slot.minWidth}px`);
    }
    if (meta?.width && meta.height) {
      const actual = meta.width / meta.height;
      const wanted = ratioOf(slot.aspect);
      if (Math.abs(actual - wanted) / wanted > 0.12) {
        problems.ratio.push(`${id} (${actual.toFixed(2)}, diminta ${wanted.toFixed(2)})`);
        notes.push(`rasio ${actual.toFixed(2)} berbeda dari ${slot.aspect} (akan dipotong)`);
      }
    }
  }
  if (bytes > 3_000_000) {
    problems.large.push(id);
    notes.push(`file besar (${(bytes / 1_000_000).toFixed(1)} MB)`);
  }
  rows.push({ id, dimensions, size: `${Math.round(bytes / 1024)} KB`, notes: notes.join("; ") });
}

for (const slot of MEDIA_SLOTS) {
  if (!delivered.has(slot.id)) problems.missing.push(`${slot.id} [${slot.priority}]`);
}

console.log(`Aset terkirim: ${rows.length}`);
for (const row of rows) {
  console.log(`  ${row.id.padEnd(34)} ${row.dimensions.padEnd(10)} ${row.size.padStart(8)}  ${row.notes}`);
}
const section = (title, list) => {
  console.log(`\n${title} (${list.length})`);
  for (const item of list) console.log(`  - ${item}`);
};
section("Slot belum ada filenya", problems.missing);
section("Resolusi di bawah minimum", problems.small);
section("Rasio berbeda dari slot", problems.ratio);
section("Ditahan, belum tampil di situs", problems.held);
section("File tidak terdaftar", problems.unregistered);
