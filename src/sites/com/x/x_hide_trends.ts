/**
 * @id x_hide_trends
 * @name X Hide Trends
 * @description Hides trends, What's Happening, and news discovery modules on X.
 * @version 1.0.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.None)) {
    blockInterface({
        id: "x_hide_trends",
        selectors: [
            '[data-testid="trend"]',
            '[data-testid="sidebarColumn"] section:has([data-testid="trend"])',
            '[aria-label*="Timeline: Trending" i]',
            '[data-testid="news_sidebar"]',
            'a[href^="/explore/tabs/"]',
        ],
    });
}
