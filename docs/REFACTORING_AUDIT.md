# Boredom Engine — Refactoring Audit

**Date:** 2026-10-23  
**Status:** read-only source audit; no product code changes  
**Method:** `C:\Projects\ace-project\ace-blocker\docs\ai\REFACTORING_PLAYBOOK.md` (authoritative workflow). The local `AGENTS.md` governs repository tooling and code conventions. Other refactoring guidance was not used to override the playbook.

## Scope and baseline

Reviewed the Bun build/deploy pipeline, catalog contract, Tampermonkey loader, common browser utilities, representative site scripts, test coverage, and the Ace Engine artifact boundary. The produced `resistance-scripts.zip` must continue to carry the current validated `scripts-data.json` and reverse-domain JS paths; script IDs and current injection/intensity behavior must not be changed incidentally.

- `bun run test`: **PASS**, 28 unit tests.
- `bun run test:artifact`: **PASS**, 6 artifact tests, including a real build and ZIP creation.
- `bunx tsc --noEmit`: **FAIL**, three TS2339 errors in `tests/unit/tampermonkey.test.ts:119,125,133` (mock `win.__RAN__` missing from its inferred type).
- Playwright/browser smoke tests and Ace Engine consumption checks: **not run**. No claims about live-site or Windows proxy correctness.

Priority reflects maintenance/release impact and regression risk, **not** file length or expected lines removed. Each item below is a separate, reviewable task.

## Ranked, verified findings

### BE-01 — P0 — Await catalog validation before writing outputs
**Status:** verified · **Change risk:** low; release boundary is sensitive.

`scripts/adapters/default.ts:145-154` calls the asynchronous `validateCatalog(...)` **without `await`**, then writes `dist/scripts-data.json`. `scripts/catalog-contract.ts:84-87,148-155` rejects invalid catalogs asynchronously. Thus validation is not an awaited precondition of publishing the catalog or proceeding to the Tampermonkey build. The unit/artifact tests await validation themselves (`tests/unit/catalog-contract.test.ts:75-148`; `tests/artifact.test.ts:85-100`) and do not exercise a negative build path.

**Task / acceptance:** await validation; test a deliberately invalid catalog in an isolated build fixture and assert a nonzero build result with no invalid artifact considered successful. Preserve the existing catalog schema and error information.

### BE-02 — P1 — Eliminate stale distribution files and test ZIP completeness
**Status:** verified · **Change risk:** medium (artifact layout).

`scripts/adapters/default.ts:55-65` bundles into `dist/normal` without clearing old outputs. `scripts/deploy.ts:17-35,61-66` recursively packages **every** file still in that directory. A deleted/renamed source can therefore leave an obsolete JS file in the distributed ZIP. `tests/artifact.test.ts:159-183` checks that referenced files exist but does **not** reject files absent from the catalog; `102-133` also only checks catalog-to-ZIP inclusion. `scripts/adapters/tampermonkey.ts:617-629` likewise leaves obsolete generated wrappers, albeit outside the engine ZIP.

**Task / acceptance:** generate into clean output trees (or a fresh staging directory); ensure failed builds cannot publish a mixed old/new artifact. Add a regression test with a stale extra JS file and assert the ZIP contains exactly the catalog-referenced bundles plus the manifest. Retain current ZIP paths.

### BE-03 — P1 — Restore TypeScript check as a reliable gate
**Status:** verified · **Change risk:** low (test-only).

`bunx tsc --noEmit` fails at `tests/unit/tampermonkey.test.ts:119,125,133` because `win.__RAN__` is absent from the inferred mock type, even though runtime tests pass. `tsconfig.json:7,24` enables strict type checking over tests.

**Task / acceptance:** explicitly type the test window/mock (do not weaken `strict` or exclude tests); add or document a repeatable `typecheck` command; require `bunx tsc --noEmit` and both Bun test suites to pass.

### BE-04 — P2 — Remove unreferenced experimental utilities
**Status:** verified (no repository call sites found) · **Change risk:** low.

`src/common/dom.ts:1-7` exports the no-op `runAsEarlyAsPossible`. `src/common/network.ts:1-7,13-82` retains unused global-fetch/XHR monkey patches `addDelayToNetwork` and `addPacketLossToNetwork`. Repository-wide symbol searches found their declarations/comments but no consumers. Keeping invasive, unsupported experimental helpers in the shared surface increases misleading API choices.

**Task / acceptance:** delete these exports and dead implementations only after a final consumer check; retain the used `blockNetworkRequests` and actual DOM helpers. Verify `bun run build`, unit and artifact tests.

### BE-05 — P2 — Report dev rebuild failure and handle edits during a build
**Status:** verified · **Change risk:** low (dev tooling).

`scripts/dev.ts:14-24` ignores the spawned build exit code, always prints “Build complete”, and returns immediately on watched changes when `isBuilding` is true. `scripts/dev.ts:27-31` also ignores a failed initial build. Consequently development can serve stale `dist` output while reporting success, and edits can be missed during long builds.

**Task / acceptance:** propagate/log nonzero exit status and retain one pending rebuild after events arriving during an active build; add a focused build-runner test using a failed command and a mid-build change. Do not introduce a new watcher framework.

## Candidates requiring characterization or product approval

### BE-06 — P2 — Evaluate continuous scroll enforcement
**Status:** candidate · **Change risk:** medium (site behavior).

`src/common/scroll.ts:66-112` runs a perpetual `requestAnimationFrame` loop while also registering `scroll` and `touchmove` handlers. This suggests avoidable foreground work, but removing the loop may affect programmatic scroll or edge cases. First measure behavior/performance and add scroll/resize/visibility cases to `tests/smoke/limit-scrolling.spec.ts`; propose event-driven enforcement **only if** behavior is demonstrably preserved.

### BE-07 — P2 — Reconcile manual dev bootloader with catalog coverage
**Status:** candidate · **Change risk:** low (dev tooling).

`scripts/bootloader.js:4-57` hand-maintains entries for six sites while `src/sites/` and `docs/roadmap.md:14-30` cover thirteen. Its only in-repository textual reference is itself; it may still be deliberately invoked manually. Confirm whether this workflow remains used, then either remove it or derive its supported scripts from the validated catalog. Do not create a second host-matching implementation merely to deduplicate a list.

### BE-08 — Needs product decision — “live intensity” contract
**Status:** hypothesis / behavior change, **not approved as a refactor**.

`README.md:104-115` describes intensity changes as live. The Tampermonkey API updates the global in `scripts/adapters/tampermonkey.ts:276-289`, but some effects snapshot intensity at initialization (e.g. `src/common/scroll.ts:13-26`, `src/common/styling.ts:53-73`). Determine which scripts actually support live changes and compare this with the intended contract. Any change in applied effects or reload semantics requires separate approval and browser regression tests; a pure cleanup must preserve current behavior.

## Recommended next action

**Implement BE-01 alone**, with a negative-path build regression test and an independent architecture/type review of the small diff. Then address BE-02 before the next release artifact. Do not merge these tasks with live-intensity or site-behavior changes.

## Verification / safety gates for later implementation

For artifact changes run `bun run build`, `bun run test`, `bun run test:artifact`, and `bunx tsc --noEmit`; compare ZIP contents against the current schema and verify consumption by Ace Engine. For site effects, add targeted Playwright smoke coverage rather than treating compilation as evidence of browser correctness. Keep script IDs and the resistance artifact's directory structure stable; avoid creating shared abstractions across unrelated sites.
