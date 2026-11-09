/**
 * @id reddit_video_delay
 * @name Reddit Video Delay
 * @description Delays the start of videos on Reddit to train patience.
 * @version 1.0.0
 */

import { onDOMLoaded } from "$common";

const BUFFER_DELAY_DURATION_MAP = 1500;

const BUFFER_DELAY_RANDOM_MAP = 0.1;

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

                if (Math.random() < BUFFER_DELAY_RANDOM_MAP) {
                    isBuffering = true;
                    video.pause();

                    const delay = BUFFER_DELAY_DURATION_MAP * (1 + Math.random());
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
