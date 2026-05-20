/**
 * @id facebook_block_stories
 * @name Facebook Block Stories
 * @description Removes the Stories tray from Facebook to reduce the "fear of missing out" loop.
 * @version 1.0.0
 */
import { onDOMLoaded, currentIntensityHigherThan, Intensity, injectCss } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    // Hide stories tray via CSS - broad selectors that work with Facebook's UI
    injectCss(`
        /* Target the stories container using aria labels */
        div[aria-label*="Stories"],
        div[aria-label*="Storie"],
        div[aria-label*="stories"],

        /* Parent containers that hold stories */
        div:has(> div[aria-label*="Stories"]),
        div:has(> div[aria-label*="Storie"]),
        div:has(> div[aria-label*="stories"]),

        /* Story creation button/link */
        a[aria-label*="Create story"],
        a[aria-label*="Crea una storia"],
        a[aria-label*="Your story"],
        a[aria-label*="La tua storia"],

        /* Story viewer elements */
        [role="dialog"][aria-label*="story"],
        [role="dialog"][aria-label*="storia"] {
            display: none !important;
        }
    `);

    // Also watch for dynamically injected stories
    const observer = new MutationObserver(() => {
        const storyContainers = document.querySelectorAll(
            'div[aria-label*="Stories"], div[aria-label*="Storie"], div[aria-label*="stories"]'
        );
        storyContainers.forEach(el => {
            (el as HTMLElement).style.display = "none";
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
});
