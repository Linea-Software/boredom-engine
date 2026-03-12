/**
 * @id instagram_hide_likes
 * @name Instagram Hide Likes
 * @description Hides like counts and "liked by" information to reduce social validation pressure.
 * @version 1.0.0
 */

import { onDOMLoaded, currentIntensityHigherThan, Intensity, injectCss } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    // Hide Like counts and "Liked by" info
    injectCss(`
        /* Hide Like buttons text/counts */
        a[href*="/liked_by/"] {
             display: none !important;
        }
    `);

    const hideLikeCounts = () => {
        // Find links that open the "Liked by" list
        const likeLinks = document.querySelectorAll('a[href*="/liked_by/"]');
        likeLinks.forEach(link => {
            // Find the container (usually a section or div) and hide it
            const container = link.closest('section') || link.parentElement;
            if (container) {
                (container as HTMLElement).style.display = 'none';
            }
        });

        // Search for text related to likes
        const spans = document.querySelectorAll('span, div');
        spans.forEach(el => {
            const text = el.textContent || '';
            if (
                /^\d+ likes$/.test(text) || 
                /^\d+ Mi piace$/.test(text) ||
                text.includes('others') && text.includes('liked') ||
                text.includes('altre persone') && text.includes('piace')
            ) {
                (el as HTMLElement).style.display = 'none';
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
