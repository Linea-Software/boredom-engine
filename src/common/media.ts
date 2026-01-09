import { injectCss, COMMON_MEDIA_FILTER } from "./styling";

/**
 * Adds a delay to the audio playback of a media element.
 * @param element The media element (video or audio) to delay.
 * @param delaySeconds The delay in seconds.
 */
export function setAudioDelay(
    element: HTMLMediaElement,
    delaySeconds: number
): AudioContext | undefined {
    try {
        const AudioContext =
            window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
            console.error("AudioContext not supported in this browser.");
            return;
        }

        const ctx = new AudioContext();
        const source = ctx.createMediaElementSource(element);
        const delayNode = ctx.createDelay(Math.max(delaySeconds + 1, 5.0)); // Ensure enough buffer
        delayNode.delayTime.value = delaySeconds;

        source.connect(delayNode);
        delayNode.connect(ctx.destination);

        // Sync audio state with video play/pause
        const updateState = () => {
            if (element.paused && ctx.state === "running") {
                ctx.suspend();
            } else if (!element.paused && ctx.state === "suspended") {
                ctx.resume();
            }
        };

        element.addEventListener("pause", updateState);
        element.addEventListener("play", updateState);

        // Initial state check
        updateState();

        console.log(`Audio delayed by ${delaySeconds}s.`);
        return ctx;
    } catch (error) {
        console.error(
            "Failed to set audio delay (likely CORS or already connected):",
            error
        );
        return undefined;
    }
}

/**
 * Downgrades videos by applying a CSS blur filter.
 * This relies on the browser's built-in rendering engine (CSS) rather than a canvas overlay.
 * @param quality Quality multiplier (0-1). 1 is perfect, 0 is max blur.
 */
export function downgradeVideos(quality: number): void {
    const blurPx = (1 - quality) * 20; // Scale 0-1 to 0-20px blur
    injectCss(`
        :root {
            --boredom-blur: ${blurPx}px;
        }
        video {
            filter: ${COMMON_MEDIA_FILTER} !important;
        }
    `);
}
