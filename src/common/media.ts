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
 * Downgrades videos by overlaying a low-resolution canvas.
 * @param quality Resolution multiplier (0-1). e.g. 0.1 for 10% resolution.
 */
export function downgradeVideos(quality: number): void {
    const processed = new WeakSet<HTMLVideoElement>();

    setInterval(() => {
        const videos = document.querySelectorAll<HTMLVideoElement>("video");
        videos.forEach((video) => {
            if (processed.has(video)) return;
            processed.add(video);

            const canvas = document.createElement("canvas");
            canvas.style.position = "absolute";
            canvas.style.pointerEvents = "none";
            canvas.style.imageRendering = "pixelated";
            canvas.style.zIndex = "10"; // Sit above video, potentially below custom controls

            // Attempt to ensure parent is positioned to anchor the canvas
            const parent = video.parentElement;
            if (parent) {
                const parentStyle = window.getComputedStyle(parent);
                if (parentStyle.position === "static") {
                    parent.style.position = "relative";
                }
                parent.insertBefore(canvas, video.nextSibling);

                // Match video size initially
                canvas.style.width = "100%";
                canvas.style.height = "100%";
                canvas.style.top = "0";
                canvas.style.left = "0";

                const ctx = canvas.getContext("2d", { alpha: false });
                if (!ctx) return;
                ctx.imageSmoothingEnabled = false;

                const render = () => {
                    if (!video.videoWidth || !video.videoHeight) {
                        requestAnimationFrame(render);
                        return;
                    }

                    // Update internal resolution to match video source * quality
                    const w = Math.floor(video.videoWidth * quality);
                    const h = Math.floor(video.videoHeight * quality);

                    if (canvas.width !== w || canvas.height !== h) {
                        canvas.width = w;
                        canvas.height = h;
                        ctx.imageSmoothingEnabled = false; // Reset on resize
                    }

                    ctx.drawImage(video, 0, 0, w, h);
                    requestAnimationFrame(render);
                };

                render();
            }
        });
    }, 1000);
}
