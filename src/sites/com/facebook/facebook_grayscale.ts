/**
 * @id facebook_grayscale
 * @name Facebook Grayscale
 * @description Desaturates Facebook media to reduce visual stimulation and dopamine response.
 * @version 1.0.0
 */
import { onDOMLoaded, applyMediaDesaturation, setGrayscale } from "$common";

onDOMLoaded(() => {
    

    applyMediaDesaturation();

    // Enforce grayscale on video elements specifically (Facebook video player)
    if (
        window.location.pathname.startsWith("/watch") ||
        window.location.pathname.startsWith("/reel") ||
        window.location.pathname.includes("/videos/")
    ) {
        setInterval(() => {
            const video = document.querySelector("video");
            if (video) {
                setGrayscale(video);
            }
        }, 1000);
    }
});
