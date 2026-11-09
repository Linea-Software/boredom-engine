/**
 * @id pinterest_block_home_feed
 * @name Pinterest Block Home Feed
 * @description Hides Pinterest's algorithmic home and discovery feeds while leaving direct search, boards, and pins usable.
 * @version 1.0.0
 */

import { blockInterface } from "$common";

{
    blockInterface({
        id: "pinterest_block_home_feed",
        activeWhen: (url) =>
            url.pathname === "/" ||
            url.pathname.startsWith("/ideas/") ||
            url.pathname.startsWith("/today"),
        selectors: [
            '[data-test-id="homefeed"]',
            '[data-test-id="pinGrid"]',
            '[data-test-id="search-guide-feed"]',
        ],
    });
}
