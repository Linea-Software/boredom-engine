/**
 * @id instagram_block_stories
 * @name Instagram Block Stories
 * @description Removes the stories tray from the Instagram feed.
 * @version 1.0.0
 */

import {
    onDOMLoaded,
    currentIntensityHigherThan,
    Intensity,
    injectCss,
} from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    // Hide stories tray via structural CSS selectors (language-agnostic)
    injectCss(`
        /* Stories section identified by Instagram's structural class */
        section.x6s0dn4.xrvj5dj.x1o61qjw.x12nagc.x1gslohp,
        /* Legacy/alternate class-based selectors */
        ._aicw,
        .zG432 {
            display: none !important;
        }
    `);

    // JavaScript fallback: find the stories section before the first article
    const hideStoriesSection = () => {
        const main =
            document.querySelector("main") ||
            document.querySelector('[role="main"]');
        if (!main) return;

        // The stories tray is the first section in main, before any articles
        const firstSection = main.querySelector("section");
        if (firstSection) {
            // Verify it's the stories section by checking for story-like children
            // (circular profile images or canvas elements for story rings)
            const imgs = firstSection.querySelectorAll('img[alt*="profile"]');
            const canvases = firstSection.querySelectorAll("canvas");
            if (imgs.length >= 2 || canvases.length >= 1) {
                (firstSection as HTMLElement).style.display = "none";
            }
        }
    };

    const observer = new MutationObserver(() => {
        hideStoriesSection();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    hideStoriesSection();
});
