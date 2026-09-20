/**
 * @id pinterest_block_related_pins
 * @name Pinterest Block Related Pins
 * @description Hides related-pin and More Like This modules beneath explicitly opened pins.
 * @version 1.0.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.Low)) {
    blockInterface({
        id: "pinterest_block_related_pins",
        selectors: [
            '[data-test-id="related-pins"]',
            '[data-test-id="relatedPins"]',
            '[data-test-id="more-like-this"]',
            '[aria-label*="More like this" i]',
        ],
    });
}
