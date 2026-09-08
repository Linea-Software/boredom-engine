/**
 * @id instagram_hide_comments
 * @name Instagram Hide Comments
 * @description Hides comment controls and comment lists on Instagram.
 * @version 1.1.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.None)) {
    blockInterface({
        id: "instagram_hide_comments",
        selectors: [
            'div[role="button"]:has(svg path[d^="M20.656 17.008"])',
            'div[role="button"]:has(svg path[d^="M20.656 17.008"]) + div[role="button"]',
            'a:has(svg path[d^="M20.656 17.008"])',
            'button:has(svg path[d^="M20.656 17.008"])',
            "ul._ab8d._ab8e",
            "ul._a9z6",
        ],
    });
}
