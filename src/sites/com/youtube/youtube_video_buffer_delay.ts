/**
 * @id youtube_video_buffer_delay
 * @name YouTube Video Buffer Delay
 * @description Simulates buffering by pausing the video and showing the native YouTube spinner.
 * @version 1.0.5
 */

import { onDOMLoaded } from "$common";

const BUFFER_DELAY_DURATION_MAP = 1500;

const BUFFER_DELAY_RANDOM_MAP = 0.1;

onDOMLoaded(() => {
    
    let isBuffering = false;

    // Enforce buffering state
    document.addEventListener(
        "play",
        (e) => {
            if (isBuffering) {
                const target = e.target as HTMLVideoElement;
                if (target && target.tagName === "VIDEO") {
                    e.preventDefault();
                    e.stopPropagation();
                    target.pause();
                }
            }
        },
        true, // Capture phase
    );

    setInterval(() => {
        const video = document.querySelector("video");
        // Retrieve the player container for spinner if needed, but the spinner is usually inside the player logic.
        // The ".ytp-spinner" element exists within ".html5-video-player"

        if (!video || video.paused || video.ended) return;
        if (isBuffering) return;

        // Check local state or global state
        if (document.body.dataset.boredomCaptchaActive === "true") return;

        if (Math.random() < BUFFER_DELAY_RANDOM_MAP) {
            isBuffering = true;
            document.body.dataset.boredomBufferingActive = "true";

            // Determine duration (3-6 seconds)
            const duration =
                BUFFER_DELAY_DURATION_MAP * (1 + Math.random());

            // Pause the video to simulate buffering
            video.pause();

            // Attempt to show the native spinner
            const spinner = document.querySelector(
                ".ytp-spinner",
            ) as HTMLElement;

            // Store original display to restore later (usually it's empty or 'none')
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
                video.play().catch(() => {
                    // Autoplay policy / tab hidden can reject play(); swallow it
                    // so we don't leave an unhandled rejection. The video stays
                    // paused and the next interval tick will retry buffering.
                });

                if (spinner) {
                    spinner.style.display = originalDisplay;
                    spinner.style.visibility = "";
                }
            }, duration);
        }
    }, 1000);
});
