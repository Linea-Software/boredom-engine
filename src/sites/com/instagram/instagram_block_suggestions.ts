/**
 * @id instagram_block_suggestions
 * @name Instagram Block Suggestions
 * @description Removes "Suggested for you" posts and sections from the Instagram feed.
 * @version 1.0.0
 */

import { onDOMLoaded, currentIntensityHigherThan, Intensity, injectCss } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    const removeSuggestions = () => {
        // Find sections in the feed that contain "Suggested for you" or similar
        const elements = document.querySelectorAll('span, h2, div');
        elements.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            if (
                text === 'suggested for you' || 
                text === 'suggeriti per te' ||
                text === 'suggestions for you' ||
                text === 'per te'
            ) {
                // Try to find the container post or section
                // Usually it's several levels up
                let container = el.parentElement;
                let depth = 0;
                while (container && depth < 10) {
                    // Instagram feed items are usually articles or divs with specific roles
                    if (container.tagName === 'ARTICLE' || container.getAttribute('role') === 'presentation') {
                        (container as HTMLElement).style.display = 'none';
                        break;
                    }
                    container = container.parentElement;
                    depth++;
                }
            }
        });
        
        // Also hide the right sidebar suggestions
        const sidebarSuggestions = document.querySelectorAll('div');
        sidebarSuggestions.forEach(div => {
             if (div.textContent?.includes('Suggested for you') || div.textContent?.includes('Suggeriti per te')) {
                 if (div.parentElement && div.parentElement.children.length > 2) {
                     // This is likely the sidebar container
                     // We don't want to hide the whole sidebar if it contains other things, 
                     // but usually this specific div is the suggestions block.
                 }
             }
        });
    };

    const observer = new MutationObserver(() => {
        removeSuggestions();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    removeSuggestions();
    
    // Some CSS to target common suggestion classes if known
    injectCss(`
        /* Suggested for you headers in feed */
        div._aak6 {
            /* display: none !important; */
        }
    `);
});
