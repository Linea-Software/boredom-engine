/**
 * @id instagram_hide_comments
 * @name Instagram Hide Comments
 * @description Hides comments sections on Instagram to reduce engagement and "infinite scrolling" of discussions.
 * @version 1.0.0
 */

import { onDOMLoaded, currentIntensityHigherThan, Intensity, injectCss } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    // Hide comment buttons and comment sections
    injectCss(`
        /* Hide comment buttons in feed */
        svg[aria-label="Comment"],
        svg[aria-label="Commento"],
        svg[aria-label="Scrivi un commento"],
        svg[aria-label="Add a comment"] {
            display: none !important;
        }

        button:has(svg[aria-label="Comment"]),
        button:has(svg[aria-label="Commento"]),
        a:has(svg[aria-label="Comment"]),
        a:has(svg[aria-label="Commento"]) {
            display: none !important;
        }

        /* Hide comments list in modal/single post view */
        ul._ab8d._ab8e,
        ul._a9z6,
        div[role="presentation"] ul,
        section.x78zum5.xdt5ytf.x1iyjqo2.xg6iff7 {
             display: none !important;
        }
    `);

    // Add a more robust observer for text-based hiding
    const hideCommentText = () => {
        const elements = document.querySelectorAll('span, div, button, a');
        elements.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            if (
                (text.includes('view all') && text.includes('comment')) || 
                (text.includes('visualizza tutti') && text.includes('commenti')) ||
                (text.includes('mostra tutti') && text.includes('commenti')) ||
                (text.includes('altri') && text.includes('commenti'))
            ) {
                (el as HTMLElement).style.display = 'none';
            }
        });
    };

    const observer = new MutationObserver(() => {
        hideCommentText();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    hideCommentText();
});
