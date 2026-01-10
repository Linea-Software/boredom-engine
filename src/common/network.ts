/**
 * Adds a delay to network requests.
 * @param delay The delay in milliseconds.
 */
export function addDelayToNetwork(delay: number): void {
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

    const originalXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (
        body?: Document | XMLHttpRequestBodyInit | null
    ) {
        setTimeout(() => {
            originalXhrSend.call(this, body);
        }, delay);
    };
}

/**
 * Adds packet loss to the fetch request.
 * @param percentage The percentage of packet loss (0-100).
 */
export function addPacketLossToNetwork(percentage: number): void {
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

    const originalXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (
        body?: Document | XMLHttpRequestBodyInit | null
    ) {
        const random = Math.random() * 100;
        if (random < percentage) {
            Object.defineProperties(this, {
                status: { get: () => 500 },
                statusText: { get: () => "Internal Server Error" },
                readyState: { get: () => 4 },
                responseText: { get: () => "" },
                response: { get: () => "" },
            });
            // Trigger state changes
            this.dispatchEvent(new Event("readystatechange"));
            this.dispatchEvent(new ProgressEvent("load"));
            this.dispatchEvent(new ProgressEvent("loadend"));
            return;
        }
        originalXhrSend.call(this, body);
    };
}

/**
 * Blocks all fetch requests.
 */
export function blockNetworkRequests() {
    const originalFetch = window.fetch;

    window.fetch = Object.assign(
        async (
            input: RequestInfo | URL,
            init?: RequestInit
        ): Promise<Response> => {
            return new Response("", {
                status: 404,
                statusText: "Not Found",
            });
        },
        originalFetch
    );

    const originalXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (
        body?: Document | XMLHttpRequestBodyInit | null
    ) {
        Object.defineProperties(this, {
            status: { get: () => 404 },
            statusText: { get: () => "Not Found" },
            readyState: { get: () => 4 },
            responseText: { get: () => "" },
            response: { get: () => "" },
        });
        this.dispatchEvent(new Event("readystatechange"));
        this.dispatchEvent(new ProgressEvent("error")); // Or load with 404
        this.dispatchEvent(new ProgressEvent("loadend"));
    };
}
