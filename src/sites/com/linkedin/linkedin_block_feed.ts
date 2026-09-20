/**
 * @id linkedin_block_feed
 * @name LinkedIn Block Feed
 * @description Removes LinkedIn's home feed while preserving navigation, search, messaging, and jobs.
 * @version 1.0.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.Medium)) {
    blockInterface({
        id: "linkedin_block_feed",
        activeWhen: (url) => url.pathname === "/" || url.pathname.startsWith("/feed"),
        selectors: [
            '[data-testid="mainFeed"]',
            ".scaffold-finite-scroll__content",
            ".scaffold-layout__main .feed-shared-update-v2",
        ],
    });
}
