/**
 * @id facebook_hide_reactions
 * @name Facebook Hide Reactions
 * @description Hides like counts, reaction summaries, and reaction buttons to reduce social validation pressure.
 * @version 1.0.0
 */
import { onDOMLoaded, currentIntensityHigherThan, Intensity, injectCss } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    // Hide reaction counts and buttons via CSS
    injectCss(`
        /* Hide reaction counts (likes, loves, etc.) */
        span[aria-label*="like"],
        span[aria-label*="Like"],
        span[aria-label*="reactions"],
        span[aria-label*="Reactions"],

        /* Hide the reaction bar/row in posts */
        [aria-label*="reactions on this post"],
        [aria-label*="people reacted"],

        /* Hide reaction buttons in posts */
        div[aria-label*="Like"],
        div[aria-label*="React"],

        /* Hide reaction count text (e.g., "You and 3 others") */
        span[aria-label*="others"],
        span[aria-label*="other people"] {
            display: none !important;
        }

        /* Target the reaction summary bar */
        div[data-visualcompletion="ignore-dynamic"]:has(> span[aria-label*="like"]),
        div[data-visualcompletion="ignore-dynamic"]:has(> span[aria-label*="reaction"]) {
            display: none !important;
        }
    `);

    // Text-based removal via observer
    const hideReactions = () => {
        const elements = document.querySelectorAll('span, div, a');
        elements.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';

            // Match reaction counts like "42", "1.2K", "Mario and 5 others"
            if (
                text.match(/^\d[\d,.]*\s*(likes|reactions|comments|shares)$/) ||
                text.match(/^\d[\d,.]*k\s*(likes|reactions)$/) ||
                text.match(/^[a-z]+\s*and\s*\d+\s*others$/i) ||
                ariaLabel.includes('like') && ariaLabel.match(/^\d/)
            ) {
                (el as HTMLElement).style.display = 'none';
            }
        });
    };

    const observer = new MutationObserver(() => {
        hideReactions();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    hideReactions();
});
