// ⚠️ UNUSED (development-only): `runAsEarlyAsPossible` is a no-op kept for
// reference. No shipped script imports it — content scripts are injected
// before page scripts by the engine's MITM proxy, so "as early as possible"
// is already guaranteed. Do not rely on it for ordering.
export function runAsEarlyAsPossible(callback: () => void): void {
    callback();
}

/**
 * Executes a callback function when the document is fully loaded.
 * @param callback The function to execute when the document is loaded.
 * Yes, I took inspiration from Svelte's onMount.
 */
export function onDOMLoaded(callback: () => void): void {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback);
    } else {
        callback();
    }
}

/**
 * Retrieves the first HTML element matching the given XPath.
 * @param xpath The XPath string.
 * @returns The matching HTMLElement or null.
 */
export function getElementByXpath(xpath: string): HTMLElement | null {
    const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
    );
    return result.singleNodeValue as HTMLElement | null;
}
