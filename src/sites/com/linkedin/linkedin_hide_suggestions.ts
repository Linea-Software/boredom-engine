/**
 * @id linkedin_hide_suggestions
 * @name LinkedIn Hide Suggestions
 * @description Hides recommended people, pages, and discovery modules on LinkedIn.
 * @version 1.0.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.Low)) {
    blockInterface({
        id: "linkedin_hide_suggestions",
        selectors: [
            '[data-view-name*="recommend" i]',
            '[data-testid*="recommend" i]',
            '[aria-label*="People you may know" i]',
            '[aria-label*="Suggested" i]',
            ".discover-entity-type-card",
        ],
    });
}
