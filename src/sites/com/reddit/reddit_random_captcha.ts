/**
 * @id reddit_random_captcha
 * @name Reddit Random Captcha
 * @description Randomly triggers a captcha to annoy the user while browsing Reddit.
 * @version 1.0.0
 */

import { onDOMLoaded } from "$common";
import { FakeCaptcha } from "$common/captcha";

onDOMLoaded(() => {
    

    const minInterval = 2 * 60 * 1000; // 2 minutes
    const maxInterval = 5 * 60 * 1000; // 5 minutes

    const captcha = new FakeCaptcha();
    let isCaptchaActive = false;

    const scheduleNextCaptcha = async (forceDelay?: number) => {
        if (isCaptchaActive) return;

        const delay =
            forceDelay !== undefined
                ? forceDelay
                : Math.random() * (maxInterval - minInterval) + minInterval;
        
        console.log(`[Boredom Engine] Next Reddit captcha in ${Math.round(delay / 1000)}s`);

        setTimeout(async () => {
            if (isCaptchaActive) return;

            isCaptchaActive = true;
            document.body.dataset.boredomCaptchaActive = "true";

            try {
                await captcha.trigger();
            } catch (e) {
                console.error("Captcha failed or cancelled", e);
            } finally {
                isCaptchaActive = false;
                delete document.body.dataset.boredomCaptchaActive;
                
                console.log("[Boredom Engine] Captcha validation passed.");
                scheduleNextCaptcha();
            }
        }, delay);
    };

    scheduleNextCaptcha(5000); // Start after 5 seconds to be annoying
});
