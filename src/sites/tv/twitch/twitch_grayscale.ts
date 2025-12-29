/**
 * @name Twitch Grayscale
 * @description Applies a grayscale filter to Twitch thumbnails and images.
 * @version 1.0.0
 */
import { onMount, injectCss } from "../../../common";

onMount(() => {
    const css = `
        .tw-image {
            filter: grayscale(100%) !important;
            -webkit-filter: grayscale(100%) !important;
        }
    `;
    injectCss(css);
});
