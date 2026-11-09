/**
 * @id threads_grayscale
 * @name Threads Grayscale
 * @description Desaturates Threads images and video to reduce visual stimulation.
 * @version 1.0.0
 */
import { applyMediaDesaturation, onDOMLoaded } from "$common";

onDOMLoaded(() => {
    
    applyMediaDesaturation();
});
