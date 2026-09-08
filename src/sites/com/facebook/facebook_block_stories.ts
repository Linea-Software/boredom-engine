/**
 * @id facebook_block_stories
 * @name Facebook Block Stories
 * @description Hides Facebook Stories surfaces without removing framework-owned nodes.
 * @version 1.1.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.None)) {
    blockInterface({
        id: "facebook_block_stories",
        selectors: [
            '[data-pagelet="story_tray"]',
            'div[aria-label*="Stories"]',
            'div[aria-label*="stories"]',
            'a[aria-label*="Create story"]',
            'a[aria-label*="Your story"]',
            '[role="dialog"][aria-label*="story"]',
        ],
    });
}
