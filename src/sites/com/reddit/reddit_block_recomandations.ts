/**
 * @id reddit_block_recomandations
 * @name Reddit Block Recommendations
 * @description Blocks recommendation feeds on Reddit.
 * @version 1.0.0
 */
import {
    onDOMLoaded,
    getElementByXpath,
    currentIntensityHigherThan,
    Intensity,
} from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    const observer = new MutationObserver(() => {
        // Dynamically check for the path name for changes
        if (
            window.location.pathname !== "/" &&
            window.location.pathname !== ""
        ) {
            return;
        }

        const element = getElementByXpath(
            '//*[@id="subgrid-container"]/div[1]',
        );
        if (element) {
            console.log("Blocking recommendation element.");
            element.hidden = true;
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
