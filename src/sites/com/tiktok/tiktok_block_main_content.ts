/**
 * @name TikTok Block Main Content
 * @description Blocks the main "For You" feed content on TikTok to prevent doomscrolling.
 * @version 1.0.0
 */
import { onMount, injectCss } from "$common";

onMount(() => {
    // Blocks the main feed container
    injectCss(`
        #main-content-homepage_hot {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }
    `);
    setInterval(() => {
        const mainContent = document.getElementById(
            "main-content-homepage_hot"
        );
        if (mainContent) {
            const mediaElements = mainContent.querySelectorAll("video, audio");
            mediaElements.forEach((media) => {
                if (media instanceof HTMLMediaElement) {
                    if (!media.paused) media.pause();
                    if (!media.muted) media.muted = true;
                }
            });
        }
    }, 500);
});
