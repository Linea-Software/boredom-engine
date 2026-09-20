/**
 * @id x_hide_suggestions
 * @name X Hide Suggestions
 * @description Hides Who to Follow and other account recommendation modules on X.
 * @version 1.0.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.Low)) {
    blockInterface({
        id: "x_hide_suggestions",
        selectors: [
            '[data-testid="sidebarColumn"] [data-testid="UserCell"]',
            '[data-testid="sidebarColumn"] aside[role="complementary"]',
            'main aside[role="complementary"]:has([data-testid="UserCell"])',
            '[aria-label*="Who to follow" i]',
        ],
    });
}
