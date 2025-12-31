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

/**
 * Applies grayscale filter to media elements using CSS injection.
 * @param additionalSelectors Optional array of additional CSS selectors to apply grayscale to.
 */
export function applyMediaGrayscale(additionalSelectors: string[] = []): void {
    const selectors = ["video", "img", ...additionalSelectors];
    const css = `
        ${selectors.join(",\n        ")} {
            /* filter: grayscale(80%) !important; */
            filter: saturate(20%) !important;
        }
    `;
    injectCss(css);
}
