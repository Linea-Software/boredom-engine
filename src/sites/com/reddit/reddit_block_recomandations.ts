/**
 * @id reddit_block_recomandations
 * @name Reddit Block Recommendations
 * @description Hides Reddit's recommendation feed on the homepage.
 * @version 1.1.0
 */

import { blockInterface } from "$common";

{
    blockInterface({
        id: "reddit_block_recomandations",
        selectors: [
            "#subgrid-container > div:first-child",
            "shreddit-feed",
        ],
        activeWhen: (url) => url.pathname === "/" || url.pathname === "",
    });
}
