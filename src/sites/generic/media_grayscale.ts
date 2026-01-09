/**
 * @name Media Grayscale
 * @description Grayscales all media on the page.
 * @version 1.0.0
 */

import { onMount, applyMediaDesaturation } from "$common";

onMount(() => {
    applyMediaDesaturation();
});
