/**
 * @id snapchat_grayscale
 * @name Snapchat Grayscale
 * @description Desaturates Snapchat Web media while leaving messaging controls usable.
 * @version 1.0.0
 */
import { applyMediaDesaturation, currentIntensityHigherThan, Intensity, onDOMLoaded } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) return;
    applyMediaDesaturation();
});
