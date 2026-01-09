/**
 * @name TikTok Video Delay
 * @description Adds random buffering/delays to TikTok videos to interrupt the dopamine loop.
 * @version 1.0.0
 */
import { onMount, getElementByXpath, injectCss } from "$common";

onMount(() => {
    // Inject spinner styles
    injectCss(`
        .boredom-tiktok-spinner {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 50px;
            height: 50px;
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-top: 5px solid #fff;
            border-radius: 50%;
            animation: boredom-spin 1s linear infinite;
            z-index: 2147483647;
            pointer-events: none;
            display: none;
        }
        @keyframes boredom-spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
    `);

    const processedVideos = new WeakSet<HTMLVideoElement>();

    setInterval(() => {
        // Attempt to find the specific video context from the user's provided XPath
        // //*[@id="media-card-8"]/div/div[1]/div[1]/span/picture/img
        // The user provided XPath targets an image, but it likely represents the video container/preview.
        // We will look for <video> elements on the page generally, as TikTok is an SPA.

        const videos = document.querySelectorAll("video");

        videos.forEach((video) => {
            if (processedVideos.has(video)) return;
            processedVideos.add(video);

            // Add a spinner element to the video's parent
            const spinner = document.createElement("div");
            spinner.className = "boredom-tiktok-spinner";
            if (video.parentElement) {
                const parentStyle = window.getComputedStyle(
                    video.parentElement
                );
                if (parentStyle.position === "static") {
                    video.parentElement.style.position = "relative";
                }
                video.parentElement.appendChild(spinner);
            }

            let isBuffering = false;

            const triggerBuffer = () => {
                if (isBuffering || video.paused) return;

                // 20% chance every check to buffer
                // The check runs every 1s, so 5% probability per second is roughly equal to checks
                if (Math.random() < 0.05) {
                    isBuffering = true;
                    video.pause();
                    spinner.style.display = "block";

                    const delay = 3000 + Math.random() * 5000; // 3-8 seconds
                    setTimeout(async () => {
                        spinner.style.display = "none";
                        try {
                            await video.play();
                        } catch (e) {
                            // If play fails, it might be due to user interaction or detachment.
                            // We can try to force it or just ignore.
                        }
                        isBuffering = false;
                    }, delay);
                }
            };

            // Check every second while playing
            setInterval(() => {
                if (!video.paused && !video.ended) {
                    triggerBuffer();
                }
            }, 1000);
        });
    }, 2000); // Check for new videos every 2 seconds
});
