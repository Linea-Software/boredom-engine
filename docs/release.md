# Release procedure — resistance-scripts artifact

The release procedure for the v1 beta is a documented, reproducible manual
runbook (fully automated publishing is deliberately not implemented —
credentials and release policy for production publishing do not exist yet).

## 1. Build and validate (boredom-engine)

```bash
cd boredom-engine
bun install
bun run build          # fails on metadata/catalog contract violations
bun run test           # unit tests: metadata, contract, host matching
bun run deploy         # creates dist/resistance-scripts.zip
bun run test:artifact  # end-to-end: rebuild + validate zip root layout/catalog
```

Record the SHA-256 of the artifact:

```powershell
Get-FileHash .\dist\resistance-scripts.zip -Algorithm SHA256
```

## 2. Upload via the ace-blocker-site admin panel

1. Sign in to the site as an **admin**.
2. Open the admin release manager (`/admin/releases/resistance`).
3. Choose a **version identifier** (e.g. `2026-09-01` or `1.2.0`). Keep it
   stable: the engine compares it as an exact string.
4. Upload `dist/resistance-scripts.zip`. The site validates size, file type,
   and version format (see `src/lib/server/api/routers/admin/resistance.ts`),
   stores the object on BunnyCDN and records `version`/`sha256`/`size` in
   Postgres.

## 3. Verify metadata

- `GET /api/v1/releases/latest` must return the new `resistance` entry with
  the exact version, size, and SHA-256 recorded in step 1.
- `GET /api/v1/scripts/resistance-mode` (with an engine API key on a Pro
  account) must return a signed URL + the same sha256.

## 4. Engine download smoke test

On a machine with a Pro account linked:

1. Restart the engine (or wait for the 24 h content-update cycle; in debug
   builds `POST /system/update/content` triggers it immediately).
2. Check the engine log for the new version:
   `Resistance scripts extracted to ...` and no SHA-256 mismatch retries.
3. `GET /resistance-mode/settings` must report the new `scriptsVersion` and
   `enforcementStatus: "operational"` (after enabling Resistance Mode with a
   non-`none` intensity).

## Retention policy

`canBeDownloaded` on old releases: the site keeps old releases downloadable
until a retention policy is decided; the engine always downloads the latest
`resistance` release. Downgrades are not supported by the updater (version
strings compare exactly), so an uploaded version must never be reused with
different content.

## Notes

- **Id normalization is deferred.** Some catalog ids use hyphens
  (`youtube-usage-stats`, `generic-dominant-color`) while most use
  snake_case. The engine persists per-script enable state **by id**, so a
  rename would orphan user toggles until a compatibility alias/migration
  map exists. Do not rename ids in this beta.
- The tracking ZIP (`dist/tracking-scripts.zip`) is **not** part of the v1
  pipeline; do not upload it.
