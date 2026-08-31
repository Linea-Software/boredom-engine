/**
 * @id twitch_grayscale
 * @name Twitch Grayscale
 * @description Applies a grayscale filter to Twitch thumbnails and images.
 * @version 1.0.0
 */
import {
    onDOMLoaded,
    applyMediaDesaturation,
    setCssVariablesToGray,
    getIntensity,
    currentIntensityHigherThan,
    Intensity,
} from "$common";


onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    // Apply grayscale to media elements and key UI components
    applyMediaDesaturation([
        ".video-player__container",
        ".preview-card-image-link",
        "img.tw-image",
        "img.chat-line__message--emote",
        ".chat-view",
        "a[data-a-target='logo'] svg", // Logo (data-a-target is language-agnostic)
        ".ScNumberBadge-sc-1vsczax-0", // Badges
        ".video-ref"
    ]);

    const vibrantVariables = [
        "--color-twitch-purple",
        "--color-accent",
        "--color-brand-accent-twitch-purple",
        "--color-background-accent",
        "--color-background-brand",
        "--color-background-button-brand",
        "--color-background-live",
        "--color-background-number-badge",
        "--color-fill-live",
        "--color-red-9",
        "--color-text-tab-active",
        "--color-text-link",
        "--color-text-brand"
    ];

    // Also include more generic scales if they exist
    for (const color of ["red", "green", "blue", "orange", "magenta", "cyan", "yellow"]) {
        for (let i = 1; i <= 15; i++) {
            vibrantVariables.push(`--color-${color}-${i}`);
        }
    }

    const GRAY_LEVELS: Record<Intensity, string> = {
        [Intensity.None]: "",
        [Intensity.Low]: "#aaaaaa",
        [Intensity.Medium]: "#888888",
        [Intensity.High]: "#666666",
        [Intensity.Extreme]: "#444444",
    };

    setCssVariablesToGray(vibrantVariables, GRAY_LEVELS[getIntensity()]);
});

