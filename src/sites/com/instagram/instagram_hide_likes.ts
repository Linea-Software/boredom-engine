/**
 * @id instagram_hide_likes
 * @name Instagram Hide Likes
 * @description Hides like controls, counts, and liked-by sections on Instagram.
 * @version 1.1.0
 */

import { blockInterface } from "$common";

{
    blockInterface({
        id: "instagram_hide_likes",
        selectors: [
            'div[role="button"]:has(svg path[d^="M16.792 3.904"])',
            'div[role="button"]:has(svg path[d^="M16.792 3.904"]) + div[role="button"]',
            'a:has(svg path[d^="M16.792 3.904"])',
            'button:has(svg path[d^="M16.792 3.904"])',
            'section:has(a[href*="/liked_by/"])',
            'a[href*="/liked_by/"]',
            "span.x1rg5ohu.x1qfufaz",
        ],
    });
}
