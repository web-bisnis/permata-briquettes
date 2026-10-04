import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MEDIA_FOLDERS, MEDIA_SLOTS } from "../src/config/media-slots.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");

const FOLDER_PURPOSE = {
  brand: "Logo, ikon, dan gambar pratinjau tautan.",
  products: "Foto produk: lini produk, bentuk, dan abu hasil pembakaran.",
  packaging: "Foto kemasan.",
  team: "Foto anggota tim Permata Briquettes (satu file per orang, nama file = nama-anggota).",
  documents: "Pratinjau dokumen (ROA, SHT, MSDS, ISO).",
  shipping: "Foto proses pengiriman.",
  partners: "Materi mitra produksi. Tidak dipublikasikan sebelum izin tertulis.",
  labs: "Logo laboratorium dan surveyor (Carsurin, Beckjorindo, SGS, Sucofindo): SVG atau PNG transparan, logo asli dari pemiliknya tanpa diubah warna.",
};

const FORMAT_RULES = [
  "Format: JPG atau PNG asli, tanpa watermark dan tanpa teks tambahan. Logo: SVG.",
  "Ukuran: sisi panjang sesuai kolom \"Lebar min.\"; jangan diperkecil atau dikompres sebelum diserahkan.",
  "Nama file: persis seperti kolom \"Nama file\", satu ekstensi per aset (jpg, png, webp, avif, atau svg).",
  "Situs membuat versi AVIF/WebP dan ukuran responsif sendiri saat build.",
  "Slot yang filenya belum ada tidak menampilkan apa pun; halaman tetap tayang normal.",
];

function aspectLabel(aspect) {
  return aspect.replace("/", ":").replace("1.91:1", "1,91:1");
}

function notesFor(entry) {
  return [
    entry.hold ? `DITAHAN: ${entry.hold}` : "",
    entry.gate ? `Syarat: ${entry.gate}` : "",
  ].filter(Boolean).join(" ");
}

function slotRows(slots) {
  return slots.map((entry) => {
    const file = entry.id.split("/")[1];
    return `| \`${file}\` | ${entry.priority} | ${entry.subject} | ${aspectLabel(entry.aspect)} | ${entry.minWidth} px | ${entry.usedOn} | ${notesFor(entry)} |`;
  });
}

const TABLE_HEAD = [
  "| Nama file | Prioritas | Isi foto | Rasio | Lebar min. | Dipakai di | Catatan |",
  "| --- | --- | --- | --- | --- | --- | --- |",
];

const outputs = new Map();

for (const folder of MEDIA_FOLDERS) {
  const slots = MEDIA_SLOTS.filter((entry) => entry.id.startsWith(`${folder}/`));
  const lines = [
    `# src/assets/${folder}/`,
    "",
    FOLDER_PURPOSE[folder],
    "",
    "Taruh file di folder ini dengan nama persis seperti di tabel. File ini dibuat otomatis dari",
    "`src/config/media-slots.ts` (`npm run assets:sync`); jangan diedit tangan.",
    "",
    ...FORMAT_RULES.map((rule) => `- ${rule}`),
    "",
    ...(slots.length > 0 ? [...TABLE_HEAD, ...slotRows(slots)] : ["Belum ada slot untuk folder ini."]),
    ...(folder === "team"
      ? [
          "",
          "Foto anggota tim tidak punya slot tetap. Tiap orang didaftarkan di `src/content/team/<bahasa>/<nama>.yaml`",
          "(field `photo: team/<nama-file>`), dengan nama, jabatan, dan bio. Rasio asli 9:16 boleh; kartu menampilkan",
          "bagian atas foto (rasio 4:5).",
        ]
      : []),
    "",
  ];
  outputs.set(join(root, "src", "assets", folder, "README.md"), lines.join("\n"));
}

const checklist = [
  "# Daftar aset yang dibutuhkan",
  "",
  "Dibuat otomatis dari `src/config/media-slots.ts` (`npm run assets:sync`).",
  "Taruh setiap file di folder `src/assets/<folder>/` dengan nama persis seperti di tabel.",
  "",
  ...FORMAT_RULES.map((rule) => `- ${rule}`),
  "- Setiap foto yang diserahkan dicatat di `docs/asset-register.md` (sumber, izin, caption, alt text).",
  "",
];
for (const priority of ["P1", "P2", "P3"]) {
  const slots = MEDIA_SLOTS.filter((entry) => entry.priority === priority);
  checklist.push(
    `## ${priority}${priority === "P3" ? " (menunggu izin)" : ""}`,
    "",
    "| Folder | Nama file | Isi foto | Rasio | Lebar min. | Dipakai di | Catatan |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...slots.map((entry) => {
      const [folder, file] = entry.id.split("/");
      return `| \`${folder}/\` | \`${file}\` | ${entry.subject} | ${aspectLabel(entry.aspect)} | ${entry.minWidth} px | ${entry.usedOn} | ${notesFor(entry)} |`;
    }),
    "",
  );
}
outputs.set(join(root, "docs", "asset-checklist.md"), checklist.join("\n"));

let stale = 0;
for (const [path, content] of outputs) {
  const current = existsSync(path) ? readFileSync(path, "utf8") : undefined;
  if (current === content) continue;
  stale += 1;
  if (checkOnly) {
    console.error(`Out of date: ${path}`);
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
}

if (checkOnly && stale > 0) {
  console.error("Run `npm run assets:sync` to regenerate the asset folders.");
  process.exit(1);
}
console.log(checkOnly ? "Asset folders are up to date." : `Asset folders synced (${stale} files written).`);
