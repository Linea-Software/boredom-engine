/**
 * @id netflix_grayscale
 * @name Netflix Grayscale
 * @description Desaturates Netflix artwork and video according to Boredom Engine intensity.
 * @version 1.0.0
 */
import { applyMediaDesaturation, currentIntensityHigherThan, Intensity, onDOMLoaded } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) return;
    applyMediaDesaturation();
});
