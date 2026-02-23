/**
 * @id youtube_grayscale
 * @name YouTube Grayscale
 * @description Turns the YouTube video player and Shorts grayscale to reduce visual stimulation.
 * @version 1.1.0
 */
import { onDOMLoaded, applyMediaDesaturation, setGrayscale, getIntensity, currentIntensityHigherThan, Intensity } from "$common";

onDOMLoaded(() => {
        if(!currentIntensityHigherThan(Intensity.None)){
            return;
        }

    applyMediaDesaturation();
    if (window.location.href.includes("/watch")) {
        // Enforce grayscale on the video element specifically
        // We use an interval or just check because the video element might be re-created or style reset
        setInterval(() => {
            const video = document.querySelector("video");
            if (video) {
                setGrayscale(video, getIntensity());
            }
        }, 1000);
    }
});
