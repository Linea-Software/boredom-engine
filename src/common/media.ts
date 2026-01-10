// Configuration State
const CONFIG = {
    images: {
        enabled: false,
        quality: 0.05 // Lower = more pixelated (0.01 to 1.0)
    },
    videos: {
        enabled: false,
        quality: 0.08 // Lower = more pixelated
    },
    audio: {
        delay: 0.3 // Seconds of lag
    }
};

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


let observerStarted = false;

/**
 * Adds a delay node to audio sources to simulate lag/desync.
 */
function processAudio(element: HTMLMediaElement): void {
    if (element.dataset.audioLagged) return;

    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        // We use a singleton context to prevent browser limit errors
        // Note: In a strict extension environment, you might need one ctx per element
        const ctx = new AudioContext();
        const source = ctx.createMediaElementSource(element);
        const delayNode = ctx.createDelay(5.0);

        delayNode.delayTime.value = CONFIG.audio.delay;

        // Reconnect: Source -> Delay -> Destination
        source.connect(delayNode);
        delayNode.connect(ctx.destination);

        element.dataset.audioLagged = "true";

        // Handle resume on interaction
        const resumeCtx = () => {
            if (ctx.state === 'suspended') ctx.resume();
        };
        document.addEventListener('click', resumeCtx, { once: true });
        element.addEventListener('play', resumeCtx);

    } catch (e) {
        // Usually fails if the element is already connected to a graph
        // or due to strict autoplay policies.
        console.debug("Audio intercept skipped:", e);
    }
}

// --- 2. IMAGE DEGRADATION SERVICE ---

async function degradeImage(img: HTMLImageElement): Promise<void> {
    if (!CONFIG.images.enabled) return;
    if (img.dataset.processed) return;

    // Mark processed immediately to prevent loops
    img.dataset.processed = "true";

    // 1. Instant CSS downgrade (Works on everything immediately)
    img.style.imageRendering = "pixelated";

    // 2. Check if we can do the heavy Canvas bitcrush
    // We can only read pixels if the image is same-origin or allows CORS
    const isLocal = img.src.includes(window.location.hostname) || img.src.startsWith('data:');

    if (isLocal) {
        applyCanvasBitcrush(img);
    } else {
        // Try to request anonymous access, but don't break the image if it fails
        const testImg = new Image();
        testImg.crossOrigin = "anonymous";
        testImg.src = img.src;

        testImg.onload = () => {
            // Success! We can replace the original with a canvas version
            img.src = testImg.src; // Ensure source matches
            img.crossOrigin = "anonymous";
            applyCanvasBitcrush(img);
        };

        testImg.onerror = () => {
            // CORS blocked. Fallback to CSS Filters.
            img.style.filter = "contrast(1.5) saturate(0.5) blur(1px)";
        };
    }
}

function applyCanvasBitcrush(img: HTMLImageElement) {
    if (!img.naturalWidth) return;

    const scale = CONFIG.images.quality;
    const w = Math.floor(img.naturalWidth * scale);
    const h = Math.floor(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        // Replace image source with the tiny, crunched version
        // Browser upscaling (image-rendering: pixelated) handles the rest
        img.src = canvas.toDataURL('image/jpeg', 0.5);
    }
}

// --- 3. VIDEO DEGRADATION SERVICE ---

function degradeVideo(video: HTMLVideoElement): void {
    if (!CONFIG.videos.enabled) return;
    if (video.dataset.processed) return;
    video.dataset.processed = "true";

    // Apply Audio Lag
    processAudio(video);

    // Setup Canvas Overlay
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false }); // optimization

    if (!ctx) return;

    // Style the canvas to sit exactly on top of the video
    // pointer-events: none ensures you can still click Play/Pause on the video
    canvas.style.cssText = `
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none;
        z-index: 10;
        image-rendering: pixelated;
    `;

    // Parent container handling
    const parent = video.parentElement;
    if (parent) {
        // Ensure parent can hold absolute children
        const parentStyle = window.getComputedStyle(parent);
        if (parentStyle.position === 'static') {
            parent.style.position = 'relative';
        }
        parent.appendChild(canvas);
    }

    // Hide original video visually, but keep it playing for audio/timing
    video.style.opacity = "0";

    const renderLoop = () => {
        if (!CONFIG.videos.enabled) {
            canvas.remove();
            video.style.opacity = "1";
            return;
        }

        if (video.paused || video.ended) {
            requestAnimationFrame(renderLoop);
            return;
        }

        // Set low-res canvas dimensions
        const q = CONFIG.videos.quality;
        const targetW = Math.max(32, Math.floor(video.videoWidth * q));
        const targetH = Math.max(32, Math.floor(video.videoHeight * q));

        if (canvas.width !== targetW) {
            canvas.width = targetW;
            canvas.height = targetH;
        }

        try {
            // Draw video frame to small canvas
            ctx.drawImage(video, 0, 0, targetW, targetH);
        } catch (e) {
            // Security Error (CORS protection) occurred.
            // This happens on Netflix/Youtube often.
            // FALLBACK: Remove canvas, apply CSS blur to video.
            canvas.remove();
            video.style.opacity = "1";
            video.style.filter = "contrast(2.0) blur(2px)";
            video.style.imageRendering = "pixelated";
            return; // Stop the loop
        }

        requestAnimationFrame(renderLoop);
    };

    renderLoop();
}

// --- 4. MASTER OBSERVER ---

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node instanceof HTMLElement) {
                // Check for IMG
                if (node.tagName === 'IMG') degradeImage(node as HTMLImageElement);
                node.querySelectorAll('img').forEach(degradeImage);

                // Check for VIDEO
                if (node.tagName === 'VIDEO') degradeVideo(node as HTMLVideoElement);
                node.querySelectorAll('video').forEach(degradeVideo);
            }
        }
    }
});

function startObserver() {
    if (observerStarted) return;
    observerStarted = true;
    observer.observe(document.body, { childList: true, subtree: true });
}


/**
 * Turns existing images into low-res versions.
 * @param quality 0.01 (worst) to 0.5 (bad)
 */
export function downgradeImages(quality: number = 0.1): void {
    CONFIG.images.enabled = true;
    CONFIG.images.quality = quality;

    // Process existing
    document.querySelectorAll('img').forEach(degradeImage);
    startObserver();
    console.log(`[Boredom] Images set to quality: ${quality}`);
}

/**
 * Overlays pixelated canvas on videos and adds audio lag.
 * @param quality 0.01 (worst) to 0.2 (bad)
 */
export function downgradeVideos(quality: number = 0.1): void {
    CONFIG.videos.enabled = true;
    CONFIG.videos.quality = quality;

    // Process existing
    document.querySelectorAll('video').forEach(degradeVideo);
    startObserver();
    console.log(`[Boredom] Videos set to quality: ${quality}`);
}