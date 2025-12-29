/**
 * @name YouTube Grayscale
 * @description Turns the YouTube video player grayscale.
 * @version 1.0.0
 */
import { setGrayscale } from "../../../common";

function setupGrayscale() {
    const videoElement = document.querySelector<HTMLElement>(
        ".video-stream.html5-main-video"
    );

    if (videoElement) {
        setGrayscale(videoElement, 100);
    } else {
        console.error("Video element not found!");
    }
}

// In case the script loads after DOMContentLoaded
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        setupGrayscale();
    });
} else {
    setupGrayscale();
}
