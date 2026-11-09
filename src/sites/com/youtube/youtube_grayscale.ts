/**
 * @id youtube_grayscale
 * @name YouTube Grayscale
 * @description Turns YouTube video players and Shorts grayscale to reduce visual stimulation.
 * @version 1.2.0
 */
import { onDOMLoaded, applyMediaDesaturation, injectCss } from "$common";

const VIDEO_GRAYSCALE = 100;
const MEDIA_SATURATION = 0;

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
        root.style.setProperty("--boredom-saturate", `${MEDIA_SATURATION}%`);
        root.style.setProperty("--boredom-youtube-grayscale", `${VIDEO_GRAYSCALE}%`);
    };

    refresh();
});
