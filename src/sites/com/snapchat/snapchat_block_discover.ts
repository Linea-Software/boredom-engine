/**
 * @id snapchat_block_discover
 * @name Snapchat Block Discover
 * @description Hides Discover/Explore navigation and redirects those recommendation routes to the web client.
 * @version 1.0.0
 */
import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.Medium)) {
    blockInterface({
        id: "snapchat_block_discover",
        selectors: ['a[href*="/discover"]', 'a[href*="/explore"]'],
        redirect: {
            when: (url) =>
                url.pathname.startsWith("/discover") ||
                url.pathname.startsWith("/explore") ||
                url.pathname.startsWith("/web/discover") ||
                url.pathname.startsWith("/web/explore"),
            to: (url) => (url.pathname.startsWith("/web/") ? "/web/" : "/"),
        },
    });
}
