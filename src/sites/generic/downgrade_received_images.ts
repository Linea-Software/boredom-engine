/**
 * @name Downgrade Received Images
 * @description Intercepts fetch requests for images and downgrades their quality to reduced bandwidth usage / increase annoyance.
 * @version 1.0.0
 */
import { onMount, downgradeFetchImages } from "$common";

onMount(() => {
    downgradeFetchImages(0.01); // 1% of original quality
});
