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
        div[role="button"][aria-label*="Comment"],

        /* Hide comment containers */
        div[aria-label*="Comment"],

        /* Hide "View X comments" links */
        a[aria-label*="View previous comments"],
        a[aria-label*="View more comments"],

        /* Hide the full comment section in modals */
        [role="dialog"] div[aria-label*="Comments"] {
            display: none !important;
        }

        /* Hide comment input */
        form[aria-label*="comment"],
        div[aria-label*="Write a comment"] {
            display: none !important;
        }

        /* Hide comment counts on posts */
        span[aria-label*="comments"] {
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
                text.includes('view all') && text.includes('comment') ||
                text.includes('write a comment')
            ) {
            // Text-based removal for comment counts/links/buttons. We only hide
            // the matched element itself. Climbing up to the nearest
            // role="article"/SECTION hidden the WHOLE post on the feed, which is
            // far beyond the described "hide comment sections and comment buttons"
            // and wiped out every post with a comment count.
            if (text.length < 80) {
                (el as HTMLElement).style.display = 'none';
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
