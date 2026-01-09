/**
 * @name Twitch Remove Featured Carousel
 * @description Removes the featured carousel from the Twitch homepage.
 * @version 1.2.0
 */
import { onMount, injectCss } from "$common";

onMount(() => {
    // Inject style to hide it immediately for better performance/UX
    injectCss(`
        [data-a-target="front-page-carousel"],
        .front-page-carousel {
            display: none !important;
        }
    `);

    const removeCarousel = () => {
        const selectors = [
            '[data-a-target="front-page-carousel"]',
            ".front-page-carousel",
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => {
                console.log("Removing Twitch featured carousel:", selector);
                el.remove();
            });
        }
    };

    // Run immediately
    removeCarousel();

    // Run on mutations because Twitch is an SPA
    const observer = new MutationObserver(() => {
        removeCarousel();
    });

    // Ensure any media inside is muted/paused (even if hidden or about to be removed)
    setInterval(() => {
        const selectors = [
            '[data-a-target="front-page-carousel"]',
            ".front-page-carousel",
        ];

        for (const selector of selectors) {
            const containers = document.querySelectorAll(selector);
            containers.forEach((container) => {
                const mediaElements =
                    container.querySelectorAll("video, audio");
                mediaElements.forEach((media) => {
                    if (media instanceof HTMLMediaElement) {
                        if (!media.paused) media.pause();
                        if (!media.muted) media.muted = true;
                    }
                });
            });
        }
    }, 500);

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
});
