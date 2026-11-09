/**
 * @id youtube_shorts_remove
 * @name YouTube Shorts Remove
 * @description Hides YouTube Shorts surfaces and redirects away from Shorts routes.
 * @version 1.2.0
 */
import { blockInterface } from "$common";

const shortsEnabled = () => true;
const isShortsRoute = (url: URL) =>
    url.pathname === "/shorts" || url.pathname.startsWith("/shorts/");

// CSS applies to late-arriving YouTube Polymer/SPA nodes as well as initial DOM.
// Target whole cards/guide entries, not just their links (which leave blank gaps).
blockInterface({
    id: "youtube_shorts_remove",
    activeWhen: shortsEnabled,
    selectors: [
        "#shorts-inner-container",
        "#player-shorts-container",
        "[is-shorts]",
        ".ytd-shorts",
        "ytd-shorts",
        'a.yt-simple-endpoint[title="Shorts"]',
        'ytd-guide-entry-renderer:has(a[href^="/shorts"])',
        'ytd-mini-guide-entry-renderer:has(a[href^="/shorts"])',
        'ytd-guide-collapsible-entry-renderer:has(a[href^="/shorts"])',
        'div#items > *:has(a[title="Shorts"])',
        'div#items > *:has(yt-formatted-string.title[title="Shorts"])',
        'yt-chip-cloud-chip-renderer:has(yt-formatted-string[title="Shorts"])',
        'yt-tab-shape[tab-title="Shorts"]',
        'tp-yt-paper-tab:has(a[href*="/shorts"])',
        'ytd-compact-video-renderer:has(a[href*="/shorts/"])',
        'ytd-notification-renderer:has(> a[href^="/shorts/"])',
        "ytd-reel-shelf-renderer",
        "ytd-rich-grid-renderer[is-shorts-grid]",
        'grid-shelf-view-model:has(a[href^="/shorts/"])',
        'ytd-rich-item-renderer:has(a[href*="/shorts/"])',
        'ytd-video-renderer:has(a[href*="/shorts/"])',
        'ytd-grid-video-renderer:has(a[href*="/shorts/"])',
        'yt-lockup-view-model:has(a[href*="/shorts/"])',
        'ytm-video-with-context-renderer:has(a[href*="/shorts/"])',
        'ytm-compact-video-renderer:has(a[href*="/shorts/"])',
        "ytd-rich-shelf-renderer[is-shorts]",
        "ytm-reel-shelf-renderer",
        "ytm-shorts-lockup-view-model",
        "ytm-shorts-lockup-view-model-v2",
        'ytm-pivot-bar-renderer > ytm-pivot-bar-item-renderer:has(.pivot-shorts)',
    ],
    redirect: {
        when: (url) => shortsEnabled() && isShortsRoute(url),
        // Keep the current host (www/music/mobile) instead of hopping to bare
        // youtube.com and causing another navigation/cookie-domain transition.
        to: (url) => new URL("/", url).href,
    },
});

// YouTube dispatches its own navigation event on Polymer SPA transitions.
// It does not always change routes through history methods exposed to us.
window.addEventListener("yt-navigate-finish", () => {
    if (shortsEnabled() && isShortsRoute(new URL(location.href))) {
        location.replace(new URL("/", location.href).href);
    }
});
