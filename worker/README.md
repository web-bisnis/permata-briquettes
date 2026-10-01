# Cloudflare inquiry Worker

Worker Tahap 5 disiapkan tetapi nonaktif secara default. `wrangler.jsonc`
menetapkan `INQUIRY_ENABLED=false`, tidak memiliki route deployment, memakai ID
D1 placeholder, dan tidak mengaktifkan cron. Jangan mengubah activation flag
sampai binding, secrets, domain Resend, rate-limit capacity, dan environment
Cloudflare telah diverifikasi. Privacy notice serta copy form dan konfirmasi
buyer telah tersedia; hash deterministik dan template non-rahasia dicantumkan
pada `.dev.vars.example`.

## Routes

- `POST /api/inquiries` — inquiry JSON same-origin.
- `POST /api/webhooks/resend` — event hard bounce/complaint dengan signature
  Svix/Resend yang valid.
- Request lain diteruskan ke binding Static Assets.

Kedua endpoint mengembalikan `503` ketika activation gate belum lengkap. CORS
tidak dikonfigurasi. Origin inquiry publik dibatasi ke dua origin yang disetujui
di `src/domain.ts`; local development hanya menerima origin loopback dan memakai
adapter Turnstile/Resend mock.

## Local-only commands

- `npm test` — unit/integration tests dengan repository dan network mock.
- `npm run worker:check` — bundle dry-run; tidak melakukan deployment.
- `npm run db:migrate:local` — menerapkan migration hanya pada simulator D1.
- `npm run db:migrations:list:local` — memeriksa status migration lokal.

Jangan menambahkan `--remote` pada tahap ini. Prosedur maintenance retensi manual
berada di `maintenance/README.md`.
