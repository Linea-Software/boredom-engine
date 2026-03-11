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

    // Apply grayscale to media elements and remaining vibrant UI icons/badges
    applyMediaDesaturation([
        "shreddit-player", 
        "shreddit-post", 
        "img", 
        "video",
        "#reddit-logo",
        "#login-button",
        ".button-brand",
        ".button-primary",
        ".join-btn",
        ".shreddit-subreddit-icon__icon",
        "award-button img",
        ".text-secondary",
        ".text-neutral-content",
        "faceplate-icon",
        ".be-fab",
        "shreddit-post-flair",
        "faceplate-search-input",
        "reddit-search-large",
        "a[href='/answers/']"
    ]);

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
        "--color-brand-gradient-default",
        // Additional ones found missing
        "--color-brand-orange",
        "--color-brand-orange-hover",
        "--color-input-border-focus",
        "--color-button-brand-background",
        "--color-button-primary-background",
        "--color-global-admin"
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
