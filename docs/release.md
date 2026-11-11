# Release Procedure for the Resistance Scripts

The GitHub workflow `.github/workflows/release.yml` builds and publishes GitHub Releases.
The ace-blocker-site admin controls import to BunnyCDN.
The admin also controls when ACE Engine clients can download a release.

**A push to `main` does not create a new ACE Blocker bundle.**

ACE Engine downloads `resistance-scripts.zip`.
Its MITM proxy injects the downloaded scripts into pages.
The Tampermonkey adapter is not part of this production injection method.

## 1. Publish a GitHub Release

The **Publish Resistance Mode Release** GitHub Action has two methods.

### Method A: Start the Workflow Manually (Recommended)

1. In GitHub, open **Actions**.
2. Select **Publish Resistance Mode Release**.
3. Select **Run workflow**.
4. Choose the `main` branch.
5. Enter the required version, for example `1.2.3` or `v1.2.3`.
6. Select **Run workflow** again.

GitHub Actions checks the version.
It then runs the build and tests.
It makes the `v1.2.3` tag and publishes the GitHub Release.

### Method B: Push an Existing Version Tag (Optional)

```bash
git tag v1.2.3
git push origin v1.2.3
```

The tag push starts the same workflow.
The workflow checks the version, builds the scripts, runs tests, and publishes the release.

There is **no scheduled release publication**.
Before publication, the workflow must pass the Bun type check, unit tests, and full artifact tests.

Each published release contains:

- `resistance-scripts.zip` — ZIP file used by ACE Engine.
- `sha256_checksums.txt` — SHA-256 checksum for the ZIP.
- `scripts-data.json` — Catalog for inspection.

The workflow uses the repository's `GITHUB_TOKEN` with `contents: write`.
It does not need credentials for ace-blocker-site or BunnyCDN.

Release tags must have the form `vMAJOR.MINOR.PATCH`.
The manual version input also accepts `MAJOR.MINOR.PATCH`.
The workflow does not overwrite an existing release.
A manual run also rejects an existing tag.

Use a new version for every build.
ace-blocker-site treats imported versions as immutable.
It rejects a different SHA-256 for a version that already exists.

## Local Build and Validation (Optional)

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

Record the artifact's SHA-256:

```powershell
Get-FileHash .\dist\resistance-scripts.zip -Algorithm SHA256
```

## 2. Import the Release Through ace-blocker-site

1. Sign in to ace-blocker-site with an **admin** account.
2. Open `/admin/releases/resistance`.
3. Select **Import latest from GitHub**.
4. The site downloads the latest stable release from `Linea-Software/boredom-engine`.
5. The site checks the pinned `resistance-scripts.zip` URL and file size.
6. The site checks the ZIP signature and SHA-256.
7. It uses the GitHub digest, `sha256_checksums.txt`, or both for checksum verification.
8. It copies the checked file to BunnyCDN.
9. The site removes `v` from `vMAJOR.MINOR.PATCH` for the stored version. Example: `1.2.3`.
10. The site skips an imported version when its checksum is identical.
11. The site rejects an imported version when its checksum conflicts.
12. Check the import status on the admin page.
13. The new release starts in the **Staged** state.
14. Select **Make available** to permit client downloads.

The admin must select **Make available** before clients can download the release.

If necessary, use the existing **Deploy new** file-upload method.
Upload `dist/resistance-scripts.zip` with a new, safe version identifier.

Only authenticated admins can use the import endpoint.
The site starts the GitHub download itself.
No GitHub credentials or inbound callbacks are necessary.

## 3. Verify Release Metadata

- `GET /api/v1/releases/latest` must return the new `resistance` entry.
  Check that its version, size, and SHA-256 match the values from step 1.
- `GET /api/v1/scripts/resistance-mode` requires an engine API key for a Pro account.
  It must return a signed URL and the same `sha256`.

## 4. Test the ACE Engine Download

Use a computer that has a linked Pro account.

1. Start a content refresh from the ACE user interface.
2. Alternatively, use the authenticated typed remoc RPC: `triggerContentUpdate` or `downloadResistanceScripts`.
3. You can also wait for the scheduled content update.
4. Do not use the removed REST endpoint `POST /system/update/content`.
5. Check the engine log for a successful download, verification, extraction, and catalog reload.
6. Confirm that no SHA-256 mismatch occurred.
7. Open the **Resistance Mode** page or call remoc `getResistanceModeSettings`.
8. Check `scriptsVersion`, `scriptsLoaded`, `proEligible`, and `enabled`.
9. Confirm that `scriptsEnabled` is greater than zero.
10. Confirm that at least one intervention is enabled.
11. Confirm that `enforcementStatus: "operational"` is reported.
12. Do not use the removed REST endpoint `GET /resistance-mode/settings`.
13. Open YouTube again and reload the complete page.
14. Inspect ACE Engine proxy logs for injection into the **top-level** document.
15. Confirm that the injected scripts are enabled for YouTube.

A new GitHub tag does not prove that an ACE client downloaded the ZIP.
A source push does not prove this either.
ACE does not use the Tampermonkey bootstrap or browser-extension content scripts.
Test real proxy and TLS routing on the target operating system and browser.
Fixture smoke tests do not replace this test.

## Retention Policy

The site keeps old releases downloadable through `canBeDownloaded` until a retention policy is set.
ACE Engine always downloads the latest `resistance` release.
The updater does not support downgrades.
It compares version strings for exact matches.
Never use the same version for different content.

## Notes

- All catalog IDs use `snake_case`.
- Tracking scripts that used hyphenated IDs were removed.
- ACE stores each script's enabled state by its ID.
- A changed ID disconnects existing user selections until a compatibility alias or migration map exists.
- Do not change script IDs during this beta.
- Usage tracking has been removed completely.
- There is no tracking ZIP, tracking catalog, or tracking script in the build output.
