/**
 * @name YouTube Grayscale
 * @description Turns the YouTube video player and Shorts grayscale to reduce visual stimulation.
 * @version 1.1.0
 */
import { onMount, applyMediaDesaturation } from "$common";

onMount(() => {
    applyMediaDesaturation();
});
