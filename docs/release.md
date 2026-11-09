# Release procedure — resistance-scripts artifact

Release packaging and publication to **GitHub Releases** is automated by
`.github/workflows/release.yml`. The ace-blocker-site admin controls when
a published GitHub archive is imported to BunnyCDN and when it becomes
downloadable by Ace Engine clients. **A push to `main` is not a new ACE
Blocker bundle.** ACE injects the contents of its downloaded
`resistance-scripts.zip` directly through the MITM proxy; the Tampermonkey
adapter is unrelated to the product's production injection path.

## 1. Publish a GitHub Release

The `Publish Resistance Mode Release` GitHub Action supports two paths:

1. **Manual (recommended):** open GitHub → **Actions** →
   **Publish Resistance Mode Release** → **Run workflow**. Choose `main` and
   enter the required **version**, for example `1.2.3` or `v1.2.3`.
   Click **Run workflow**. GitHub Actions validates the version, runs the build
   and tests, creates the `v1.2.3` tag automatically and publishes the Release.
2. **Push an existing version tag (optional):**
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```
   This also triggers the action, which validates, builds, tests and publishes
   the GitHub Release for the pushed tag.

There is **no scheduled publication**. The workflow creates a GitHub Release
only after Bun's type check, unit tests and full artifact tests succeed. Each
release contains:

- `resistance-scripts.zip` — the artifact Ace Engine consumes
- `sha256_checksums.txt` — SHA-256 digest for the ZIP
- `scripts-data.json` — the catalog for inspection

The workflow uses the repository's built-in `GITHUB_TOKEN` with
`contents: write`; no site/CDN credentials are needed. Versions must match
`vMAJOR.MINOR.PATCH` (the manual input also accepts `MAJOR.MINOR.PATCH`).
An already-existing release is **never overwritten**; a manual run also
refuses to reuse an existing tag. Use a new version for each build because
ace-blocker-site treats imported versions as immutable and rejects a
different SHA-256 for an existing version.

## Local build and validation (optional)

```bash
cd boredom-engine
bun install
bun run check          # TypeScript validation; required by the release workflow
bun run build          # fails on metadata/catalog contract violations
bun run test           # unit tests: metadata, contract, host matching
bun run deploy         # creates dist/resistance-scripts.zip
bun run test:artifact  # end-to-end: rebuild + validate zip root layout/catalog
bun run test:smoke --grep 'ACE direct injection'  # direct JS tags with YouTube-style CSP
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
   BunnyCDN. The site uses the `vMAJOR.MINOR.PATCH` tag without its `v`
   as the version identifier (e.g. `1.2.3`). An already-imported identical
   version is skipped; a conflicting version/checksum is rejected.
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

1. Refresh content from ACE's UI or its authenticated **typed remoc RPC**
   (`triggerContentUpdate` / `downloadResistanceScripts`), or wait for the
   scheduled content update. The engine no longer exposes the old local REST
   route `POST /system/update/content`.
2. Check the engine log for a successful resistance-script download/verify,
   extraction and catalog reload, with no SHA-256 mismatch.
3. Use the **Resistance Mode** page (or remoc
   `getResistanceModeSettings`) to verify the newly published
   `scriptsVersion`, `scriptsLoaded`, a nonzero `scriptsEnabled` count,
   `proEligible`, `enabled`, and at least one enabled intervention, plus
   `enforcementStatus: "operational"`. This replaces the obsolete
   `GET /resistance-mode/settings` REST route.
4. Fully navigate/reload YouTube and inspect ACE Engine's proxy logs for
   injection of the site's enabled scripts into the **top-level** document.
   A new GitHub tag or source push alone does not prove that a client has
   downloaded the new ZIP. ACE uses neither the Tampermonkey bootstrap nor
   a browser-extension content script. Test actual proxy/TLS routing on the
   intended OS/browser separately from the fixture smoke tests.

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
