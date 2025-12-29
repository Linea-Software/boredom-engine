/**
 * @name Media Grayscale
 * @description Grayscales all media on the page.
 * @version 1.0.0
 */

import { onMount, applyMediaGrayscale } from "$common";

onMount(() => {
    applyMediaGrayscale();
});
