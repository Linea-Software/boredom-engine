/**
 * @id x_grayscale
 * @name X Grayscale
 * @description Desaturates images and video on X to reduce visual stimulation.
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
    applyMediaDesaturation(['[data-testid="tweetPhoto"]']);
});
