/**
 * @id twitch_remove_featured_carousel
 * @name Twitch Remove Featured Carousel
 * @description Hides the Twitch featured carousel and suppresses its media without detaching app-owned DOM.
 * @version 1.3.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.None)) {
    const carouselSelectors = [
        '[data-a-target="front-page-carousel"]',
        ".front-page-carousel",
    ];

    blockInterface({
        id: "twitch_remove_featured_carousel",
        selectors: carouselSelectors,
        media: {
            containers: carouselSelectors,
            mute: true,
            pause: true,
        },
    });
}
