/**
 * @name Media Grayscale
 * @description Grayscales all media on the page.
 * @version 1.0.0
 */

import { injectCss, onMount } from "$common";

onMount(() => {
    const css = `
        video,
        img {
            filter: grayscale(100%) !important;
        }
    `;

    injectCss(css);
});
