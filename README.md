# Permata Briquettes

Website bilingual (EN/ID) PT Permata Briquettes. Situs statis Astro + TypeScript, disajikan oleh
Cloudflare Worker lewat Static Assets. Worker yang sama menangani form inquiry (`/api/*`) dengan
D1, Turnstile, dan Resend.

Operasi (deploy, rollback, konfigurasi, perawatan inquiry): [docs/operations.md](docs/operations.md).
Rekaman izin dan asal aset: [docs/asset-register.md](docs/asset-register.md).

## Arsitektur

```
Browser ──> Cloudflare Worker (worker/src)
              ├─ /api/inquiries, /api/webhooks/resend  -> logika inquiry + D1 + Turnstile + Resend
              └─ semua path lain                        -> Static Assets (dist/, hasil build Astro)
```

- Situs: Astro statis, i18n EN/ID, konten dari content collections.
- Worker: `worker/src`, migration D1 di `worker/migrations`.
- Environment: `staging` (`staging.permatabriquettes.com`) dan `production`
  (`www.permatabriquettes.com`), dideklarasikan di `wrangler.jsonc`.

## Struktur folder

| Path | Isi |
| --- | --- |
| `src/pages`, `src/layouts`, `src/components`, `src/styles` | Route, layout, komponen, CSS. |
| `src/content/{pages,products,team,blog}` | Konten per bahasa (Markdown/YAML), divalidasi `src/content.config.ts`. |
| `src/config` | Navigasi, SEO, kontak, slot media (`media-slots.ts`), dokumen, copy inquiry. |
| `src/assets/<folder>` | Foto, logo, dokumen. Tiap folder punya `README.md` hasil generate. |
| `worker/` | Worker inquiry, migration, template maintenance, test Worker. |
| `scripts/` | Build per environment, audit build, smoke test, sinkronisasi aset. |
| `tests/` | Test build dan konfigurasi (Vitest). |
| `.github/workflows/cloudflare-deploy.yml` | Deploy manual staging/production. |

## Perintah harian

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan. |
| `npm run check` | `astro check` + type-check Worker. |
| `npm test` | Test Worker, copy, dan build. |
| `npm run build` | Build lokal ke `dist/`. |
| `npm run build:staging` / `build:production` | Build per environment (lihat operations.md). |
| `npm run audit:staging` / `audit:production` | Audit hasil build di `dist/`; hasil ditulis ke `reports/` (diabaikan git). |
| `npm run worker:check[:staging\|:production]` | Dry-run bundle Worker, tanpa upload. |
| `npm run db:migrate:local` | Terapkan migration ke D1 lokal. |
| `npm run assets:check` / `assets:sync` | Validasi / regenerasi README folder aset dari `media-slots.ts`. |
| `npm run assets:report` | Laporan aset: slot kosong, resolusi, rasio. |
| `npm run gallery` | Dev server dengan galeri komponen (`/en/component-gallery/`). |

Sebelum PR: `npm run check`, `npm test`, `npm run assets:check`, dan
`npm run build:staging && npm run audit:staging`.

## Mengubah konten dan aset

Lihat bagian "Konten dan aset" di [docs/operations.md](docs/operations.md).
