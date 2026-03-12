/**
 * @id instagram_block_explore
 * @name Instagram Block Explore
 * @description Blocks the Instagram Explore page and hides its navigation links.
 * @version 1.0.0
 */

import { onDOMLoaded, currentIntensityHigherThan, Intensity, injectCss } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    const checkPath = () => {
        if (
            window.location.pathname.startsWith("/explore")
        ) {
            window.location.replace("https://instagram.com");
        }
    };

    // Hide Explore icons/links via CSS
    injectCss(`
        a[href="/explore/"], 
        a[href*="/explore/"] {
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
