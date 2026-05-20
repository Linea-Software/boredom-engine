/**
 * @id facebook_block_reels
 * @name Facebook Block Reels
 * @description Blocks Facebook Reels (short-form video) by hiding navigation and redirecting away.
 * @version 1.0.0
 */
import { onDOMLoaded, currentIntensityHigherThan, Intensity, injectCss } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    const checkPath = () => {
        if (
            window.location.pathname.startsWith("/reel") ||
            window.location.pathname.includes("/reels")
        ) {
            window.location.replace("https://www.facebook.com");
        }
    };

    // Hide Reels navigation links via CSS
    injectCss(`
        a[href*="/reel/"],
        a[href="/reel/"],
        a[aria-label*="Reels"],
        a[aria-label*="reels"] {
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
