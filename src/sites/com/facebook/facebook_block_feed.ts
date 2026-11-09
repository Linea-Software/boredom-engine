/**
 * @id facebook_block_feed
 * @name Facebook Block Feed
 * @description Blocks the main News Feed and feed-related requests.
 * @version 1.1.0
 */

import { blockInterface } from "$common";

{
    blockInterface({
        id: "facebook_block_feed",
        selectors: [
            '[role="feed"]',
            "div.x1hc1fzr.x1unhpq9.x6o7n8i",
            'section[aria-label*="News Feed"]',
            'div[aria-label*="News Feed"]',
            'div[aria-label*="Suggested"]',
            'div[aria-label*="Sponsored"]',
        ],
    });

    const blockedPatterns = ["/api/graphql/", "graphql?doc_id=", "feed.php", "home.php"];
    const originalFetch = window.fetch;
    window.fetch = Object.assign(
        async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
            if (blockedPatterns.some((pattern) => url.includes(pattern))) {
                return new Response("", { status: 404, statusText: "Not Found" });
            }
            return originalFetch(input, init);
        },
        originalFetch,
    );
}
