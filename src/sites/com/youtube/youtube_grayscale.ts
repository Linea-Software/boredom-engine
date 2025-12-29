/**
 * @name YouTube Grayscale
 * @description Turns the YouTube video player grayscale.
 * @version 1.0.0
 */
import { setGrayscale, onMount } from "../../../common";

onMount(() => {
    const videoElement = document.querySelector<HTMLElement>(
        ".video-stream.html5-main-video"
    );

    if (videoElement) {
        setGrayscale(videoElement, 100);
    } else {
        console.error("Video element not found!");
    }
});
