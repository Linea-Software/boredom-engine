import { getIntensity, Intensity } from "$common";

/**
 * Injects a CSS string into the document head.
 * @param css The CSS string to inject.
 */
export function injectCss(css: string): void {
    const style = document.createElement("style");
    style.textContent = css;
    // document.head may not exist at document-start timing; fall back to documentElement
    const target = document.head || document.documentElement;
    if (target) {
        target.appendChild(style);
    }
}

/**
 * Sets the grayscale filter on a given HTML element.
 * @param element The HTML element to apply the filter to.
 * @param intensity The intensity level to apply.
 */
export function setGrayscale(element: HTMLElement, intensity: Intensity): void {
    const GRAYSCALE_MAP: Record<Intensity, number> = {
        [Intensity.None]: 0,
        [Intensity.Low]: 30,
        [Intensity.Medium]: 50,
        [Intensity.High]: 80,
        [Intensity.Extreme]: 100,
    };

    element.style.filter = `grayscale(${GRAYSCALE_MAP[intensity]}%)`;
}

// Shared filter string to allowing stacking of effects (saturation + blur)
export const COMMON_MEDIA_FILTER =
    "saturate(var(--boredom-saturate, 100%)) blur(var(--boredom-blur, 0px))";

/**
 * Applies grayscale/desaturation filter to media elements using CSS injection.
 * @param additionalSelectors Optional array of additional CSS selectors to apply grayscale to.
 */
export function applyMediaDesaturation(
    additionalSelectors: string[] = [],
): void {
    const DESATURATION_MAP: Record<Intensity, number> = {
        [Intensity.None]: 100,
        [Intensity.Low]: 70,
        [Intensity.Medium]: 50,
        [Intensity.High]: 20,
        [Intensity.Extreme]: 0,
    };
    const selectors = ["video", "img", ...additionalSelectors];
    const css = `
        :root {
            --boredom-saturate: ${DESATURATION_MAP[getIntensity()]}%;
        }
        ${selectors.join(",\n        ")} {
            filter: ${COMMON_MEDIA_FILTER} !important;
        }
    `;
    injectCss(css);
}

// ---------------------------------------------------------------------------
// Singleton observer for enforceCssVariables — merges multiple callers into a
// single MutationObserver instead of leaking one per invocation.
// ---------------------------------------------------------------------------

let cssVarObserver: MutationObserver | null = null;
const enforcedCssVariables: Record<string, string> = {};

function getOrCreateCssVarObserver(): MutationObserver {
    if (cssVarObserver) return cssVarObserver;

    const root = document.documentElement;

    const applyAll = () => {
        for (const [key, val] of Object.entries(enforcedCssVariables)) {
            if (root.style.getPropertyValue(key) !== val) {
                root.style.setProperty(key, val, "important");
            }
        }
    };

    cssVarObserver = new MutationObserver(() => applyAll());
    cssVarObserver.observe(root, {
        attributes: true,
        attributeFilter: ["style"],
    });

    return cssVarObserver;
}

/**
 * Enforces CSS variables on the document element with !important priority.
 * Uses a single shared MutationObserver so multiple callers don't leak
 * observers.
 * @param variables Object mapping variable names to their values
 */
export function enforceCssVariables(variables: Record<string, string>): void {
    // Merge variables into the shared set
    Object.assign(enforcedCssVariables, variables);

    // Apply immediately
    const root = document.documentElement;
    for (const [key, val] of Object.entries(variables)) {
        if (root.style.getPropertyValue(key) !== val) {
            root.style.setProperty(key, val, "important");
        }
    }

    // Ensure the singleton observer is watching
    getOrCreateCssVarObserver();
}

/**
 * Convenience method to force a list of CSS variables to a gray color.
 * @param variableNames List of CSS variable names (e.g. ['--primary-color'])
 * @param grayValue The color value to set (default: "128, 128, 128")
 */
export function setCssVariablesToGray(
    variableNames: string[],
    grayValue: string = "gray",
): void {
    const vars: Record<string, string> = {};
    for (const name of variableNames) {
        vars[name] = grayValue;
    }
    enforceCssVariables(vars);
}
