/**
 * @id facebook_hide_reactions
 * @name Facebook Hide Reactions
 * @description Hides Facebook reaction buttons, summaries, and counts.
 * @version 1.1.0
 */

import { blockInterface } from "$common";

{
    blockInterface({
        id: "facebook_hide_reactions",
        selectors: [
            'span[aria-label*="like"]',
            'span[aria-label*="Like"]',
            'span[aria-label*="reactions"]',
            'span[aria-label*="Reactions"]',
            '[aria-label*="reactions on this post"]',
            '[aria-label*="people reacted"]',
            'div[aria-label*="Like"]',
            'div[aria-label*="React"]',
            'span[aria-label*="others"]',
            'span[aria-label*="other people"]',
            'div[data-visualcompletion="ignore-dynamic"]:has(> span[aria-label*="like"])',
            'div[data-visualcompletion="ignore-dynamic"]:has(> span[aria-label*="reaction"])',
        ],
    });
}
