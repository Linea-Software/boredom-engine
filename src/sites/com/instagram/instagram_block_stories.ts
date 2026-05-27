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

    // Block navigation to story pages
    const checkPath = () => {
        if (window.location.pathname.startsWith("/stories")) {
            window.location.replace("https://instagram.com");
        }
    };

    checkPath();

    // JavaScript fallback: find stories container by story-specific traits.
    // Stories are in a UL/div with canvas elements (story rings) and no article descendants.
    const hideStoriesSection = () => {
        // Find elements that contain story items (canvas-drawn rings + listitems)
        const storyLists = document.querySelectorAll("ul, div[role='list']");
        storyLists.forEach((list) => {
            const canvases = list.querySelectorAll("canvas");
            const articles = list.querySelectorAll("article");
            const listItems = list.querySelectorAll("li, [role='listitem']");
            // Story tray: has canvas (story rings), list items (stories), and no feed articles
            if (
                canvases.length >= 1 &&
                articles.length === 0 &&
                listItems.length >= 2
            ) {
                (list as HTMLElement).style.setProperty(
                    "display",
                    "none",
                    "important",
                );
            }
        });
    };

    const observer = new MutationObserver(() => {
        checkPath();
        hideStoriesSection();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    hideStoriesSection();
});
