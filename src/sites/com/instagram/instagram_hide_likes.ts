/**
 * @id instagram_hide_likes
 * @name Instagram Hide Likes
 * @description Hides like counts and "liked by" information to reduce social validation pressure.
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

    // Hide likes using language-agnostic selectors:
    // - SVG path signature for the like (heart) icon
    // - URL-based selectors ("/liked_by/")
    injectCss(`
        /* Hide Like buttons text/counts in feed by SVG heart icon path signature */
        div[role="button"]:has(svg path[d^="M16.792 3.904"]),
        a:has(svg path[d^="M16.792 3.904"]),
        button:has(svg path[d^="M16.792 3.904"]),

        /* Hide "Liked by" links (URL-based — language-agnostic) */
        a[href*="/liked_by/"],

        /* Hide Like count in modal/single post view */
        span.x1rg5ohu.x1qfufaz {
            display: none !important;
        }
    `);

    // JavaScript fallback: find like buttons and counts by their SVG icon path
    const hideLikeCounts = () => {
        // Find links that open the "Liked by" list (URL-based, always language-agnostic)
        const likeLinks = document.querySelectorAll('a[href*="/liked_by/"]');
        likeLinks.forEach((link) => {
            const container = link.closest("section") || link.parentElement;
            if (container) {
                (container as HTMLElement).style.display = "none";
            }
        });

        // Find like buttons by their heart SVG path signature
        const allButtons = document.querySelectorAll(
            'div[role="button"], a, button',
        );
        allButtons.forEach((btn) => {
            const svg = btn.querySelector("svg");
            if (!svg) return;
            const path = svg.querySelector("path");
            if (!path) return;
            const d = path.getAttribute("d") || "";

            // Heart (like) icon path starts with M16.792 3.904
            if (d.startsWith("M16.792 3.904")) {
                (btn as HTMLElement).style.display = "none";
            }
        });
    };

    const observer = new MutationObserver(() => {
        hideLikeCounts();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    hideLikeCounts();
});
