/**
 * @id youtube_audio_delay
 * @name YouTube Audio Delay
 * @description Adds an intensity-scaled audio delay to YouTube Shorts and regular videos.
 * @version 1.1.0
 */
import { getIntensity, Intensity, onDOMLoaded } from "$common";

const AUDIO_DELAY_MAP: Record<Intensity, number> = {
    [Intensity.None]: 0,
    [Intensity.Low]: 1,
    [Intensity.Medium]: 2,
    [Intensity.High]: 3,
    [Intensity.Extreme]: 5,
};

onDOMLoaded(() => {
    let context: AudioContext | null = null;
    let delayNode: DelayNode | null = null;
    let source: MediaElementAudioSourceNode | null = null;
    let attachedVideo: HTMLVideoElement | null = null;

    const attachDelay = () => {
        const intensity = getIntensity();
        // Keep a previously attached video responsive to intensity changes.
        // "None" restores zero delay instead of leaving audio lag active.
        if (delayNode) delayNode.delayTime.value = AUDIO_DELAY_MAP[intensity];
        if (intensity === Intensity.None) return;

        const video = document.querySelector("video");
        if (!video) return;
        if (video === attachedVideo) return;

        try {
            if (!context) {
                const AudioContextClass =
                    window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioContextClass) return;
                context = new AudioContextClass();
            }
            if (context.state === "suspended") {
                context.resume().catch(() => {});
            }
            // YouTube replaces its video element on some SPA navigations.
            // Disconnect the old pipeline before connecting a new one.
            source?.disconnect();
            delayNode?.disconnect();

            source = context.createMediaElementSource(video);
            delayNode = context.createDelay(5.0);
            delayNode.delayTime.value = AUDIO_DELAY_MAP[intensity];
            source.connect(delayNode);
            delayNode.connect(context.destination);
            attachedVideo = video;
        } catch {
            // Browser media/CORS restrictions may reject source capture.
            // Retry on the next tick without crashing the other scripts.
        }
    };

    // The player may be present immediately or appear after SPA navigation.
    attachDelay();
    setInterval(attachDelay, 1000);
});
