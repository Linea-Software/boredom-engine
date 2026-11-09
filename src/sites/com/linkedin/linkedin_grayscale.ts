/**
 * @id linkedin_grayscale
 * @name LinkedIn Grayscale
 * @description Desaturates LinkedIn images and video to reduce visual stimulation.
 * @version 1.0.0
 */

import { applyMediaDesaturation, onDOMLoaded } from "$common";

onDOMLoaded(() => {

    applyMediaDesaturation();
});
