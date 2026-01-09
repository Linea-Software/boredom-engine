/**
 * @name TikTok Video Quality Downgrade
 * @description Forcefully downgrades the resolution of TikTok videos by overlaying a low-res canvas.
 * @version 1.0.0
 */
import { onMount, downgradeVideos, downgradeFetchImages } from "$common";

onMount(() => {
    downgradeVideos(0.9);
    downgradeFetchImages(0.25);
});
