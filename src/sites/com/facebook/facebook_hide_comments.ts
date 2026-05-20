/**
 * @id facebook_hide_comments
 * @name Facebook Hide Comments
 * @description Hides comment sections and comment buttons to reduce engagement and doomscrolling.
 * @version 1.0.0
 */
import { onDOMLoaded, currentIntensityHigherThan, Intensity, injectCss } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    // Hide comment sections and buttons via CSS
    injectCss(`
        /* Hide comment buttons */
        a[aria-label*="Comment"],
        a[aria-label*="Commenta"],
        div[role="button"][aria-label*="Comment"],
        div[role="button"][aria-label*="Commenta"],

        /* Hide comment containers */
        div[aria-label*="Comment"],
        div[aria-label*="Commenti"],

        /* Hide "View X comments" links */
        a[aria-label*="View previous comments"],
        a[aria-label*="Mostra commenti precedenti"],
        a[aria-label*="Mostra altri commenti"],
        a[aria-label*="View more comments"],

        /* Hide the full comment section in modals */
        [role="dialog"] div[aria-label*="Comments"],
        [role="dialog"] div[aria-label*="Commenti"] {
            display: none !important;
        }

        /* Hide comment input */
        form[aria-label*="comment"],
        form[aria-label*="Commenta"],
        div[aria-label*="Write a comment"],
        div[aria-label*="Scrivi un commento"] {
            display: none !important;
        }

        /* Hide comment counts on posts */
        span[aria-label*="comments"],
        span[aria-label*="commenti"] {
            display: none !important;
        }
    `);

    // Text-based removal for comment sections
    const hideComments = () => {
        const elements = document.querySelectorAll('span, div, a, button');
        elements.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            if (
                text.includes('comment') ||
                text.includes('commenta') ||
                text.includes('commenti') ||
                text.includes('mostra tutti') && text.includes('comment') ||
                text.includes('view all') && text.includes('comment') ||
                text.includes('scrivi un commento') ||
                text.includes('write a comment')
            ) {
                // Check if this is a dedicated comment element (text is relatively short)
                if (text.length < 80) {
                    // Try to find and hide the parent comment container
                    let container = el.parentElement;
                    let depth = 0;
                    while (container && depth < 6) {
                        if (
                            container.getAttribute('role') === 'article' ||
                            container.tagName === 'SECTION'
                        ) {
                            (container as HTMLElement).style.display = 'none';
                            break;
                        }
                        container = container.parentElement;
                        depth++;
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
