/**
 * Injects a CSS string into the document head.
 * @param css The CSS string to inject.
 */
export function injectCss(css: string): void {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
}

/**
 * Sets the grayscale filter on a given HTML element.
 * @param element The HTML element to apply the filter to.
 * @param percentage The percentage of grayscale to apply (0-100).
 */
export function setGrayscale(element: HTMLElement, percentage: number): void {
    element.style.filter = `grayscale(${percentage}%)`;
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
    const selectors = ["video", "img", ...additionalSelectors];
    const css = `
        :root {
            --boredom-saturate: 20%;
        }
        ${selectors.join(",\n        ")} {
            filter: ${COMMON_MEDIA_FILTER} !important;
        }
    `;
    injectCss(css);
}

/**
 * Enforces CSS variables on the document element with !important priority.
 * Uses a MutationObserver to ensure they persist if overridden by the site.
 * @param variables Object mapping variable names to their values
 */
export function enforceCssVariables(variables: Record<string, string>): void {
    const root = document.documentElement;

    const apply = () => {
        for (const [key, val] of Object.entries(variables)) {
            if (root.style.getPropertyValue(key) !== val) {
                root.style.setProperty(key, val, "important");
            }
        }
    };

    // Apply immediately
    apply();

    // Persist changes
    const observer = new MutationObserver(() => apply());
    observer.observe(root, {
        attributes: true,
        attributeFilter: ["style"],
    });
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
