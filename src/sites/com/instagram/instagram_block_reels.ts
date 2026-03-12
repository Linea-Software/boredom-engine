/**
 * @id instagram_block_reels
 * @name Instagram Block Reels
 * @description Blocks Instagram reels elements and fetch requests on the reels page.
 * @version 1.0.0
 */
import { onDOMLoaded, blockNetworkRequests, currentIntensityHigherThan, Intensity, injectCss } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    const checkPath = () => {
        if (
            window.location.pathname.startsWith("/reels") ||
            window.location.pathname.includes("/reels/")
        ) {
            window.location.replace("https://instagram.com");
        }
    };

    // Hide Reels icons/links via CSS
    injectCss(`
        a[href*="/reels/"] {
            display: none !important;
        }
    `);

    // Monitor for navigation and dynamic elements
    const observer = new MutationObserver(() => {
        checkPath();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Initial check
    checkPath();
});
