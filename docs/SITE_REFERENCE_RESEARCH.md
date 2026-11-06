# Reference-first research for site scripts

Boredom Engine development should **download and study existing Chrome
extensions and userscripts as references** for how to perform each particular
action on each particular website. This complements live DOM inspection,
documentation and regression tests; it does not replace them.

## Workflow for every site-specific action

1. **Specify the behavior and surfaces.** Record the affected host, pages,
   routes (including SPA navigation), desktop/mobile variants, and the expected
   result. For example: hiding YouTube Shorts shelves, sidebar navigation,
   search results and direct `/shorts/` visits are distinct surfaces.
2. **Find and download existing solutions.** Search for reputable Chrome
   extensions and userscripts that implement the *same action on the same
   website*. Prefer open-source repositories or published source packages.
   Inspect the extension's `manifest.json`, content scripts, injection
   timing, host permissions, selectors, CSS rules, observers, navigation
   handling and any documented limitations. Compare multiple sources where
   possible. Record a source URL, version/date, license, and the specific
   technique being studied in the issue/PR or research notes.
3. **Treat downloaded code as untrusted.** Read it before running it. Never
   blindly execute copied scripts, install unknown extensions into a personal
   Chrome profile, grant permissions beyond what a test needs, or expose
   private browser/session data. Use an isolated browser profile for testing.
   Respect licenses: learn from designs, but write original implementation
   code; attribute and check licensing before including third-party code.
4. **Verify against the live site.** Inspect actual DOM structure, CSS,
   accessibility attributes, dynamic rendering, player APIs and navigation
   behavior. Do not assume an extension's selectors still work. Prefer
   resilient selectors and progressively enhanced fallbacks over brittle
   hashed CSS classes or undocumented APIs.
5. **Implement and test.** Reuse utilities in `src/common`, add fixture
   regressions covering recent page structures and SPA transitions, and run
   `bun run test`, `bun run test:smoke`, `bun run build` and relevant
   artifact checks. Browser-verify on the actual site when accessible.
6. **Report limitations.** Distinguish fixture-test passes from a verified
   live browser run. Note access/login restrictions, uncertain external API
   behavior, and any reference approach rejected as too invasive.

Do not commit downloaded extension archives, vendor bundles, copies of
third-party scripts, or account data merely to document research.

## YouTube: research notes (2026-11-06)

Downloaded and reviewed source in a temporary, untracked directory:

- [YouTube Hidden Shorts](https://github.com/jeffersongoncalves/youtube-hidden-shorts)
  (Chrome Manifest V3, MIT): inspected `manifest.json`,
  `hide-shorts.css` and `content.js`. Relevant ideas: site-scoped CSS
  using `:has()`, modern guide/grid/card selectors, and
  `yt-navigate-finish` for YouTube SPA navigation.
- [No Shorts](https://github.com/mithatakbulut/noshorts)
  (userscript, MIT): inspected `noshorts.user.js`. Relevant ideas:
  both bare and subdomain host matches, `document-start`, CSS
  matching newly inserted items and route redirects.

Implementation in Boredom Engine is original and keeps the existing
`blockInterface` abstraction. Against a logged-out real YouTube home
page in Chromium, the new Shorts CSS hides the modern mini-guide entry
without hiding Home or Subscriptions. The player quality API was also
observed on a real `/watch` page; that observation is not a guarantee
that YouTube will keep this undocumented desktop player API stable.
