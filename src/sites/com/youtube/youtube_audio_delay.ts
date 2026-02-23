/**
 * @id youtube_audio_delay
 * @name YouTube Audio Delay
 * @description Adds a 2-second delay to the audio to make the video more frustrating to watch. Works with both YouTube Shorts and regular videos.
 * @version 1.0.0
 */
import {
    currentIntensityHigherThan,
    getIntensity,
    Intensity,
    onDOMLoaded,
} from "$common";

const AUDIO_DELAY_MAP: Record<Intensity, number> = {
    [Intensity.None]: 0,
    [Intensity.Low]: 1,
    [Intensity.Medium]: 2,
    [Intensity.High]: 3,
    [Intensity.Extreme]: 5,
};

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    let context: AudioContext | null = null;
    let delayNode: DelayNode | null = null;
    let source: MediaElementAudioSourceNode | null = null;
    let attachedVideo: HTMLVideoElement | null = null;

    const attachDelay = () => {
        const video = document.querySelector("video");
        if (!video) return;
        // If we attached to a previous video element that is no longer in DOM or changed
        if (video === attachedVideo) return;

        try {
            if (!context) {
                const AudioContextClass =
                    window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                    context = new AudioContextClass();
                } else {
                    return;
                }
            }

            if (context.state === "suspended") {
                context.resume().catch(() => {});
            }

            // Create media source from the video element.
            // This captures the audio and re-routes it through the audio context,
            // effectively removing it from the default output path.
            source = context.createMediaElementSource(video);

            delayNode = context.createDelay(5.0);
            delayNode.delayTime.value = AUDIO_DELAY_MAP[getIntensity()];

            source.connect(delayNode);
            delayNode.connect(context.destination);

            attachedVideo = video;
        } catch (e) {
            // CORS or EME restrictions may prevent capturing audio from the video element.
        }
    };

    setInterval(attachDelay, 2000);
});
