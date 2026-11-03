# Release procedure — resistance-scripts artifact

Release packaging and publication to **GitHub Releases** is automated by
`.github/workflows/release.yml`. The ace-blocker-site admin controls when
a published GitHub archive is imported to BunnyCDN and when it becomes
downloadable by Ace Engine clients.

## 1. Publish a GitHub Release

The `Release` GitHub Action follows the same model as `ace-hosts`:

- **Automatically:** on the first day of every month at **03:00 UTC**.
- **On demand:** GitHub → **Actions** → **Release** → **Run workflow**
  (select `main`).

No manual Git tag is needed. The workflow generates the tag from the UTC run
date, e.g. `v2026.11.03`, and publishes a GitHub Release only after Bun's type
check, unit tests and full artifact tests succeed. The release contains:

- `resistance-scripts.zip` — the artifact Ace Engine consumes
- `sha256_checksums.txt` — SHA-256 digest for the ZIP
- `scripts-data.json` — the catalog for inspection

The workflow uses the repository's built-in `GITHUB_TOKEN` with
`contents: write`; no site/CDN credentials are needed. As in `ace-hosts`, a
second run on the same UTC date replaces the GitHub Release/tag for that date.
**Do not re-run a release after importing it into ace-blocker-site unless the
archive is unchanged:** the site treats versions as immutable and rejects a
different SHA-256 for an existing version.

## Local build and validation (optional)

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

## 2. Import via the ace-blocker-site admin panel

1. Sign in to the site as an **admin**.
2. Open `/admin/releases/resistance` and click **Import latest from GitHub**.
3. The site fetches the latest stable `Linea-Software/boredom-engine` release,
   verifies the pinned `resistance-scripts.zip` URL, size, ZIP signature and
   SHA-256 (GitHub digest and/or `sha256_checksums.txt`), and mirrors it to
   BunnyCDN. The site uses the dated `vYYYY.MM.DD` tag without its `v` as
   the version identifier (e.g. `2026.11.03`). An already-imported identical version is skipped;
   a conflicting version/checksum is rejected.
4. Poll the status shown on the page. The imported release is **Staged** and
   will **not** be downloaded by clients until an admin clicks **Make available**.
5. If needed, the existing **Deploy new** file-upload workflow remains available
   for manually uploading `dist/resistance-scripts.zip` with a safe unique
   version identifier.

The import endpoint is accessible only to authenticated admins. GitHub
credentials and inbound callbacks are not required; downloads are
initiated by the site, not by GitHub Actions.

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

- Catalog ids are all snake_case (the tracking scripts that used hyphenated
  ids were removed). The engine persists per-script enable state **by id**,
  so a rename would orphan user toggles until a compatibility alias/migration
  map exists. Do not rename ids in this beta.
- Usage tracking is fully removed: there is no tracking ZIP, and no tracking
  catalog or tracking scripts exist in the build output.
