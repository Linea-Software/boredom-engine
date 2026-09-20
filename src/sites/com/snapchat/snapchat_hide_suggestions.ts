/**
 * @id snapchat_hide_suggestions
 * @name Snapchat Hide Suggestions
 * @description Hides conservatively identified recommendation modules while preserving direct messaging.
 * @version 1.0.0
 */
import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.Low)) {
    blockInterface({
        id: "snapchat_hide_suggestions",
        selectors: [
            '[role="region"][aria-label*="suggest" i]',
            'aside[aria-label*="suggest" i]',
            '[data-testid*="suggest" i]',
        ],
    });
}
