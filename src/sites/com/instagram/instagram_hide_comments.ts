/**
 * @id instagram_hide_comments
 * @name Instagram Hide Comments
 * @description Hides comments sections on Instagram to reduce engagement and "infinite scrolling" of discussions.
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

    // Hide comments using language-agnostic selectors:
    // - SVG path signature for the comment (speech bubble) icon
    // - Structural CSS selectors for comment sections
    injectCss(`
        /* Hide comment button by its SVG icon path signature (speech bubble) */
        div[role="button"]:has(svg path[d^="M20.656 17.008"]),
        /* Also hide the comment count span that typically sits next to it */
        div[role="button"]:has(svg path[d^="M20.656 17.008"]) ~ div[role="button"]:has(svg path[d^="M20.656 17.008"]),
        /* Hide comment button containers */
        a:has(svg path[d^="M20.656 17.008"]),
        button:has(svg path[d^="M20.656 17.008"]),

        /* Hide comments list in modal/single post view (class-based selectors) */
        ul._ab8d._ab8e,
        ul._a9z6 {
            display: none !important;
        }
    `);

    // JavaScript fallback: find comment buttons by their position in the action bar
    const hideComments = () => {
        const articles = document.querySelectorAll("article");
        articles.forEach((article) => {
            // Get the flat list of all role="button" elements in DOM order
            const allButtons = Array.from(
                article.querySelectorAll('[role="button"]'),
            );

            for (let i = 0; i < allButtons.length; i++) {
                const btn = allButtons[i];
                const svg = btn.querySelector("svg");
                if (!svg) continue;
                const path = svg.querySelector("path");
                if (!path) continue;
                const d = path.getAttribute("d") || "";

                // Comment icon path starts with M20.656 (speech bubble)
                if (d.startsWith("M20.656 17.008")) {
                    (btn as HTMLElement).style.display = "none";

                    // Hide the next [role="button"] — it's the count
                    const next = allButtons[i + 1];
                    if (next) {
                        (next as HTMLElement).style.display = "none";
                    }
                }
            }
        });
    };

    const observer = new MutationObserver(() => {
        hideComments();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    hideComments();
});
