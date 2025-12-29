/**
 * @name Reddit Posts Grayscale
 * @description Makes Reddit media grayscale to reduce dopamine.
 * @version 1.0.0
 */
import { onMount, applyMediaGrayscale } from "$common";

onMount(() => {
    applyMediaGrayscale(["shreddit-player"]);
});
