/**
 * @id netflix_playback_delay
 * @name Netflix Playback Delay
 * @description Adds a one-time intensity-scaled delay when intentional watch-page playback starts.
 * @version 1.0.0
 */
import { currentIntensityHigherThan, getIntensity, Intensity, onDOMLoaded } from "$common";

const DELAY_MS: Record<Intensity, number> = {
    [Intensity.None]: 0,
    [Intensity.Low]: 750,
    [Intensity.Medium]: 1500,
    [Intensity.High]: 3000,
    [Intensity.Extreme]: 5000,
};

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) return;

    const delayed = new WeakSet<HTMLVideoElement>();
    const resuming = new WeakSet<HTMLVideoElement>();

    document.addEventListener(
        "play",
        (event) => {
            const video = event.target;
            if (!(video instanceof HTMLVideoElement)) return;
            if (!window.location.pathname.startsWith("/watch")) return;
            if (delayed.has(video) || resuming.has(video)) return;

            delayed.add(video);
            video.pause();
            window.setTimeout(() => {
                if (!video.isConnected) return;
                resuming.add(video);
                video.play().catch(() => undefined).finally(() => resuming.delete(video));
            }, DELAY_MS[getIntensity()]);
        },
        true,
    );
});
