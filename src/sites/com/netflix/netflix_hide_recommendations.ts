/**
 * @id netflix_hide_recommendations
 * @name Netflix Hide Recommendations
 * @description Hides explicit recommendation modules while leaving Netflix's core title browsing surfaces intact.
 * @version 1.0.0
 */
import { blockInterface } from "$common";

{
    blockInterface({
        id: "netflix_hide_recommendations",
        selectors: [
            ".moreLikeThis--container",
            '[data-uia*="recommendation" i]',
            '[data-uia*="more-like-this" i]',
            'section[aria-label*="More Like This" i]',
        ],
    });
}
