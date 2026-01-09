/**
 * @name TikTok Video Quality Downgrade
 * @description Forcefully downgrades the resolution of TikTok videos by overlaying a low-res canvas.
 * @version 1.0.0
 */
import { onMount, downgradeVideos, downgradeFetchImages } from "$common";

onMount(() => {
    // Apply 5% resolution quality for a very pixelated effect
    downgradeVideos(0.05);

    downgradeFetchImages(0.25);
});
