/**
 * @name YouTube Grayscale
 * @description Turns the YouTube video player and Shorts grayscale to reduce visual stimulation.
 * @version 1.1.0
 */
import { onMount, applyMediaDesaturation } from "$common";
import { YouTubeBypassController } from "$sites/com/youtube/shared/youtube-bypass";

onMount(() => {
    applyMediaDesaturation();
    if (window.location.href.includes("/watch")) {
        const bypass = YouTubeBypassController.getInstance();
        bypass.updateFilters({ grayscale: 1 });
    }
});
