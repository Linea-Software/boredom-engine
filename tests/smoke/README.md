# Browser smoke tests (Playwright)

Browser-level smoke tests for the **full resistance-script catalog** (release
plan Step 5.4): mock pages + script injection + DOM-effect assertions. Every
shipped script in `src/sites/` has a fixture and at least one spec:
40 resistance scripts + 7 tracking (`@type usage`) scripts = 47.

## Running

```sh
bun run test:smoke   # from the boredom-engine root
```

Playwright's bundled chromium (revision 1234) must be installed once:

```sh
bunx playwright install chromium
```

The full suite runs in ~20s wall time (fully parallel). Each spec is
deterministic: probabilistic effects are pinned via `stubMathRandom`, and
delays are asserted through their mechanism (DelayNode wiring, pause calls,
buffering state, spinner visibility) instead of waiting them out.

## How it works

- `harness.ts` wraps `src/common/test-utils.ts` (esbuild in-memory bundling +
  `page.addInitScript` injection), sets `window.__BOREDOM_INTENSITY__`, and
  loads mock fixture pages via `file://` navigation.
- `fixtures/<site>/<name>.html` are minimal mock pages mirroring the real
  site's DOM for the elements a script targets (selectors come from the
  script sources).
- `<site>.spec.ts` (one file per site, several tests per file) asserts the
  script's DOM effect on the fixture.

No real network access is needed: fixtures are inlined and script sources are
bundled in memory.

## Harness helpers

| Helper | Purpose |
| --- | --- |
| `setIntensity(page, level)` | Sets `window.__BOREDOM_INTENSITY__` before the script runs. |
| `loadScript(page, srcPath)` | Bundles + injects one script source. |
| `openFixture(page, "site/name.html")` | `file://` navigation to a fixture (init scripts run). |
| `openFixtureAt(page, path, url)` | Serves a fixture over a fake `http://boredom-fixture.test` origin with a controllable path — needed when a script branches on `window.location.pathname`/`href` (e.g. Reddit recommendations only run on `/`, YouTube low-quality on `/watch`). |
| `stubMathRandom(page, value=0)` | Pins `Math.random` so chance rolls (buffering, delays) succeed deterministically. |
| `stubUsageReporting(page)` | Configures the server globals and records `window.fetch` calls — how the tracking scripts are tested. |
| `stubReplaceState(page)` | Recording no-op for `history.replaceState` (throws on `file://`); captcha URL-spoofing is asserted from the recorded calls. |
| `stubAudioContext(page)` | Fake `AudioContext` recording DelayNode wiring for audio-delay scripts. |

## Spec conventions

- Each spec follows the `youtube-grayscale.spec.ts` pattern:
  `setIntensity` → `loadScript` → `openFixture` → assert.
- Intensity is chosen per script's gate: blocks/hides/grayscale run at
  `> None` (tested at `high` for the strongest effect), random captchas at
  `> Medium` (`high`), Reddit video delay at `> Low` (`medium`), TikTok
  main-content/sidebar scripts skip `Low` (`medium`).
- Effects applied asynchronously (CSS injection, intervals, MutationObservers,
  captcha timeouts) are asserted with `expect.poll(...)` / auto-retrying
  matchers (`toBeHidden`, `toHaveCount(0)`) with generous timeouts.
- Delay scripts (audio delay, video buffer delays) assert the **delay
  mechanism** — DelayNode delayTime, recorded `pause()` calls, buffering
  dataset flag, spinner visibility — never the elapsed delay.
- Every test asserts a negative control (an element the script must NOT
  touch) where practical.

## Coverage table

| Script | Fixture | Assertion (core DOM effect) | Intensity |
| --- | --- | --- | --- |
| youtube_grayscale | youtube/grayscale.html | img filter `saturate(0.2)` | high |
| youtube_audio_delay | youtube/audio-delay.html | DelayNode wired, delayTime=3s | high |
| youtube_low_quality | youtube/watch/low-quality.html | player quality forced to `small` | high |
| youtube_limit_scrolling | _shared/tall-page.html | scroll clamped, page overflow hidden | high |
| youtube_random_captcha | youtube/random-captcha.html | captcha overlay + URL spoof to /recaptcha | high |
| youtube_shorts_remove | youtube/remove-shorts.html | shorts elements hidden/removed | high |
| youtube_shorts_remove (redirect) | youtube/remove-shorts.html | /shorts URL redirected to youtube.com | high |
| youtube_video_buffer_delay | youtube/video-buffer-delay.html | buffering flag + spinner + pause | high |
| instagram_block_explore | instagram/block-explore.html | explore link hidden | high |
| instagram_block_explore (redirect) | instagram/block-explore.html | /explore URL redirected to instagram.com | high |
| instagram_block_reels | instagram/block-reels.html | reels link hidden | high |
| instagram_block_reels (redirect) | instagram/block-reels.html | /reels URL redirected to instagram.com | high |
| instagram_block_stories | instagram/block-stories.html | stories tray hidden, feed kept | high |
| instagram_block_suggestions | instagram/block-suggestions.html | posts after separator hidden | high |
| instagram_grayscale | instagram/grayscale.html | img `saturate(0.2)` + `--ig-badge` gray | high |
| instagram_hide_comments | instagram/hide-comments.html | comment button/count + list hidden | high |
| instagram_hide_likes | instagram/hide-likes.html | like button/count + liked-by hidden | high |
| instagram_random_captcha | instagram/random-captcha.html | captcha overlay + URL spoof to /security/captcha | high |
| facebook_block_feed | facebook/block-feed.html | feed/suggested hidden + feed fetch 404 | high |
| facebook_block_reels | facebook/block-reels.html | reels links hidden | high |
| facebook_block_reels (redirect) | facebook/block-reels.html | reels URL redirected to facebook.com | high |
| facebook_block_sidebar | facebook/block-sidebar.html | sidebars hidden, main menu kept | high |
| facebook_block_stories | facebook/block-stories.html | stories tray hidden, feed kept | high |
| facebook_grayscale | facebook/grayscale.html | img `saturate(0.2)` | high |
| facebook_hide_comments | facebook/hide-comments.html | comment article hidden, post kept | high |
| facebook_hide_reactions | facebook/hide-reactions.html | reaction counts hidden | high |
| facebook_limit_scrolling | _shared/tall-page.html | scroll clamped, page overflow hidden | high |
| facebook_random_captcha | facebook/random-captcha.html | captcha overlay + URL spoof | high |
| reddit_block_recomandations | reddit/block-recommendations.html | recommendation column hidden (served at `/`) | high |
| reddit_grayscale | reddit/grayscale.html | img `saturate(0.2)` + brand vars gray | high |
| reddit_limit_scrolling | _shared/tall-page.html | scroll clamped, page overflow hidden | high |
| reddit_random_captcha | reddit/random-captcha.html | captcha overlay | high |
| reddit_video_delay | reddit/video-delay.html | video pause recorded (buffering roll) | medium |
| tiktok_block_main_content | tiktok/block-main-content.html | FYP container hidden, video muted | medium |
| tiktok_desaturate | tiktok/desaturate.html | img `saturate(0.2)` + UI vars gray | high |
| tiktok_downgrade_media_quality | tiktok/downgrade-media-quality.html | canvas overlay, video opacity 0, img pixelated | medium |
| tiktok_remove_sidebar_buttons | tiktok/remove-sidebar-buttons.html | more/explore/live nav hidden | medium |
| tiktok_video_delay | tiktok/video-delay.html | spinner shown + video pause recorded | medium |
| twitch_grayscale | twitch/grayscale.html | img `saturate(0.2)` + brand vars gray | high |
| twitch_media_quality | twitch/media-quality.html | canvas overlay, video opacity 0, img pixelated | medium |
| twitch_random_captcha | twitch/random-captcha.html | captcha overlay | high |
| twitch_remove_featured_carousel | twitch/remove-featured-carousel.html | carousel removed from DOM | high |
| twitch_remove_sidebar | twitch/remove-sidebar.html | sidebar nav hidden | high |
| twitch_video_delay | twitch/video-delay.html | video pause recorded (buffering roll) | medium |
| youtube_usage_stats (tracking) | _shared/blank.html | `POST /report/usage` with `type:"opened"` | medium |
| instagram_usage_stats (tracking) | _shared/blank.html | `POST /report/usage` with `type:"opened"` | medium |
| facebook_usage_stats (tracking) | _shared/blank.html | `POST /report/usage` with `type:"opened"` | medium |
| reddit_usage_stats (tracking) | _shared/blank.html | `POST /report/usage` with `type:"opened"` | medium |
| twitch_usage_stats (tracking) | _shared/blank.html | `POST /report/usage` with `type:"opened"` | medium |
| generic_usage_stats (tracking) | _shared/blank.html | `POST /report/usage` | medium |
| generic_dominant_color (tracking) | generic/dominant-color.html | `POST /report/theme` with hex color | — |

## Notes & limitations

- **Tracking scripts** (`@type usage`) have no DOM effect; their only
  observable behaviour is the report POST to the local boredom server. The
  harness stubs `window.fetch` and asserts the report payload (see
  `usage-stats.spec.ts`). The generic dominant-color script additionally
  needs a readable image, so its fixture paints a canvas-drawn data: PNG.
- **Pathname-dependent branches** that a Windows `file://` URL can never
  reach are covered over the fake http origin (`openFixtureAt`): Reddit
  recommendations (`/`), YouTube `/watch` quality (fixture under
  `youtube/watch/`), and the redirect-away branches of youtube shorts /
  instagram explore+reels / facebook reels.
- **Facebook grayscale's player-page branch** (`/watch`, `/reel`, `/videos/`
  pathname prefixes) is not exercised: on `file://` the pathname never
  matches, and the primary desaturation effect is covered.
- **Captcha URL spoofing** uses `history.replaceState`, which throws a
  SecurityError on `file://` pages; `stubReplaceState` records the calls so
  the spoofing logic is still asserted.
- A fixture filename may not contain `/shorts` (the shorts-remove script
  redirects any URL whose path contains it), hence
  `youtube/remove-shorts.html`.
