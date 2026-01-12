/**
 * @id youtube_video_buffer_delay
 * @name YouTube Video Buffer Delay
 * @description Simulates buffering by pausing the video and showing the native YouTube spinner.
 * @version 1.0.4
 */

import { onDOMLoaded } from "$common";

onDOMLoaded(() => {
    let isBuffering = false;

    // 5% chance every second to simulate buffering
    setInterval(() => {
        const video = document.querySelector("video");
        // Retrieve the player container for spinner if needed, but the spinner is usually inside the player logic.
        // The ".ytp-spinner" element exists within ".html5-video-player"

        if (!video || video.paused || video.ended) return;
        if (isBuffering) return;

        // Check local state or global state
        if (document.body.dataset.boredomCaptchaActive === "true") return;

        if (Math.random() < 0.05) {
            isBuffering = true;
            document.body.dataset.boredomBufferingActive = "true";

            const duration = 3000 + Math.random() * 3000;

            // Pause the video to simulate buffering
            video.pause();

            // Attempt to show the native spinner
            const spinner = document.querySelector(
                ".ytp-spinner",
            ) as HTMLElement;
            // Store original display to restore later (though usually empty)
            const originalDisplay = spinner ? spinner.style.display : "";

            if (spinner) {
                spinner.style.display = "block";
                // Force visibility just in case
                spinner.style.visibility = "visible";
            }

            setTimeout(() => {
                isBuffering = false;
                delete document.body.dataset.boredomBufferingActive;

                // Resume playback
                video.play();

                if (spinner) {
                    spinner.style.display = originalDisplay;
                    spinner.style.visibility = "";
                }
            }, duration);
        }
    }, 1000);
});
