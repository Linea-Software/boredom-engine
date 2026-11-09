/**
 * @id instagram_random_captcha
 * @name Instagram Random Captcha
 * @description Randomly triggers a captcha to annoy the user while browsing Instagram.
 * @version 1.0.0
 */

import { onDOMLoaded } from "$common";
import { FakeCaptcha } from "$common/captcha";

onDOMLoaded(() => {
    

    const minInterval = 2 * 60 * 1000; // 2 minutes
    const maxInterval = 5 * 60 * 1000; // 5 minutes

    const captcha = new FakeCaptcha();

    let isCaptchaActive = false;

    const pauseMedia = () => {
        const videos = document.querySelectorAll("video");
        videos.forEach(v => {
            if (!v.paused) v.pause();
        });
    };

    const scheduleNextCaptcha = async (forceDelay?: number) => {
        if (isCaptchaActive) return;

        const delay =
            forceDelay !== undefined
                ? forceDelay
                : Math.random() * (maxInterval - minInterval) + minInterval;
        
        console.log(
            `[Boredom Engine] Next Instagram captcha in ${Math.round(
                delay / 1000,
            )}s`,
        );

        setTimeout(async () => {
            if (isCaptchaActive) return;

            isCaptchaActive = true;
            document.body.dataset.boredomCaptchaActive = "true";

            // Capture state
            const originalUrl = window.location.href;
            const originalTitle = document.title;

            try {
                pauseMedia();

                // Fake URL for captcha
                const randomToken = Math.random().toString(36).substring(2, 15);
                const fakeUrl = `/security/captcha?token=${randomToken}`;

                history.replaceState(null, "Security Verification", fakeUrl);
                document.title = "Security Verification";

                await captcha.trigger();

                // Restore
                history.replaceState(null, originalTitle, originalUrl);
                document.title = originalTitle;
            } catch (e) {
                console.error("Captcha failed or cancelled", e);
            } finally {
                if (document.title === "Security Verification") {
                    history.replaceState(null, originalTitle, originalUrl);
                    document.title = originalTitle;
                }

                isCaptchaActive = false;
                delete document.body.dataset.boredomCaptchaActive;

                console.log(
                    "[Boredom Engine] Captcha validation passed. Resuming...",
                );
                scheduleNextCaptcha();
            }
        }, delay);
    };

    // Start the loop
    scheduleNextCaptcha(15000); // 15s after load
});
