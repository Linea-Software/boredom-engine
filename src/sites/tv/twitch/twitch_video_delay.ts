/**
 * @id twitch_video_delay
 * @name Twitch Video Delay
 * @description Adds random buffering/delays to Twitch streams to interrupt the dopamine loop.
 * @version 1.0.0
 */
import { onDOMLoaded } from "$common";

const BUFFER_DELAY_DURATION_MS = 1500;

const BUFFER_DELAY_PROBABILITY = 0.1;

onDOMLoaded(() => {

    const processedVideos = new WeakSet<HTMLVideoElement>();

    setInterval(() => {
        const videos = document.querySelectorAll("video");

        videos.forEach((video) => {
            if (processedVideos.has(video)) return;
            processedVideos.add(video);

            let isBuffering = false;

            const triggerBuffer = () => {
                if (isBuffering || video.paused) return;

                if (Math.random() < BUFFER_DELAY_PROBABILITY) {
                    isBuffering = true;
                    video.pause();

                    // Twitch often has a native spinner or we can just leave it paused
                    const delay = BUFFER_DELAY_DURATION_MS * (1 + Math.random());
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
