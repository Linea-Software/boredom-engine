# Research References for Website Scripts

Before you change a website-specific action, find existing Chrome extensions and userscripts that perform that action.
Download available source code and study its implementation.
Use the references together with live DOM inspection, documentation, and regression tests.
Do not use reference code as a substitute for these checks.

## Procedure for Each Website-Specific Action

### 1. Define the Expected Behavior

Record the host, pages, and routes that the action must affect.
Include Single-Page Application (SPA) route changes and desktop or mobile variants.
Record the required result for each surface.

For YouTube Shorts, check these surfaces separately:

- Shorts shelves
- Sidebar navigation
- Search results
- Direct visits to `/shorts/`

### 2. Find and Inspect References

Search for Chrome extensions and userscripts that perform the same action on the same website.
Prefer open-source repositories and published source packages.
Download available source code from more than one source when possible.

Inspect these parts:

- `manifest.json`
- Content scripts and injection timing
- Host permissions
- Selectors and CSS rules
- DOM observers and navigation handling
- Documented restrictions or known problems

In the issue, pull request, or research notes, record each source URL.
Record the version or date, license, and technique you studied.

### 3. Treat Downloads as Untrusted

Read downloaded code before you run it.
Do not run copied scripts without inspection.
Do not install unknown extensions in a personal Chrome profile.
Do not grant more permissions than a test needs.
Do not expose browser sessions or private user data.
Use an isolated browser profile for tests.

Respect the license of each reference.
Write original implementation code based on the behavior you studied.
Before you include third-party code, check its license and give the required attribution.

### 4. Verify the Live Website

Inspect the current DOM and CSS.
Check accessibility attributes, dynamic content, player APIs, and navigation.
Do not assume that old selectors still work.
Prefer stable selectors and fallback behavior.
Avoid fragile hashed CSS classes and undocumented APIs where possible.

### 5. Implement and Test

Reuse functions in `src/common`.
Add fixture regression tests for recent page structures.
Include SPA route changes in the test cases.

Run the required commands:

```bash
bun run test
bun run test:smoke
bun run build
```

Run relevant artifact checks.
When you can access the live website, verify the behavior in a browser.

### 6. Report Test Limits

Separate fixture-test results from live browser results.
Record login restrictions and other access problems.
Identify uncertain external API behavior.
Record reference methods that you rejected because they affected too much content.

Do not commit downloaded extension archives, vendor bundles, or third-party script copies for research.
Do not commit account data for research.

## YouTube Research Notes (2026-11-06)

The team downloaded and inspected these references in a temporary, untracked directory:

- [YouTube Hidden Shorts](https://github.com/jeffersongoncalves/youtube-hidden-shorts)
  (Chrome Manifest V3, MIT). The review covered `manifest.json`, `hide-shorts.css`, and `content.js`.
  Useful methods include site-scoped CSS with `:has()`, current guide/grid/card selectors, and `yt-navigate-finish` for YouTube SPA routes.
- [No Shorts](https://github.com/mithatakbulut/noshorts)
  (userscript, MIT). The review covered `noshorts.user.js`.
  Useful methods include bare-domain and subdomain matches, `document-start`, CSS for new elements, and route redirects.

The Boredom Engine implementation uses original code.
It keeps the existing `blockInterface` interface.

The team tested a logged-out YouTube home page in a real Chromium browser.
The new Shorts CSS hid the current mini-guide entry.
Home and Subscriptions remained visible.

The team also observed the player quality API on a real `/watch` page.
This desktop player API is undocumented.
Do not assume that YouTube will keep it stable.
