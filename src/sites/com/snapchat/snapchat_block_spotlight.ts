/**
 * @id snapchat_block_spotlight
 * @name Snapchat Block Spotlight
 * @description Hides Spotlight navigation and redirects Spotlight routes back to the web client.
 * @version 1.0.0
 */
import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.Medium)) {
    blockInterface({
        id: "snapchat_block_spotlight",
        selectors: ['a[href*="/spotlight"]'],
        redirect: {
            when: (url) =>
                url.pathname.startsWith("/spotlight") || url.pathname.startsWith("/web/spotlight"),
            to: (url) => (url.pathname.startsWith("/web/") ? "/web/" : "/"),
        },
    });
}
