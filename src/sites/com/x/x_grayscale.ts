/**
 * @id x_grayscale
 * @name X Grayscale
 * @description Desaturates images and video on X to reduce visual stimulation.
 * @version 1.0.0
 */

import { applyMediaDesaturation, onDOMLoaded } from "$common";

onDOMLoaded(() => {

    applyMediaDesaturation(['[data-testid="tweetPhoto"]']);
});
