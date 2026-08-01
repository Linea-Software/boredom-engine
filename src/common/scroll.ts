import { Intensity, getIntensity } from "./intensity";
import { onDOMLoaded } from "./dom";

/**
 * Limits the scrolling depth on a page based on the current intensity.
 * Uses requestAnimationFrame (not setInterval) and pauses when the tab is
 * not visible to avoid wasting CPU in background tabs.
 * @param vhMultiplierMap Optional map to override default VH multipliers for different intensities.
 */
export function limitScrolling(
    vhMultiplierMap?: Partial<Record<Intensity, number>>,
) {
    const intensity = getIntensity();
    if (intensity === Intensity.None) return;

    // Default multipliers for Viewport Height (VH)
    const DEFAULT_LIMITS: Record<Intensity, number> = {
        [Intensity.None]: Infinity,
        [Intensity.Low]: 5,
        [Intensity.Medium]: 3,
        [Intensity.High]: 1.5,
        [Intensity.Extreme]: 0.5,
    };

    const multiplier =
        vhMultiplierMap?.[intensity] ?? DEFAULT_LIMITS[intensity];

    onDOMLoaded(() => {
        let maxScroll = window.innerHeight * multiplier;
        let limitReached = false;
        let isScrollingBack = false;
        let animationId: number | null = null;
        let isVisible = !document.hidden;

        const enforceLimit = () => {
            // Prevent re-entrant calls: scrollTo triggers another scroll event,
            // which would otherwise cause an infinite loop and freeze the page.
            if (isScrollingBack) return;

            if (window.scrollY > maxScroll) {
                if (!limitReached) {
                    limitReached = true;
                    // Silently "kill" the page height to prevent further scrolling
                    // and potentially stop infinite loaders
                    const style = document.createElement("style");
                    style.id = "boredom-scroll-limit-style";
                    style.textContent = `
                        body, html {
                            max-height: ${maxScroll + window.innerHeight}px !important;
                            overflow: hidden !important;
                        }
                    `;
                    document.head.appendChild(style);
                }

                // Force scroll back to the limit
                isScrollingBack = true;
                window.scrollTo(0, maxScroll);
                // Reset the guard on the next microtask so future scrolls (user or programmatic) work
                setTimeout(() => {
                    isScrollingBack = false;
                }, 0);
            }
        };

        // Use rAF loop instead of setInterval — respects background tabs
        // (browsers throttle rAF to ~1 fps when the tab is hidden).
        const scheduleFrame = () => {
            if (!isVisible) {
                animationId = null;
                return;
            }
            enforceLimit();
            animationId = requestAnimationFrame(scheduleFrame);
        };

        const startLoop = () => {
            if (animationId !== null) return;
            isVisible = !document.hidden;
            animationId = requestAnimationFrame(scheduleFrame);
        };

        const stopLoop = () => {
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        };

        // Scroll / touch listeners still needed for immediate response
        window.addEventListener("scroll", enforceLimit, { passive: false });
        window.addEventListener("touchmove", enforceLimit, { passive: false });

        // Pause the polling loop when the tab is hidden
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                isVisible = false;
                stopLoop();
            } else {
                startLoop();
            }
        });

        // Handle resize
        window.addEventListener("resize", () => {
            if (!limitReached) {
                maxScroll = window.innerHeight * multiplier;
            }
        });

        // Start the rAF loop
        startLoop();
    });
}
