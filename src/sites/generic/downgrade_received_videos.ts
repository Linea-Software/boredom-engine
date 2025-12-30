/**
 * @name Downgrade Received Videos
 * @description Downgrades the visual quality of videos by rendering them at a lower resolution (pixelated).
 * @version 1.0.0
 */
import { onMount, downgradeVideos } from "$common";

onMount(() => {
    downgradeVideos(0.4); // 40% resolution for extreme blockiness
});
