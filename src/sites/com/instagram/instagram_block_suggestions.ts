/**
 * @id instagram_block_suggestions
 * @name Instagram Block Suggestions
 * @description Removes "Suggested for you" posts and sections from the Instagram feed.
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

    // Hide suggested posts by finding and hiding all articles after the suggestions separator.
    // The separator is a non-article element that sits between regular posts and suggested posts
    // in the main feed — it has a distinctive structure regardless of language.
    const removeSuggestions = () => {
        const main =
            document.querySelector("main") ||
            document.querySelector('[role="main"]');
        if (!main) return;

        // Walk through direct and close descendants of main, looking for the separator
        const feedItems = Array.from(
            main.querySelectorAll(
                ":scope > div > div > div > article, :scope > div > div article",
            ),
        );
        if (feedItems.length < 2) return;

        const candidates = main.querySelectorAll(
            ":scope > div > div > div > *",
        );
        let pastSeparator = false;

        candidates.forEach((child) => {
            if (pastSeparator && child.tagName === "ARTICLE") {
                (child as HTMLElement).style.display = "none";
                return;
            }

            // The separator is a structural divider (not an article) that
            // sits between feed posts. We identify it by checking for these traits:
            // - It's NOT an article
            // - It appears between articles in the feed
            // - Has a specific set of CSS classes or contains a short text label
            if (child.tagName !== "ARTICLE") {
                const hasLabel =
                    child.classList.contains("x1bs97v6") || // Suggestion divider class
                    child.querySelector(
                        ":scope > div > div > div > div > span",
                    );
                if (hasLabel) {
                    pastSeparator = true;
                    (child as HTMLElement).style.display = "none";
                }
            }
        });

        // Also check for articles that are structurally after the separator
        const articles = main.querySelectorAll("article");
        let crossingSeparator = false;
        const separatorClasses = ["x1bs97v6", "xnc8uc2"];

        // Look at all children between articles to find the separator
        const walker = document.createTreeWalker(main, NodeFilter.SHOW_ELEMENT);
        const flatNodes: Element[] = [];
        let node = walker.nextNode();
        while (node) {
            flatNodes.push(node as Element);
            node = walker.nextNode();
        }

        for (const el of flatNodes) {
            if (el.tagName === "ARTICLE" && crossingSeparator) {
                (el as HTMLElement).style.display = "none";
            }
            // A separator element between feed sections has multiple distinct classes
            if (
                el.tagName !== "ARTICLE" &&
                separatorClasses.every((c) => el.classList.contains(c))
            ) {
                crossingSeparator = true;
                (el as HTMLElement).style.display = "none";
            }
        }
    };

    const observer = new MutationObserver(() => {
        removeSuggestions();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    removeSuggestions();
});
