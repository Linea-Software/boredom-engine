/**
 * @name YouTube Grayscale
 * @description Turns the YouTube video player and Shorts grayscale to reduce visual stimulation.
 * @version 1.1.0
 */
import { onMount, injectCss } from "$common";

onMount(() => {
    const css = `
        .video-stream.html5-main-video,
        .html5-video-container,
        .reel-video-in-sequence-thumbnail {
            filter: grayscale(100%) !important;
        }
    `;

    injectCss(css);
});
