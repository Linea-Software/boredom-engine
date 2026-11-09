/**
 * @id snapchat_grayscale
 * @name Snapchat Grayscale
 * @description Desaturates Snapchat Web media while leaving messaging controls usable.
 * @version 1.0.0
 */
import { applyMediaDesaturation, onDOMLoaded } from "$common";

onDOMLoaded(() => {

    applyMediaDesaturation();
});
