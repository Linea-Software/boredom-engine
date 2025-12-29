/**
 * @name YouTube Audio Delay
 * @description Adds a 2-second delay to the audio to make the video more frustrating to watch. Works with both YouTube Shorts and regular videos.
 * @version 1.0.0
 */
import { onMount, setAudioDelay } from "$common";

onMount(() => {
    const video =
        document.querySelector<HTMLMediaElement>(".html5-main-video") ||
        document.querySelector<HTMLMediaElement>("video");
    if (video) {
        setAudioDelay(video, 2);
    } else {
        console.warn("YouTube Audio Delay: No video element found.");
    }
});
