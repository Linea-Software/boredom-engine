/**
 * @id netflix_grayscale
 * @name Netflix Grayscale
 * @description Desaturates Netflix artwork and video according to Boredom Engine intensity.
 * @version 1.0.0
 */
import { applyMediaDesaturation, onDOMLoaded } from "$common";

onDOMLoaded(() => {
    
    applyMediaDesaturation();
});
