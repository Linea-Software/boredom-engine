/**
 * @name Reddit Posts Grayscale
 * @description Makes Reddit media grayscale to reduce dopamine.
 * @version 1.0.0
 */
import { onMount, injectCss } from "$common";

onMount(() => {
    const css = `
        img, video, shreddit-player {
            filter: grayscale(100%) !important;
        }
    `;
    injectCss(css);
});
