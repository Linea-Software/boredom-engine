/**
 * @id instagram_block_explore
 * @name Instagram Block Explore
 * @description Blocks the Instagram Explore page and hides its navigation links.
 * @version 1.1.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.None)) {
    blockInterface({
        id: "instagram_block_explore",
        selectors: [
            'a[href="/explore/"]',
            'a[href^="/explore/"]',
            'a[href^="/explore?"]',
        ],
        redirect: {
            when: (url) => url.pathname.startsWith("/explore"),
            to: "https://instagram.com/",
        },
    });
}
