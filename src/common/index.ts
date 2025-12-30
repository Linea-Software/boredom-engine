/**
 * Executes a callback function when the document is fully loaded.
 * @param callback The function to execute when the document is loaded.
 * Yes, I took inspiration from Svelte's onMount.
 */
export function onMount(callback: () => void): void {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback);
    } else {
        callback();
    }
}

/**
 * Adds a delay to the fetch request.
 * @param delay The delay in milliseconds.
 */
export function addDelayToFetch(delay: number): void {
    const originalFetch = window.fetch;

    window.fetch = Object.assign(
        async (
            input: RequestInfo | URL,
            init?: RequestInit
        ): Promise<Response> => {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return originalFetch(input, init);
        },
        originalFetch
    );
}

/**
 * Adds packet loss to the fetch request.
 * @param percentage The percentage of packet loss (0-100).
 */
export function addPacketLossToFetch(percentage: number): void {
    const originalFetch = window.fetch;

    window.fetch = Object.assign(
        async (
            input: RequestInfo | URL,
            init?: RequestInit
        ): Promise<Response> => {
            const random = Math.random() * 100;
            if (random < percentage) {
                return new Response("", {
                    status: 500,
                    statusText: "Internal Server Error",
                });
            }
            return originalFetch(input, init);
        },
        originalFetch
    );
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
 * Adds a delay to the audio playback of a media element.
 * @param element The media element (video or audio) to delay.
 * @param delaySeconds The delay in seconds.
 */
export function setAudioDelay(
    element: HTMLMediaElement,
    delaySeconds: number
): AudioContext | undefined {
    try {
        const AudioContext =
            window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
            console.error("AudioContext not supported in this browser.");
            return;
        }

        const ctx = new AudioContext();
        const source = ctx.createMediaElementSource(element);
        const delayNode = ctx.createDelay(Math.max(delaySeconds + 1, 5.0)); // Ensure enough buffer
        delayNode.delayTime.value = delaySeconds;

        source.connect(delayNode);
        delayNode.connect(ctx.destination);

        // Sync audio state with video play/pause
        const updateState = () => {
            if (element.paused && ctx.state === "running") {
                ctx.suspend();
            } else if (!element.paused && ctx.state === "suspended") {
                ctx.resume();
            }
        };

        element.addEventListener("pause", updateState);
        element.addEventListener("play", updateState);

        // Initial state check
        updateState();

        console.log(`Audio delayed by ${delaySeconds}s.`);
        return ctx;
    } catch (error) {
        console.error(
            "Failed to set audio delay (likely CORS or already connected):",
            error
        );
        return undefined;
    }
}

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
        null
    );
    return result.singleNodeValue as HTMLElement | null;
}

/**
 * Applies grayscale filter to media elements using CSS injection.
 * @param additionalSelectors Optional array of additional CSS selectors to apply grayscale to.
 */
export function applyMediaGrayscale(additionalSelectors: string[] = []): void {
    const selectors = ["video", "img", ...additionalSelectors];
    const css = `
        ${selectors.join(",\n        ")} {
            filter: grayscale(100%) !important;
        }
    `;
    injectCss(css);
}
