/**
 * @name Random Captcha
 * @description Randomly triggers a captcha to annoy the user.
 * @version 1.0.0
 */

import { onMount } from "$common";
import { FakeCaptcha } from "$common/captcha";

onMount(() => {
    const captcha = new FakeCaptcha();

    let isCaptchaActive = false;

    const scheduleNextCaptcha = async () => {
        if (isCaptchaActive) return;

        isCaptchaActive = true;
        try {
            await captcha.trigger();
        } catch (e) {
            console.error("Captcha failed or cancelled", e);
        } finally {
            isCaptchaActive = false;
            console.log("[Boredom Engine] Captcha validation passed.");
        }
    };

    // Start the loop
    scheduleNextCaptcha();
});
