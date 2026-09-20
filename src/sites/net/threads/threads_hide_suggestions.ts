/**
 * @id threads_hide_suggestions
 * @name Threads Hide Suggestions
 * @description Hides suggested-account and recommendation modules on Threads.
 * @version 1.0.0
 */
import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.Low)) {
    blockInterface({
        id: "threads_hide_suggestions",
        selectors: [
            'aside[role="complementary"]',
            '[role="region"][aria-label*="suggested" i]',
            '[aria-label*="Suggested for you" i]',
            '[aria-label*="Who to follow" i]',
        ],
    });
}
