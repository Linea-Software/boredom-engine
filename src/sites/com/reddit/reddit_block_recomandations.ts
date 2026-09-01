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
            // The `hidden` attribute relies on the UA [hidden]{display:none}
            // rule (lowest precedence), which Reddit feed containers override
            // with their own display:flex/grid. Set inline display:none so the
            // block reliably hides the recommendation feed.
            (element as HTMLElement).style.setProperty("display", "none", "important");
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
