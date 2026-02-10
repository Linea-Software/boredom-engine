/**
 * Common module to manage the intensity of the scripts.
 *
 * EXTERNAL INTEGRATION:
 * External programs (e.g., the desktop app or browser extension) can set the intensity level
 * by defining a global variable on the window object before the scripts run.
 *
 * Target Global Variable: window.__BOREDOM_INTENSITY__
 * Expected Values: "low" | "medium" | "high" | "extreme"
 * Default: "medium"
 *
 * Example Injection (JavaScript):
 * window.__BOREDOM_INTENSITY__ = "high";
 */

export enum Intensity {
    /** Mild annoyance, still usable but degraded experience */
    Low = "low",
    /** Standard operation, noticeable degradation */
    Medium = "medium",
    /** Very annoying, significant features might be broken or heavily degraded */
    High = "high",
    /** Unusable / Maximum stress, complete blockage or extreme degradation */
    Extreme = "extreme"
}

const GLOBAL_INTENSITY_KEY = "__BOREDOM_INTENSITY__";

export function getIntensity(): Intensity {
    if (typeof window === "undefined") return Intensity.Medium;

    const value = (window as any)[GLOBAL_INTENSITY_KEY];

    // Simple validation to ensure we return a valid enum value
    // We avoid Object.values(Intensity).includes() to be safe against some
    //aggressive minification/compilation strategies that might inline enums weirdly,
    // though string enums usually persist.
    switch (value) {
        case "low": return Intensity.Low;
        case "medium": return Intensity.Medium;
        case "high": return Intensity.High;
        case "extreme": return Intensity.Extreme;
        default: return Intensity.Medium;
    }
}
