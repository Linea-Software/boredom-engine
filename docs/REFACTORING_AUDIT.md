> **Historical audit:** This report describes the architecture before independent interventions.
> Notes about intensity and old APIs no longer define current behavior.
> Use the current README and catalog contract for current behavior.
> Keep this report as a record of the original audit.

# Boredom Engine Refactoring Audit

**Date:** 2026-10-23
**Status:** Read-only source audit. No product code changes.
**Method:** `C:\Projects\ace-project\ace-blocker\docs\ai\REFACTORING_PLAYBOOK.md` was the required workflow.
The local `AGENTS.md` supplied repository tooling and code rules.
Other refactoring guidance did not take precedence over the playbook.

## Scope and Baseline

The audit inspected these areas:

- Bun build and deployment tools
- Catalog contract
- Tampermonkey loader
- Shared browser utilities
- Representative website scripts
- Tests
- ZIP artifact contract with ACE Engine

The `resistance-scripts.zip` artifact had to keep a valid `scripts-data.json` catalog.
It also had to keep the reverse-domain JavaScript paths.
Do not change script IDs or the historical injection and intensity behavior as incidental cleanup.

The audit recorded these results:

- `bun run test`: **PASS**. 28 unit tests.
- `bun run test:artifact`: **PASS**. Six artifact tests, including a real build and ZIP creation.
- `bunx tsc --noEmit`: **FAIL**. Three TS2339 errors in `tests/unit/tampermonkey.test.ts:119,125,133`.
  The mock `win.__RAN__` property was missing from its inferred type.
- Playwright browser smoke tests: **NOT RUN**.
- ACE Engine consumption tests: **NOT RUN**.

These results do not prove live-website or Windows proxy correctness.
Priorities reflect release impact, maintenance impact, and regression risk.
Priorities do not reflect file length or the estimated number of removed lines.
Treat each finding as a separate task.

## Verified Findings, in Priority Order

### BE-01 — P0 — Await Catalog Validation Before You Write Output

**Status:** Verified.
**Change risk:** Low. The release boundary is sensitive.

**Evidence**

- `scripts/adapters/default.ts:145-154` called asynchronous `validateCatalog(...)` without `await`.
- That code then wrote `dist/scripts-data.json`.
- `scripts/catalog-contract.ts:84-87,148-155` rejected invalid catalogs asynchronously.
- Thus, catalog validation was not a completed condition before the catalog write or Tampermonkey build.
- Tests awaited validation directly in `tests/unit/catalog-contract.test.ts:75-148`.
- Artifact tests also awaited it in `tests/artifact.test.ts:85-100`.
- The tests did not cover a build that failed because its catalog was invalid.

**Required change and acceptance checks**

1. Await catalog validation before output generation.
2. Build an intentionally invalid catalog in an isolated fixture.
3. Confirm that the build returns a nonzero exit status.
4. Confirm that an invalid artifact is not treated as a successful output.
5. Keep the catalog schema and existing error information unchanged.

### BE-02 — P1 — Remove Old Distribution Files and Check ZIP Contents

**Status:** Verified.
**Change risk:** Medium. The artifact layout must remain compatible.

**Evidence**

- `scripts/adapters/default.ts:55-65` built files in `dist/normal` without removing old output.
- `scripts/deploy.ts:17-35,61-66` added every remaining file in that directory to the ZIP.
- A removed or renamed script could therefore remain in the published ZIP.
- `tests/artifact.test.ts:159-183` checked that referenced files existed.
- It did not reject ZIP files that were absent from the catalog.
- `tests/artifact.test.ts:102-133` checked catalog-to-ZIP inclusion only.
- `scripts/adapters/tampermonkey.ts:617-629` also left old generated wrappers.
- Those wrappers were outside the engine ZIP.

**Required change and acceptance checks**

1. Build into clean output directories or a new staging directory.
2. Make sure that a failed build cannot publish old and new files together.
3. Add an extra, obsolete JavaScript file to a test fixture.
4. Confirm that the ZIP rejects that unexpected file.
5. Confirm that the ZIP contains exactly the catalog-referenced bundles and manifest.
6. Keep the existing ZIP entry paths.

### BE-03 — P1 — Make the TypeScript Check Reliable

**Status:** Verified.
**Change risk:** Low. The required changes affect tests only.

**Evidence**

- `bunx tsc --noEmit` failed at `tests/unit/tampermonkey.test.ts:119,125,133`.
- The mock `win.__RAN__` property was not declared in its inferred type.
- Runtime tests passed.
- `tsconfig.json:7,24` enabled strict type checking for tests.

**Required change and acceptance checks**

1. Give the test window or mock an explicit type.
2. Do not disable `strict`.
3. Do not exclude tests from type checking.
4. Add or document a repeatable `typecheck` command.
5. Confirm that `bunx tsc --noEmit` passes.
6. Confirm that both Bun test suites pass.

### BE-04 — P2 — Remove Unused Experimental Utilities

**Status:** Verified. Repository searches found no consumers.
**Change risk:** Low.

**Evidence**

- `src/common/dom.ts:1-7` exported the no-op `runAsEarlyAsPossible`.
- `src/common/network.ts:1-7,13-82` contained unused `addDelayToNetwork` and `addPacketLossToNetwork`.
- These functions modified the global fetch or XHR behavior.
- Symbol searches found declarations and comments but no repository consumers.
- The unused functions made experimental code look like supported shared APIs.

**Required change and acceptance checks**

1. Check consumers again before deletion.
2. Remove only the unused exports and implementations.
3. Keep `blockNetworkRequests` and used DOM functions.
4. Verify `bun run build`, unit tests, and artifact tests.

### BE-05 — P2 — Report Failed Rebuilds and Retain Pending Changes

**Status:** Verified.
**Change risk:** Low. The change affects development tools.

**Evidence**

- `scripts/dev.ts:14-24` ignored the build process exit status.
- It printed “Build complete” even when the build failed.
- It ignored file changes while `isBuilding` was true.
- `scripts/dev.ts:27-31` also ignored a failed first build.
- Development could therefore use old `dist` files and report success.
- File changes could be lost during a long build.

**Required change and acceptance checks**

1. Report a nonzero build exit status.
2. Keep one pending rebuild when files change during an active build.
3. Test the runner with a command that fails.
4. Test a file change that occurs during a build.
5. Do not introduce a new file-watcher framework.

## Candidates That Need More Tests or Product Approval

### BE-06 — P2 — Evaluate Continuous Scroll Enforcement

**Status:** Candidate.
**Change risk:** Medium. Website behavior can change.

**Evidence**

`src/common/scroll.ts:66-112` ran a continuous `requestAnimationFrame` loop.
It also registered `scroll` and `touchmove` handlers.
The loop could use unnecessary processing time.
Removing it could change programmatic scrolling or other edge cases.

**Required investigation**

1. Measure behavior and performance first.
2. Add scroll, resize, and visibility cases to `tests/smoke/limit-scrolling.spec.ts`.
3. Propose event-driven enforcement only if tests show equivalent behavior.

### BE-07 — P2 — Compare the Development Bootloader With the Catalog

**Status:** Candidate.
**Change risk:** Low. This change concerns development tools.

**Evidence**

`scripts/bootloader.js:4-57` contained a manually maintained list of six websites.
At the audit date, `src/sites/` and `docs/roadmap.md:14-30` listed thirteen websites.
The only text reference to the bootloader in the repository was the bootloader itself.
Developers could still use it manually.

**Required investigation**

1. Confirm whether anyone still uses the manual bootloader.
2. If it is unused, remove it.
3. If it is used, derive its script list from the validated catalog.
4. Do not add a second host-matching system just to remove the manual list.

### BE-08 — Product Decision Required — Live Intensity Changes

**Status:** Hypothesis. Not approved as a refactor.

**Evidence**

- `README.md:104-115` described intensity changes as immediate.
- `scripts/adapters/tampermonkey.ts:276-289` updated the global intensity value.
- Some scripts read intensity only when they started.
- Examples were `src/common/scroll.ts:13-26` and `src/common/styling.ts:53-73`.

**Required investigation**

1. Identify which historical scripts respond to changes without a reload.
2. Compare their behavior with the intended historical contract.
3. Get separate product approval for changes to applied effects or reload behavior.
4. Add browser regression tests for approved behavior changes.
5. Keep behavior unchanged during a cleanup-only task.

## Recommended Next Action at Audit Date

Implement **BE-01 only**.
Add a regression test for an invalid catalog build.
Request a separate architecture and type review of that small change.
Then address BE-02 before the next release artifact.
Do not combine these tasks with live-intensity or website-behavior changes.

## Verification and Safety Requirements for Later Work

For changes to the artifact, run:

- `bun run build`
- `bun run test`
- `bun run test:artifact`
- `bunx tsc --noEmit`

Compare ZIP contents with the current schema.
Verify that ACE Engine can consume the artifact.

For website effects, add focused Playwright smoke tests.
Compilation alone does not prove correct browser behavior.

Keep script IDs and the ZIP directory structure stable.
Do not make shared abstractions across unrelated websites without a clear need.
