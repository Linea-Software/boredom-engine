/**
 * @name YouTube Video Buffer Delay
 * @description Simulates buffering by pausing the video and showing the native YouTube spinner.
 * @version 1.0.4
 */

import { onMount } from "$common";
import { YouTubeBypassController } from "$sites/com/youtube/shared/youtube-bypass";

onMount(() => {
    let isBuffering = false;

    // We can't easily intercept "pause" events across iframe boundary for global UI logic unless we inject script into iframed document.
    // For now we rely on the main "boredom" logic.

    // But we need to sync with captcha if we want to be nice?
    // The previous script listened to document.body.dataset.boredomCaptchaActive.

    // 5% chance every second to simulate buffering
    setInterval(() => {
        const bypass = YouTubeBypassController.getInstance();
        const video = bypass.getVideoElement();

        if (!video || video.paused || video.ended) return;
        if (isBuffering) return;

        // Check local state or global state
        if (document.body.dataset.boredomCaptchaActive === "true") return;

        if (Math.random() < 0.05) {
            isBuffering = true;
            document.body.dataset.boredomBufferingActive = "true";

            const duration = 3000 + Math.random() * 3000;
            bypass.simulateBuffering(duration);

            setTimeout(() => {
                isBuffering = false;
                delete document.body.dataset.boredomBufferingActive;
            }, duration);
        }
    }, 1000);
});
