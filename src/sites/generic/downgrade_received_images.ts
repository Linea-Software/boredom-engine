/**
 * @name Downgrade Received Images
 * @description Intercepts fetch requests for images and downgrades their quality to reduced bandwidth usage / increase annoyance.
 * @version 1.0.0
 */
import { onMount, downgradeImages } from "$common";

onMount(() => {
    downgradeImages(0.01); // 1% of original quality
});
