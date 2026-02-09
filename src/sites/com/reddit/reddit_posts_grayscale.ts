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
} from "$common";

onDOMLoaded(() => {
    applyMediaDesaturation(["shreddit-player"]);

    setCssVariablesToGray(["--color-global-orangered"]);
});
