/**
 * @id instagram_block_reels
 * @name Instagram Block Reels
 * @description Blocks Instagram Reels navigation and redirects away from Reels routes.
 * @version 1.1.0
 */

import { blockInterface } from "$common";

{
    blockInterface({
        id: "instagram_block_reels",
        selectors: [
            'a[href="/reels/"]',
            'a[href^="/reels/"]',
            'a[href^="/reels?"]',
        ],
        redirect: {
            when: (url) => url.pathname.startsWith("/reels"),
            to: "https://instagram.com/",
        },
    });
}
