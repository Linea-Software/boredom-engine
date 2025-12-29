/**
 * @name YouTube Shorts Remove
 * @description Removes the Shorts section from the YouTube homepage.
 * @version 1.0.0
 */

import { onMount, injectCss } from "$common";

onMount(() => {
    injectCss(`
        [is-shorts],
        ytd-mini-guide-renderer #items ytd-mini-guide-entry-renderer:nth-child(2) {
            display: none !important;
        }
    `);

    // use an observer to remove #shorts-inner-container
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                const shortsContainer = document.getElementById(
                    "shorts-inner-container"
                );
                if (shortsContainer) {
                    shortsContainer.remove();
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // remove the container if it exists
    const shortsContainer = document.getElementById("shorts-inner-container");
    if (shortsContainer) {
        shortsContainer.remove();
    }
});
