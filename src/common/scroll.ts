import { Intensity, getIntensity } from "./intensity";
import { onDOMLoaded } from "./dom";
import { injectCss } from "./styling";

/**
 * Limits the scrolling depth on a page based on the current intensity.
 * @param vhMultiplierMap Optional map to override default VH multipliers for different intensities.
 */
export function limitScrolling(vhMultiplierMap?: Partial<Record<Intensity, number>>) {
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

    const multiplier = vhMultiplierMap?.[intensity] ?? DEFAULT_LIMITS[intensity];
    
    onDOMLoaded(() => {
        let maxScroll = window.innerHeight * multiplier;
        let limitReached = false;

        const enforceLimit = () => {
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
                window.scrollTo(0, maxScroll);
            }
        };

        window.addEventListener("scroll", enforceLimit, { passive: false });
        window.addEventListener("touchmove", enforceLimit, { passive: false });
        
        // Periodically check in case of dynamic content or programmatic scrolls
        setInterval(enforceLimit, 500);
        
        // Handle resize
        window.addEventListener("resize", () => {
            if (!limitReached) {
                maxScroll = window.innerHeight * multiplier;
            }
        });
    });
}
