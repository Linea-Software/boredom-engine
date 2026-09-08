/**
 * @id youtube_shorts_remove
 * @name YouTube Shorts Remove
 * @description Hides YouTube Shorts surfaces and redirects away from Shorts routes.
 * @version 1.1.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.None)) {
    blockInterface({
        id: "youtube_shorts_remove",
        selectors: [
            "#shorts-inner-container",
            "#player-shorts-container",
            "[is-shorts]",
            ".ytd-shorts",
            '.yt-simple-endpoint[title="Shorts"]',
            'div#items > *:has(a[title="Shorts"])',
            'div#items > *:has(yt-formatted-string.title[title="Shorts"])',
            'yt-chip-cloud-chip-renderer:has(yt-formatted-string[title="Shorts"])',
            'yt-tab-shape[tab-title="Shorts"]',
            'ytd-compact-video-renderer:has(a[href*="/shorts/"])',
            'ytd-notification-renderer:has(> a[href^="/shorts/"])',
            "ytd-reel-shelf-renderer",
            "ytd-rich-grid-renderer[is-shorts-grid]",
            'ytd-rich-item-renderer:has(a[href*="/shorts/"])',
            "ytd-rich-shelf-renderer[is-shorts]",
            'ytd-video-renderer:has(a[href*="/shorts/"])',
            'ytm-pivot-bar-renderer > ytm-pivot-bar-item-renderer:has(.pivot-shorts)',
            "ytm-reel-shelf-renderer",
        ],
        redirect: {
            when: (url) => url.pathname.startsWith("/shorts"),
            to: "https://youtube.com/",
        },
    });
}
