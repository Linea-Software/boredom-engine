/**
 * @id linkedin_hide_news
 * @name LinkedIn Hide News
 * @description Hides LinkedIn News and trending-news modules.
 * @version 1.0.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.None)) {
    blockInterface({
        id: "linkedin_hide_news",
        selectors: [
            '[data-view-name="news-module"]',
            '[data-testid*="news" i]',
            'aside > *:has(a[href*="/news/"])',
            'section:has(a[href*="/news/"])',
            ".news-module",
        ],
    });
}
