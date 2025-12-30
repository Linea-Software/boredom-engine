/**
 * @name YouTube Video Buffer Delay
 * @description Simulates buffering by pausing the video and showing the native YouTube spinner.
 * @version 1.0.4
 */

import { onMount } from "$common";

onMount(() => {
    let isBuffering = false;

    // intercept pause events to prevent UI updates (Play button changing) during fake buffering
    document.addEventListener(
        "pause",
        (e) => {
            if (isBuffering && e.target instanceof HTMLVideoElement) {
                e.stopImmediatePropagation();
            }
        },
        true // capture phase to intercept before YouTube's listeners
    );

    setInterval(() => {
        const video =
            document.querySelector<HTMLVideoElement>(".html5-main-video");

        const spinner = document.querySelector<HTMLElement>(".ytp-spinner");

        // only interfere if video and spinner exist, and video is actively playing
        if (!video || !spinner || video.paused || video.ended) return;

        if (isBuffering) return;

        // 5% chance every second to simulate buffering
        if (Math.random() < 0.05) {
            isBuffering = true;

            video.dispatchEvent(new CustomEvent("BoredomFakeBufferStart"));

            spinner.style.display = "block";
            spinner.style.zIndex = "1000";
            spinner.style.visibility = "visible";

            video.pause();

            const bufferingDuration = 1000 + Math.random() * 2000; // 1s to 3s

            setTimeout(() => {
                video
                    .play()
                    .then(() => {
                        spinner.style.display = "none";
                        spinner.style.zIndex = "";
                        spinner.style.visibility = "";
                        isBuffering = false;
                    })
                    .catch(() => {
                        spinner.style.display = "none";
                        spinner.style.zIndex = "";
                        spinner.style.visibility = "";
                        isBuffering = false;
                    });
            }, bufferingDuration);
        }
    }, 1000);
});
