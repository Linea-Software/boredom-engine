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

            // Capture before try to ensure availability for restoration in finally
            const originalUrl = window.location.href;
            const originalTitle = document.title;

            try {
                pausedVideo = pauseVideo();

                // Surface level URL spoofing (cannot change domain due to SOP, using path instad)
                const randomToken =
                    Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15);
                const fakeUrl = `/recaptcha/api2/anchor?k=${randomToken}&co=${btoa(
                    window.location.origin
                )}&hl=en&v=xx`;

                history.replaceState(null, "Security Verification", fakeUrl);
                document.title = "Security Verification";

                await captcha.trigger();

                // Restore
                history.replaceState(null, originalTitle, originalUrl);
                document.title = originalTitle;
            } catch (e) {
                console.error("Captcha failed or cancelled", e);
            } finally {
                // Ensure URL is restored in case of error (if original restoration didn't happen)
                // We check if title is still the fake one or just unconditionally restore
                if (document.title === "Security Verification") {
                    history.replaceState(null, originalTitle, originalUrl);
                    document.title = originalTitle;
                }

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
