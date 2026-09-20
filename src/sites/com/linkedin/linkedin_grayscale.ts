/**
 * @id linkedin_grayscale
 * @name LinkedIn Grayscale
 * @description Desaturates LinkedIn images and video to reduce visual stimulation.
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
