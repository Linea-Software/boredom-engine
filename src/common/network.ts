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
 * Intercepts fetch requests and downgrades images.
 * @param quality The quality of the image (0-1).
 */
export function downgradeFetchImages(quality: number): void {
    const originalFetch = window.fetch;

    window.fetch = Object.assign(
        async (
            input: RequestInfo | URL,
            init?: RequestInit
        ): Promise<Response> => {
            const response = await originalFetch(input, init);

            const contentType = response.headers.get("content-type");
            if (!response.ok || !contentType?.startsWith("image/")) {
                return response;
            }

            // Clone to avoid consuming the original response body if processing fails
            const clone = response.clone();

            try {
                const blob = await clone.blob();
                const bitmap = await createImageBitmap(blob);

                const width = bitmap.width;
                const height = bitmap.height;

                let newBlob: Blob | null = null;

                if (typeof OffscreenCanvas !== "undefined") {
                    const canvas = new OffscreenCanvas(width, height);
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(bitmap, 0, 0);
                        newBlob = await canvas.convertToBlob({
                            type: "image/jpeg",
                            quality: quality,
                        });
                    }
                } else {
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(bitmap, 0, 0);
                        newBlob = await new Promise((resolve) =>
                            canvas.toBlob(resolve, "image/jpeg", quality)
                        );
                    }
                }

                if (newBlob) {
                    return new Response(newBlob, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers,
                    });
                }
            } catch (error) {
                console.warn(
                    "Boredom Engine: Failed to downgrade image",
                    error
                );
            }

            return response;
        },
        originalFetch
    );
}
