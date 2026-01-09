/**
 * @name Instagram Grayscale
 * @description Makes Instagram media grayscale to reduce dopamine.
 * @version 1.0.0
 */
import { onMount, applyMediaDesaturation } from "$common";

onMount(() => {
    applyMediaDesaturation();

    //set css variable --ig-badge: 255, 48, 64; to gray
    document.documentElement.style.setProperty("--ig-badge", "156, 156, 156");
});
