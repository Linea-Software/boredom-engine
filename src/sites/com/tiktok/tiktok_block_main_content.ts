/**
 * @id tiktok_block_main_content
 * @name TikTok Block Main Content
 * @description Blocks the TikTok For You feed and suppresses media inside it.
 * @version 1.1.0
 */

import { blockInterface } from "$common";

if (
    true &&
    true
) {
    const feedSelectors = [
        '[id^="main-content-homepage_hot"]',
        '[data-e2e="feed-container"]',
        '[data-e2e="recommend-list-item-container"]',
    ];

    blockInterface({
        id: "tiktok_block_main_content",
        selectors: feedSelectors,
        media: {
            containers: feedSelectors,
            mute: true,
            pause: true,
        },
    });
}
