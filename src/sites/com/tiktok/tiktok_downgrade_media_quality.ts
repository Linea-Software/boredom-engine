/**
 * @id tiktok_downgrade_media_quality
 * @name TikTok Video Quality Downgrade
 * @description Forcefully downgrades the resolution of TikTok videos by overlaying a low-res canvas.
 * @version 1.0.0
 */
import { onDOMLoaded, downgradeVideos, downgradeImages, Intensity, currentIntensityHigherThan } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }
    downgradeVideos();
    downgradeImages();
});
