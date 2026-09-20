/**
 * @id threads_grayscale
 * @name Threads Grayscale
 * @description Desaturates Threads images and video to reduce visual stimulation.
 * @version 1.0.0
 */
import { applyMediaDesaturation, currentIntensityHigherThan, Intensity, onDOMLoaded } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) return;
    applyMediaDesaturation();
});
