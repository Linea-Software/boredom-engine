/**
 * @id youtube_grayscale
 * @name YouTube Grayscale
 * @description Turns YouTube video players and Shorts grayscale to reduce visual stimulation.
 * @version 1.2.0
 */
import { onDOMLoaded, applyMediaDesaturation, injectCss, getIntensity, Intensity } from "$common";

const VIDEO_GRAYSCALE: Record<Intensity, number> = {
    [Intensity.None]: 0,
    [Intensity.Low]: 30,
    [Intensity.Medium]: 50,
    [Intensity.High]: 80,
    [Intensity.Extreme]: 100,
};
const MEDIA_SATURATION: Record<Intensity, number> = {
    [Intensity.None]: 100,
    [Intensity.Low]: 70,
    [Intensity.Medium]: 50,
    [Intensity.High]: 20,
    [Intensity.Extreme]: 0,
};

onDOMLoaded(() => {
    // The shared rule desaturates thumbnails. An inline style.filter does NOT
    // override its !important rule, so the old setGrayscale(video) loop never
    // achieved grayscale on the actual player. Use a later !important rule.
    applyMediaDesaturation();
    injectCss(`
        video {
            filter: grayscale(var(--boredom-youtube-grayscale, 0%)) !important;
        }
    `);

    const refresh = () => {
        const root = document.documentElement;
        if (!root) return;
        const intensity = getIntensity();
        root.style.setProperty("--boredom-saturate", `${MEDIA_SATURATION[intensity]}%`);
        root.style.setProperty("--boredom-youtube-grayscale", `${VIDEO_GRAYSCALE[intensity]}%`);
    };

    refresh();
    window.addEventListener("boredom-engine:intensitychange", refresh);
});
