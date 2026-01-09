/**
 * @name Twitch Media Quality Downgrade
 * @description Forcefully downgrades the resolution of Twitch videos and images to reduce dopamine stimulation.
 * @version 1.0.0
 */
import { onMount, downgradeVideos, downgradeFetchImages } from "$common";

onMount(() => {
    downgradeVideos(0.9);
    downgradeFetchImages(0.25);
});
