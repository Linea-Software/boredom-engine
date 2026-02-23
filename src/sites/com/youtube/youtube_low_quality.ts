/**
 * @id youtube_low_quality
 * @name YouTube Low Quality
 * @description Forces YouTube video quality based on intensity setting to reduce engagement and make the experience less enjoyable.
 * @version 1.0.0
 */

import {
    onDOMLoaded,
    getIntensity,
    Intensity,
    currentIntensityHigherThan,
} from "$common";

const QUALITY_MAP: Record<Intensity, string> = {
    [Intensity.None]: "hd1080", // unused
    [Intensity.Low]: "hd720", // 720p - Mild annoyance
    [Intensity.Medium]: "large", // 480p - Distracting
    [Intensity.High]: "small", // 240p - Very annoying
    [Intensity.Extreme]: "tiny", // 144p - Almost unwatchable
};

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }
    // Aggressively force quality check every 0.5 seconds
    setInterval(() => {
        // We re-check intensity every loop to allow dynamic updates from the external program
        const intensity = getIntensity();
        const targetQuality = QUALITY_MAP[intensity];

        if (window.location.href.includes("/watch")) {
            const ytdPlayer = document.getElementById("ytd-player") as any;
            const player = ytdPlayer?.getPlayer ? ytdPlayer.getPlayer() : null;

            if (player) {
                // Try both new and old APIs
                if (typeof player.setPlaybackQualityRange === "function") {
                    player.setPlaybackQualityRange(
                        targetQuality,
                        targetQuality,
                    );
                }
                if (typeof player.setPlaybackQuality === "function") {
                    player.setPlaybackQuality(targetQuality);
                }
            }
        }
    }, 500);
});
