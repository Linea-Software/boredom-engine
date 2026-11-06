import { Intensity, getIntensity } from "./intensity";
import { onDOMLoaded } from "./dom";

const DEFAULT_LIMITS: Record<Intensity, number> = {
    [Intensity.None]: Infinity,
    [Intensity.Low]: 5,
    [Intensity.Medium]: 3,
    [Intensity.High]: 1.5,
    [Intensity.Extreme]: 0.5,
};

/**
 * Limits scrolling depth by intensity, including live changes from/to None.
 * The rAF loop is suspended while the tab is hidden.
 */
export function limitScrolling(
    vhMultiplierMap?: Partial<Record<Intensity, number>>,
): void {
    onDOMLoaded(() => {
        const multiplier = () =>
            vhMultiplierMap?.[getIntensity()] ?? DEFAULT_LIMITS[getIntensity()];
        let maxScroll = window.innerHeight * multiplier();
        let isScrollingBack = false;
        let animationId: number | null = null;
        let isVisible = !document.hidden;
        let limitReached = false;

        const styleId = "boredom-scroll-limit-style";
        const removeLimit = () => {
            document.getElementById(styleId)?.remove();
            limitReached = false;
        };

        const enforceLimit = () => {
            if (isScrollingBack || !Number.isFinite(maxScroll)) return;
            if (window.scrollY <= maxScroll) return;

            if (!limitReached) {
                limitReached = true;
                const style = document.createElement("style");
                style.id = styleId;
                style.textContent = `
                    body, html {
                        max-height: ${maxScroll + window.innerHeight}px !important;
                        overflow: hidden !important;
                    }
                `;
                document.head.appendChild(style);
            }

            isScrollingBack = true;
            window.scrollTo(0, maxScroll);
            setTimeout(() => {
                isScrollingBack = false;
            }, 0);
        };

        const refreshLimit = () => {
            const previousMax = maxScroll;
            maxScroll = window.innerHeight * multiplier();

            // Relaxation or disablement must restore page overflow. The old
            // style otherwise keeps the page locked even at intensity None.
            if (!Number.isFinite(maxScroll) || maxScroll > previousMax) {
                removeLimit();
            } else if (limitReached) {
                const style = document.getElementById(styleId);
                if (style) {
                    style.textContent = `
                        body, html {
                            max-height: ${maxScroll + window.innerHeight}px !important;
                            overflow: hidden !important;
                        }
                    `;
                }
            }
            enforceLimit();
        };

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
            if (isVisible) animationId = requestAnimationFrame(scheduleFrame);
        };

        const stopLoop = () => {
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        };

        window.addEventListener("scroll", enforceLimit, { passive: true });
        window.addEventListener("touchmove", enforceLimit, { passive: true });
        window.addEventListener("boredom-engine:intensitychange", refreshLimit);
        window.addEventListener("resize", refreshLimit);

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                isVisible = false;
                stopLoop();
            } else {
                startLoop();
            }
        });

        startLoop();
    });
}
