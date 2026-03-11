/**
 * @id reddit_grayscale
 * @name Reddit Grayscale
 * @description Makes Reddit media and vibrant UI colors grayscale to reduce dopamine.
 * @version 1.0.1
 */
import {
    onDOMLoaded,
    applyMediaDesaturation,
    setCssVariablesToGray,
    currentIntensityHigherThan,
    Intensity,
    getIntensity
} from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    // Apply grayscale to media elements
    applyMediaDesaturation(["shreddit-player", "shreddit-post", "img", "video"]);

    const vibrantVariables = [
        "--color-global-orangered",
        "--color-brand-background",
        "--shreddit-color-wordmark",
        "--color-action-upvote",
        "--color-upvote-background",
        "--color-upvote-content",
        "--color-action-downvote",
        "--color-downvote-background",
        "--color-downvote-content",
        "--color-primary-background",
        "--color-action-primary",
        "--color-a-default",
        "--color-online",
        "--color-category-nsfw",
        "--color-success-background",
        "--color-danger-background",
        "--color-brand-gradient-default"
    ];

    const GRAY_LEVELS: Record<Intensity, string> = {
        [Intensity.None]: "", // Not used
        [Intensity.Low]: "#aaaaaa",
        [Intensity.Medium]: "#888888",
        [Intensity.High]: "#666666",
        [Intensity.Extreme]: "#444444",
    };

    const targetGray = GRAY_LEVELS[getIntensity()];

    setCssVariablesToGray(vibrantVariables, targetGray);
});
