/**
 * @id facebook_block_feed
 * @name Facebook Block Feed
 * @description Blocks the main News Feed to prevent addictive infinite scrolling. Removes feed content
 * and blocks feed-related network requests.
 * @version 1.0.0
 */
import { onDOMLoaded, currentIntensityHigherThan, Intensity, injectCss, blockNetworkRequests } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    // Hide the main feed area via CSS
    injectCss(`
        /* Target the main feed using role attribute */
        [role="feed"] {
            display: none !important;
        }

        /* Target "News Feed" labeled sections */
        section[aria-label*="News Feed"],
        div[aria-label*="News Feed"],
        div[aria-label*="Feed"] {
            display: none !important;
        }

        /* Suggested posts / sponsored content */
        div[aria-label*="Suggested"],
        div[aria-label*="Sponsored"] {
            display: none !important;
        }
    `);

    // Block network requests to feed and recommendation endpoints
    const feedPatterns = [
        "/api/graphql/",
        "graphql?doc_id=",
        "feed.php",
        "home.php",
    ];

    const originalFetch = window.fetch;
    window.fetch = Object.assign(
        async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
            for (const pattern of feedPatterns) {
                if (url.includes(pattern)) {
                    return new Response("", { status: 404, statusText: "Not Found" });
                }
            }
            return originalFetch(input, init);
        },
        originalFetch,
    );

    // Periodically remove feed elements that might be dynamically injected
    setInterval(() => {
        const feed = document.querySelector('[role="feed"]');
        if (feed) {
            (feed as HTMLElement).style.display = "none";
        }

        // Hide any sections with feed-related labels
        const sections = document.querySelectorAll('section, div');
        sections.forEach(el => {
            const label = el.getAttribute('aria-label') || '';
            if (
                label.includes('News Feed') ||
                label.includes('Feed') ||
                label.includes('Suggested') ||
                label.includes('Sponsored')
            ) {
                (el as HTMLElement).style.display = 'none';
            }
        });
    }, 2000);
});
