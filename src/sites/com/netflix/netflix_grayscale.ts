/**
 * @id netflix_grayscale
 * @name Netflix Grayscale
 * @description Desaturates Netflix artwork and video when enabled.
 * @version 1.0.0
 */
import { applyMediaDesaturation, onDOMLoaded } from "$common";

onDOMLoaded(() => {

    applyMediaDesaturation();
});
