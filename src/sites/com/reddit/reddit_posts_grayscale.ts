/**
 * @id reddit_posts_grayscale
 * @name Reddit Posts Grayscale
 * @description Makes Reddit media grayscale to reduce dopamine.
 * @version 1.0.0
 */
import {
    onDOMLoaded,
    applyMediaDesaturation,
    setCssVariablesToGray,
    currentIntensityHigherThan,
    Intensity,
} from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }
    applyMediaDesaturation(["shreddit-player"]);

    setCssVariablesToGray(["--color-global-orangered"]);
});
