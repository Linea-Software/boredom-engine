/**
 * @id facebook_block_reels
 * @name Facebook Block Reels
 * @description Hides Facebook Reels surfaces and redirects away from Reels routes.
 * @version 1.1.0
 */

import { blockInterface } from "$common";

{
    blockInterface({
        id: "facebook_block_reels",
        selectors: [
            'a[href^="/reel/"]',
            'a[href^="/reels/"]',
            'a[aria-label*="Reels"]',
            'a[aria-label*="reels"]',
            '[role="tab"][aria-label*="Reel"]',
            '[role="tab"][aria-label*="reel"]',
            '[data-is-reels="true"]',
        ],
        redirect: {
            when: (url) => url.pathname.startsWith("/reel") || url.pathname.startsWith("/reels"),
            to: "https://www.facebook.com/",
        },
    });
}
