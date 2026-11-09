import { onDOMLoaded } from "./dom";

/** Limit scrolling to one and a half viewport heights when this action is enabled. */
export function limitScrolling(vhMultiplier = 1.5): void {
    onDOMLoaded(() => {

        let maxScroll = window.innerHeight * vhMultiplier;
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
            maxScroll = window.innerHeight * vhMultiplier;

            // Keep the cap consistent when the viewport changes.
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
