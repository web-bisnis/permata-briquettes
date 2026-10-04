# Permata Briquettes

Fondasi website statis menggunakan Astro dan TypeScript.

## Perintah

- `npm run dev` — menjalankan server pengembangan.
- `npm run check` — memeriksa Astro dan TypeScript.
- `npm run build` — menghasilkan website statis di `dist/`.
- `npm run preview` — meninjau hasil build secara lokal.
- `npm test` — menjalankan pengujian Worker, copy, dan build gated dengan mock lokal.
- `npm run worker:check` — membundel Worker sebagai dry-run tanpa deployment.
- `npm run build:staging` / `npm run build:production` — build reproducible
  dengan Cloudflare Web Analytics dipaksa nonaktif. Inquiry nonaktif kecuali
  staging diberi `PUBLIC_INQUIRY_FORM_ENABLED=true`, mode `live`, dan
  `PUBLIC_TURNSTILE_SITE_KEY`; production menolak (build gagal) bila salah satunya
  diisi.
- `npm run worker:check:staging` / `npm run worker:check:production` — dry-run
  konfigurasi Wrangler bernama tanpa upload.
- `npm run db:migrate:local` — menerapkan migration hanya ke simulator D1 lokal.

Blog: artikel Markdown di `src/content/blog/{en,id}/` dan gambar di
`src/assets/blog/<nama-artikel>/`. Hanya `draft: false` yang dirender; untuk
meninjau draft secara lokal jalankan `npm run dev` dengan
`PUBLIC_BLOG_PREVIEW_DRAFTS=true`. Cara menerbitkan ada di
`src/content/blog/README.md`.

Inquiry Worker dan form nonaktif secara default. Build hanya merender form bila
`PUBLIC_INQUIRY_FORM_ENABLED=true` dan `PUBLIC_INQUIRY_FORM_MODE` bernilai
`local-mock`, atau bernilai `live` dengan `PUBLIC_TURNSTILE_SITE_KEY` tersedia.
Mode `local-mock` tidak melakukan request jaringan dan menolak simulasi submit
di hostname selain loopback. Lihat `reports/05-inquiry-copy-revision-01.md` untuk
bukti copy, feature gate, versi deterministik, dan hasil pengujian.

Runbook provisioning, deployment, migration, rollback, dan aktivasi terpisah
tersedia di `docs/cloudflare-deployment.md`. Workflow GitHub hanya dapat dipicu
manual. Target staging membangun form live dan mengaktifkan Worker inquiry
(`INQUIRY_ENABLED="true"` hanya pada config deploy yang dihasilkan); target
production selalu membangun inquiry, cron retry, dan analytics nonaktif. Cron
retry tidak diaktifkan oleh workflow.
