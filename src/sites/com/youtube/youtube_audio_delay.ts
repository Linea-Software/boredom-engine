/**
 * @id youtube_audio_delay
 * @name YouTube Audio Delay
 * @description Adds a fixed audio delay to YouTube Shorts and regular videos.
 * @version 1.1.0
 */
import { onDOMLoaded } from "$common";

const AUDIO_DELAY_SECONDS = 2;

onDOMLoaded(() => {
    let context: AudioContext | null = null;
    let delayNode: DelayNode | null = null;
    let source: MediaElementAudioSourceNode | null = null;
    let attachedVideo: HTMLVideoElement | null = null;

    const attachDelay = () => {
        // Use a fixed two-second delay whenever this intervention is enabled.
        if (delayNode) delayNode.delayTime.value = AUDIO_DELAY_SECONDS;

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
            delayNode.delayTime.value = AUDIO_DELAY_SECONDS;
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
