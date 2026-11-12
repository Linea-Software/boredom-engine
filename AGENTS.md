# Agent Instructions

## Project Purpose

Boredom Engine contains scripts for specific websites.
These scripts make distracting websites less attractive or harder to use.
The main targets are social-media websites.

## Project Structure

- `/scripts`: Build and utility scripts. The build script makes bundles for Tampermonkey and direct injection.
- `/src`: Source code for the interventions.
- `/src/common`: Functions and utilities shared by different websites.
- `/src/sites`: Website-specific scripts. Directories use reverse-domain names, such as `com.youtube` and `com.instagram`.

## Setup and Package Manager

Use **Bun** as the package manager and runtime.
Do not use `npm`, `pnpm`, or `yarn` in this repository.

| Task | Command |
| --- | --- |
| Install dependencies | `bun install` |
| Build the project | `bun run build` |
| Add a package | `bun add <package>` |

## ACE Blocker Production Runtime

**ACE Engine MITM direct injection** is the main production consumer.
Tampermonkey is not the production injection method.

`bun run build` makes browser IIFE bundles in `dist/normal/`.
The command also makes `dist/scripts-data.json`.
`bun run deploy` makes `resistance-scripts.zip`.
ACE downloads this ZIP after a new release is published and imported.

ACE inserts inline scripts with a nonce into top-level HTML documents.
ACE inserts only interventions that are enabled for the matching website.
Each intervention has a separate enabled state.
There is no global severity level.
The catalog disables visual effects and interruptions by default.

Do not depend on a Tampermonkey bootstrap in production code.
Do not depend on Tampermonkey `@require` or its per-page control API.

For optional tests on real public websites, run `bun run test:live --help`.
Read `docs/LIVE_SITE_TESTING.md`. Do not report a missing live DOM target as a pass.
Do not make the live runner a required CI test. It does not test the installed ACE proxy.

Run these tests:

- `bun run test:smoke --grep "ACE direct injection"`
- `bun run test:artifact`

These tests do not prove that an installed proxy works with a new content version.
Do an end-to-end test with the installed proxy and the new content version.
A source push does not deploy scripts to ACE clients.

## Tampermonkey Development

Tampermonkey is an **optional test adapter**.

Run `bun run build` to make `dist/tampermonkey/`.
Tampermonkey caches `@require` files when a userscript is installed or updated.
After each build, import or install the generated `boredom-engine.user.js` again.
A website reload alone does not load the new files.

For Chrome, enable **Allow User Scripts** for Tampermonkey.
Follow the instructions in the README.

The Boredom Engine menu uses Lit.
Open the menu with the Floating Action Button (FAB) on a supported website.

## Development Rules

- Keep source files, functions, and classes small.
- Divide complex work into small tasks.
- Use one focused function or class for each responsibility.
- Design types so that invalid states cannot be represented.
- Commit each change with Git.
- Use Conventional Commits.
- Start commit messages with a type such as `feat:`, `fix:`, `chore:`, or `refactor:`.

## Research Existing Website Scripts First

Before each website-specific change, find existing extensions or userscripts for the same action and website.
Download and study their available source code.
Include repairs of existing scripts in this research.

Check manifests, selectors, injection timing, and SPA navigation.
Follow `docs/SITE_REFERENCE_RESEARCH.md`.
Treat all downloaded code as untrusted.
Use a separate browser profile for tests.
Check licenses before you reuse third-party material.
Verify selectors against the current live DOM.
Do not copy reference code without review.

## Inspect New Websites

Inspect a new website in the browser **before** you write code.

1. Open the target website with `new_page` or `navigate_page`.
2. Use `take_snapshot` and `evaluate_script` to inspect the live DOM.
3. Identify CSS selectors and content containers.
4. Determine whether the website loads content statically or dynamically.
5. Identify feeds, video players, and sidebars.
6. Record relevant classes and attributes.
7. Use `list_network_requests` to inspect feeds, recommendations, and advertisements.
8. Check scrolling, route changes, and dynamically added content.
9. Compare reusable patterns in `com.instagram`, `com.youtube`, and other existing site scripts.

Use observed website behavior where possible.
Do not assume that an unverified selector works.

## Websites That Require an Account

Some websites require login for their main content.
Examples include Facebook, LinkedIn, and X/Twitter.
Do not assume that account credentials are available.

### 1. Inspect Public Content

Inspect all relevant pages that are available without login:

- Landing pages, login pages, and signup pages
- Public profiles, pages, and groups
- Shared posts and embedded videos
- Headers, footers, search, and other public navigation

These parts can use DOM patterns that also occur after login.
Do not report a logged-in feature as verified when you cannot access it.

### 2. Compare Similar Websites

Use patterns from an implemented website when the pattern is applicable.

- Facebook and Instagram can share feed, story, reel, sidebar, and notification patterns.
- X/Twitter, Reddit, and TikTok can share timeline, trending, and infinite-scroll patterns.
- LinkedIn and Facebook can share feed and sidebar patterns.

Verify each adapted selector on the target website when access is possible.

### 3. Inspect APIs and Network Requests

Use `list_network_requests` to inspect:

- Endpoints for feeds, recommendations, and notifications
- GraphQL and REST request patterns
- Request headers and response structures relevant to `blockNetworkRequests`

Do not disclose credentials or private session data.

### 4. Consult Public Documentation

Read relevant public developer documentation.
Check open-source UI libraries when they help explain the page structure.
Facebook's React and LinkedIn's Ember are examples.
Use documentation to understand components and CSS conventions.

### 5. Make Limited Inferences

Use verified public pages and known patterns from similar websites.
Use common DOM structures when direct verification is not possible.
Mark unverified behavior as an assumption.
A developer can test logged-in behavior later.

### 6. Use Stable Selectors

If a precise selector cannot be verified, consider a broader, stable selector.
Examples are `[role="feed"]`, `[data-testid]`, and ARIA labels.
Prefer selectors that are less sensitive to website updates.
Check that a broad selector does not change unrelated website functions.

## Local Library Documentation

For Lit or lit-html work, read the local documentation in `docs/lit/`.
It describes components, templates, data handling, and APIs.
Treat this directory as reference material.
