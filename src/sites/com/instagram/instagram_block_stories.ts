/**
 * @id instagram_block_stories
 * @name Instagram Block Stories
 * @description Removes the stories tray from the Instagram feed.
 * @version 1.0.0
 */

import { onDOMLoaded, currentIntensityHigherThan, Intensity, injectCss } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    // Hide stories tray via CSS
    injectCss(`
        /* Target the stories container */
        div[aria-label*="Stories"],
        div[aria-label*="Storie"],
        ._aicw, /* Older/Alternate class for stories tray */
        .zG432 /* Another common class */ {
            display: none !important;
        }

        /* Hide "Stories" section in the feed if it appears as a block */
        div:has(> div[aria-label*="Stories"]),
        div:has(> div[aria-label*="Storie"]) {
            display: none !important;
        }
    `);
});
