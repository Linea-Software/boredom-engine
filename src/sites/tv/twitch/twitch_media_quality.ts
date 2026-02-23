/**
 * @id twitch_media_quality
 * @name Twitch Media Quality Downgrade
 * @description Forcefully downgrades the resolution of Twitch videos and images to reduce dopamine stimulation.
 * @version 1.0.0
 */
import {
    onDOMLoaded,
    downgradeVideos,
    downgradeImages,
    currentIntensityHigherThan,
    Intensity,
} from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    downgradeVideos();
    downgradeImages();
});
