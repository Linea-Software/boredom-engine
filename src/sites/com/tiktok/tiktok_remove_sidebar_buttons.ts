/**
 * @id tiktok_remove_sidebar_buttons
 * @name TikTok Remove Sidebar Buttons
 * @description Hides distracting TikTok Explore, LIVE, and More sidebar entries.
 * @version 1.1.0
 */

import {
    blockInterface,
    currentIntensityHigherThan,
    getIntensity,
    Intensity,
} from "$common";

if (
    currentIntensityHigherThan(Intensity.None) &&
    getIntensity() !== Intensity.Low
) {
    blockInterface({
        id: "tiktok_remove_sidebar_buttons",
        selectors: [
            '[data-e2e="nav-explore"]',
            'a[href="/explore"]',
            'a[href^="/explore?"]',
            '[data-e2e="nav-live"]',
            'a[href="/live"]',
            'a[href^="/live/"]',
            'a[href^="/live?"]',
            '[data-e2e="nav-more"]',
            '[data-e2e="more-menu"]',
            '[class*="DivMoreContainer"]',
            '#app > div:nth-child(2) > div > div > div:nth-child(3) > div:first-child > div:nth-child(3)',
            '#app > div:nth-child(2) > div > div > div:nth-child(3) > div:first-child > h2:nth-of-type(2)',
            '#app > div:nth-child(2) > div > div > div:nth-child(3) > div:first-child > h2:nth-of-type(5)',
        ],
    });
}
