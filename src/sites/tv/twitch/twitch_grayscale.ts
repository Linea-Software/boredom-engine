/**
 * @name Twitch Grayscale
 * @description Applies a grayscale filter to Twitch thumbnails and images.
 * @version 1.0.0
 */
import { onMount, applyMediaDesaturation } from "$common";

onMount(() => {
    applyMediaDesaturation();
});
