/**
 * @id pinterest_grayscale
 * @name Pinterest Grayscale
 * @description Desaturates Pinterest images and video to reduce the pull of visual novelty.
 * @version 1.0.0
 */

import {
    applyMediaDesaturation,
    currentIntensityHigherThan,
    Intensity,
    onDOMLoaded,
} from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) return;
    applyMediaDesaturation();
});
