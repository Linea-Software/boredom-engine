/**
 * @name Twitch Media Quality Downgrade
 * @description Forcefully downgrades the resolution of Twitch videos and images to reduce dopamine stimulation.
 * @version 1.0.0
 */
import { onMount, downgradeVideos, downgradeImages } from "$common";

onMount(() => {
    downgradeVideos(0.9);
    downgradeImages(0.25);
});
