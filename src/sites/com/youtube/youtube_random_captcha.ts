/**
 * @name YouTube Random Captcha
 * @description Randomly triggers a captcha to annoy the user while watching YouTube, pausing the video until solved.
 * @version 1.0.0
 */

import { onMount } from "$common";
import { FakeCaptcha } from "$common/captcha";

onMount(() => {
    const minInterval = 2 * 60 * 1000; // 2 minutes
    const maxInterval = 5 * 60 * 1000; // 5 minutes
    const captcha = new FakeCaptcha();

    let isCaptchaActive = false;

    const pauseVideo = () => {
        const video = document.querySelector("video");
        if (video && !video.paused) {
            video.pause();
            return video; // Return video if we paused it
        }
        return null;
    };

    const resumeVideo = (video: HTMLVideoElement | null) => {
        if (video) {
            video.play().catch(console.error);
        }
    };

    const scheduleNextCaptcha = async () => {
        if (isCaptchaActive) return;

        const delay = Math.random() * (maxInterval - minInterval) + minInterval;
        console.log(
            `[Boredom Engine] Next YouTube captcha in ${Math.round(
                delay / 1000
            )}s`
        );

        setTimeout(async () => {
            // If we're already active (edge case), skip
            if (isCaptchaActive) return;

            isCaptchaActive = true;
            let pausedVideo: HTMLVideoElement | null = null;

            try {
                pausedVideo = pauseVideo();
                await captcha.trigger();
            } catch (e) {
                console.error("Captcha failed or cancelled", e);
            } finally {
                if (pausedVideo) {
                    resumeVideo(pausedVideo);
                }
                isCaptchaActive = false;
                console.log(
                    "[Boredom Engine] Captcha validation passed. Resuming video..."
                );
                scheduleNextCaptcha();
            }
        }, delay);
    };

    // Start the loop
    scheduleNextCaptcha();
});
