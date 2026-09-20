import { FakeCaptcha } from "./captcha";
import { onDOMLoaded } from "./dom";
import { currentIntensityHigherThan, Intensity } from "./intensity";

export interface RandomCaptchaOptions {
    siteName: string;
    minimumIntensity?: Intensity;
    minIntervalMs?: number;
    maxIntervalMs?: number;
    initialDelayMs?: number;
}

/**
 * Schedules the same opt-in friction used by existing site-specific CAPTCHA scripts.
 * Kept outside the common barrel so ordinary scripts do not pull Lit/CAPTCHA code
 * into bundles unless they explicitly use this feature.
 */
export function scheduleRandomCaptcha({
    siteName,
    minimumIntensity = Intensity.Medium,
    minIntervalMs = 2 * 60 * 1000,
    maxIntervalMs = 5 * 60 * 1000,
    initialDelayMs = 15_000,
}: RandomCaptchaOptions): void {
    onDOMLoaded(() => {
        if (!currentIntensityHigherThan(minimumIntensity)) return;

        const captcha = new FakeCaptcha();
        let active = false;

        const pauseMedia = () => {
            document.querySelectorAll("video, audio").forEach((element) => {
                if (element instanceof HTMLMediaElement && !element.paused) element.pause();
            });
        };

        const schedule = (forcedDelay?: number) => {
            if (active) return;
            const delay =
                forcedDelay ??
                Math.random() * (maxIntervalMs - minIntervalMs) + minIntervalMs;

            window.setTimeout(async () => {
                if (active) return;
                active = true;
                document.body.dataset.boredomCaptchaActive = "true";

                const originalUrl = window.location.href;
                const originalTitle = document.title;
                let spoofed = false;

                try {
                    pauseMedia();
                    try {
                        history.replaceState(
                            null,
                            "Security Verification",
                            "/security/captcha?token=[REDACTED_SECRET]",
                        );
                        spoofed = true;
                    } catch {
                        // Some opaque origins (notably file:// fixtures) reject replaceState.
                    }
                    document.title = "Security Verification";
                    await captcha.trigger();
                } finally {
                    if (spoofed) {
                        try {
                            history.replaceState(null, originalTitle, originalUrl);
                        } catch {
                            // Navigation may have changed while the friction overlay was open.
                        }
                    }
                    document.title = originalTitle;
                    active = false;
                    delete document.body.dataset.boredomCaptchaActive;
                    console.log(`[Boredom Engine] ${siteName} CAPTCHA completed.`);
                    schedule();
                }
            }, delay);
        };

        schedule(initialDelayMs);
    });
}
