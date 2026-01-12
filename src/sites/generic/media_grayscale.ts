/**
 * @id generic_media_grayscale
 * @name Media Grayscale
 * @description Grayscales all media on the page.
 * @version 1.0.0
 */

import { onDOMLoaded, applyMediaDesaturation } from "$common";

onDOMLoaded(() => {
    applyMediaDesaturation();
});
