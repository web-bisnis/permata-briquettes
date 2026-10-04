# Laporan Tahap 11 — Perbaikan versi privasi yang tidak sinkron (submit staging ditolak)

Tanggal: 5 Oktober 2026

## Ringkasan

Pada pengujian manual di staging (run #15, commit `48e8b37`), submit inquiry EN tanpa
consent menampilkan "The inquiry could not be sent. Please try again." Penyebab:
`PRIVACY_NOTICE_VERSION` di `wrangler.jsonc` (`sha256-82f9288a…`) tidak sama dengan versi
yang dikirim halaman (`sha256-796520ac…`). Worker membandingkan keduanya secara persis
dan menolak setiap payload dengan `400 invalid_payload`; klien menampilkan pesan error
generik untuk semua respons non-OK. Consent tidak terkait: **semua** submit akan gagal,
dengan atau tanpa consent, EN maupun ID.

Status: **diperbaiki di kode, belum di-deploy.** Staging tetap menolak submit sampai
release baru dideploy.

## Penyebab

- Versi privasi dihitung di `src/config/inquiry-versions.ts` dari isi Markdown **mentah**
  kedua halaman privasi, termasuk frontmatter.
- Commit `2fe9a51` menambahkan `layout: sections` dan `heroStyle: plain` pada frontmatter
  `privacy.md` dan `privasi.md`. Teks notice tidak berubah (diff hanya dua baris
  frontmatter per file), tetapi hash berubah.
- Nilai di `wrangler.jsonc` (staging dan production) dan `.dev.vars.example` adalah
  hasil hitung lama dan tidak ikut diperbarui. Tidak ada tes yang membandingkannya.
- Bukti: `curl` GET halaman staging menghasilkan `data-privacy-version="sha256-796520ac…"`;
  validasi Worker (`worker/src/validation.ts`) menolak bila nilainya berbeda dari variabel
  Worker. `data-consent-version` sudah sama (`sha256-b7f8c726…`).

## File berubah

| File | Perubahan |
| --- | --- |
| `wrangler.jsonc` | `PRIVACY_NOTICE_VERSION` staging dan production diperbarui ke `sha256-796520ac…`. |
| `.dev.vars.example` | Nilai contoh disamakan. |
| `tests/inquiry-copy.test.mjs` | Tiga tes baru: versi di config staging, production, dan `.dev.vars.example` harus sama dengan versi hasil build. Dibuktikan gagal dengan nilai lama dan lulus dengan nilai baru. |

## Hasil verifikasi

- `npm run check`: 0 error, 0 warning, 0 hint.
- `tests/inquiry-copy.test.mjs` dan `tests/media-slots.test.mjs`: 16 lulus.
- `npm test` penuh lokal: 139 lulus, 1 gagal pada `media-slots` (`assets:sync --check`).
  Itu artefak line ending Windows yang sama seperti sebelum tahap 9; setelah
  `npm run assets:sync` tes tersebut lulus, dan CI (run #15) lulus 137/137.

## Risiko dan keputusan tertunda

- **Rapuh terhadap perubahan frontmatter.** Hash mencakup frontmatter, jadi perubahan
  kosmetik (layout, deskripsi) mengubah versi notice dan, tanpa pembaruan variabel,
  mematahkan form. Tes baru menangkapnya di CI, tetapi lebih baik hash hanya mencakup
  isi notice. Itu mengubah definisi identifier versi sehingga perlu keputusan eksplisit
  (belum ada data consent produksi); tidak dikerjakan di tahap ini.
- **Klien menampilkan pesan generik untuk semua penolakan**, sehingga sulit
  mendiagnosis dari sisi pengguna. Pesan copy adalah copy approved, jadi tidak diubah.
  Diagnosis dilakukan lewat DevTools Network (kode respons dan `code` JSON).
- Perlu **deploy ulang staging** dari commit baru agar variabel Worker yang benar aktif.
- Pengujian end-to-end lain (email, D1, idempotensi, rate limit, bounce) belum dilakukan.

## Rekomendasi berikutnya

1. Push commit, buat branch release baru, jalankan workflow staging.
2. Ulangi submit EN tanpa consent; setelah berhasil lanjutkan daftar uji end-to-end.
3. Putuskan apakah versi notice sebaiknya dihitung dari isi tanpa frontmatter.
