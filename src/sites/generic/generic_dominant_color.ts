/**
 * @id generic-dominant-color
 * @name Generic Dominant Color
 * @description Extracts the dominant color from the site on startup and sends it to the engine.
 * @version 1.0.0
 * @type usage
 */

import { onDOMLoaded, sendUsageReport } from "$common";
import { getColorSync } from "colorthief";

/**
 * Extracts the most representative color from the current page.
 * Strategy:
 * 1. Find the largest loaded image that isn't too large (likely a logo or hero).
 * 2. Fallback to the favicon if no images are accessible due to CORS.
 * 3. Send the result to the Boredom Engine.
 */
async function syncSiteThemeColor(): Promise<void> {
    console.debug("[Boredom Engine] Starting dominant color extraction...");

    let dominantColorHex: string | null = null;

    // 1. Gather all images already in the DOM
    const images = Array.from(document.querySelectorAll("img"))
        .filter((img) => img.complete && img.naturalWidth > 10 && img.src)
        .sort(
            (a, b) =>
                b.naturalWidth * b.naturalHeight -
                a.naturalWidth * a.naturalHeight
        );

    // 2. Try to extract from the largest images first
    for (const img of images.slice(0, 5)) {
        try {
            const color = getColorSync(img);
            dominantColorHex = color ? color.hex() : null;
            if (dominantColorHex) break;
        } catch (e) {
            // Likely a CORS security error because the image is on another domain
            // without Access-Control-Allow-Origin: *
            continue;
        }
    }

    // 3. If no images worked (CORS), try to fetch the favicon and extract from it
    if (!dominantColorHex) {
        const favicon = document.querySelector(
            'link[rel~="icon"]'
        ) as HTMLLinkElement;
        if (favicon && favicon.href) {
            try {
                const img = new Image();
                // Request anonymous CORS to try to read pixels
                img.crossOrigin = "anonymous";
                img.src = favicon.href;

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    // Timeout after 3 seconds
                    setTimeout(reject, 3000);
                });

                const color = getColorSync(img);
                dominantColorHex = color ? color.hex() : null;
            } catch (e) {
                console.debug(
                    "[Boredom Engine] Could not extract color from favicon:",
                    e
                );
            }
        }
    }

    // 4. Send to engine if found
    if (dominantColorHex) {
        console.log(
            `[Boredom Engine] Site dominant color: ${dominantColorHex}`
        );
        await sendUsageReport("theme", {
            dominantColor: dominantColorHex,
        });
    } else {
        console.debug(
            "[Boredom Engine] No accessible dominant color found on this site."
        );
    }
}

// Wait for the page to be somewhat stable
onDOMLoaded(() => {
    // We delay slightly to allow images/favicon to load if they were added late
    setTimeout(syncSiteThemeColor, 1500);
});
