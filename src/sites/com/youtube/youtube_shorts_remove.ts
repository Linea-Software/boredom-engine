/**
 * @name YouTube Shorts Remove
 * @description Removes the Shorts section from the YouTube homepage.
 * @version 1.0.0
 */

import { onMount, injectCss, getElementByXpath } from "$common";

onMount(() => {
    injectCss(`
        [is-shorts] {
            display: none !important;
        }
    `);

    const removeShortsElements = () => {
        // Remove the main shorts container
        const shortsContainer = document.getElementById(
            "shorts-inner-container"
        );
        if (shortsContainer) {
            shortsContainer.remove();
        }

        // Remove Shorts entry from guide/mini-guide (div#items)
        const itemsDivs = document.querySelectorAll("div#items");
        itemsDivs.forEach((itemsDiv) => {
            const children = Array.from(itemsDiv.children);
            children.forEach((child) => {
                // Check for title="Shorts" in anchor
                if (child.querySelector('a[title="Shorts"]')) {
                    child.remove();
                    return;
                }

                // Check for text "Shorts" in formatted string
                const titleSpan = child.querySelector(
                    "yt-formatted-string.title"
                );
                if (titleSpan && titleSpan.textContent?.trim() === "Shorts") {
                    child.remove();
                }
            });
        });
    };

    // use an observer to remove dynamic elements
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                removeShortsElements();
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Initial check
    removeShortsElements();
});
