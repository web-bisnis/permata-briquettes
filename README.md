# Permata Briquettes

Fondasi website statis menggunakan Astro dan TypeScript.

## Perintah

- `npm run dev` — menjalankan server pengembangan.
- `npm run check` — memeriksa Astro dan TypeScript.
- `npm run build` — menghasilkan website statis di `dist/`.
- `npm run preview` — meninjau hasil build secara lokal.
- `npm test` — menjalankan pengujian Worker, copy, dan build gated dengan mock lokal.
- `npm run worker:check` — membundel Worker sebagai dry-run tanpa deployment.
- `npm run db:migrate:local` — menerapkan migration hanya ke simulator D1 lokal.

Inquiry Worker dan form nonaktif secara default. Build hanya merender form bila
`PUBLIC_INQUIRY_FORM_ENABLED=true` dan `PUBLIC_INQUIRY_FORM_MODE` bernilai
`local-mock`, atau bernilai `live` dengan `PUBLIC_TURNSTILE_SITE_KEY` tersedia.
Mode `local-mock` tidak melakukan request jaringan dan menolak simulasi submit
di hostname selain loopback. Lihat `reports/05-inquiry-copy-revision-01.md` untuk
bukti copy, feature gate, versi deterministik, dan hasil pengujian.
