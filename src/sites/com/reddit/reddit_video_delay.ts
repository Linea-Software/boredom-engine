/**
 * @id reddit_video_delay
 * @name Reddit Video Delay
 * @description Delays the start of videos on Reddit to train patience.
 * @version 1.0.0
 */

import {
    onDOMLoaded,
    currentIntensityHigherThan,
    Intensity,
    getIntensity
} from "$common";

const BUFFER_DELAY_DURATION_MAP: Record<Intensity, number> = {
    [Intensity.None]: 0,
    [Intensity.Low]: 750,
    [Intensity.Medium]: 1500,
    [Intensity.High]: 3000,
    [Intensity.Extreme]: 5000,
};

const BUFFER_DELAY_RANDOM_MAP: Record<Intensity, number> = {
    [Intensity.None]: 0,
    [Intensity.Low]: 0.05,
    [Intensity.Medium]: 0.1,
    [Intensity.High]: 0.2,
    [Intensity.Extreme]: 0.4,
};

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }
    
    const processedVideos = new WeakSet<HTMLVideoElement>();

    setInterval(() => {
        const videos = document.querySelectorAll("video");

        videos.forEach((video) => {
            if (processedVideos.has(video)) return;
            processedVideos.add(video);

            let isBuffering = false;

            const triggerBuffer = () => {
                if (isBuffering || video.paused) return;

                if (Math.random() < BUFFER_DELAY_RANDOM_MAP[getIntensity()]) {
                    isBuffering = true;
                    video.pause();

                    const delay = BUFFER_DELAY_DURATION_MAP[getIntensity()] * (1 + Math.random());
                    setTimeout(async () => {
                        try {
                            await video.play();
                        } catch (e) {
                            // Ignore play errors
                        }
                        isBuffering = false;
                    }, delay);
                }
            };

            const interval = setInterval(() => {
                if (!video.isConnected) {
                    clearInterval(interval);
                    return;
                }
                if (!video.paused && !video.ended) {
                    triggerBuffer();
                }
            }, 1000);
        });
    }, 2000);
});
