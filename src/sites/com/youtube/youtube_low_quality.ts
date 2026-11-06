/**
 * @id youtube_low_quality
 * @name YouTube Low Quality
 * @description Forces YouTube video quality based on intensity setting to reduce engagement and make the experience less enjoyable.
 * @version 1.1.0
 */
import { onDOMLoaded, getIntensity, Intensity } from "$common";

const QUALITY_MAP: Record<Exclude<Intensity, Intensity.None>, string> = {
    [Intensity.Low]: "hd720",
    [Intensity.Medium]: "large",
    [Intensity.High]: "small",
    [Intensity.Extreme]: "tiny",
};

interface YouTubePlayer extends HTMLElement {
    setPlaybackQualityRange?: (min: string, max: string) => void;
    setPlaybackQuality?: (quality: string) => void;
    getPlaybackQuality?: () => string;
}

function forceQuality(player: YouTubePlayer, quality: string): void {
    player.setPlaybackQualityRange?.(quality, quality);
    player.setPlaybackQuality?.(quality);
}

onDOMLoaded(() => {
    let lastPlayer: YouTubePlayer | null = null;
    let lastForcedQuality: string | null = null;

    // YouTube is a SPA: the player may appear late, change on navigation,
    // and/or autonomously switch back to adaptive quality.
    setInterval(() => {
        if (window.location.pathname !== "/watch") {
            lastPlayer = null;
            lastForcedQuality = null;
            return;
        }
        const player = document.getElementById("movie_player") as YouTubePlayer | null;
        if (!player) return;
        const intensity = getIntensity();

        if (intensity === Intensity.None) {
            // "None" must not impose 1080p; relinquish a previous forced
            // choice to YouTube's automatic selection.
            if (lastPlayer === player && lastForcedQuality !== null) {
                forceQuality(player, "auto");
            }
            lastForcedQuality = null;
            lastPlayer = player;
            return;
        }

        const target = QUALITY_MAP[intensity];
        const actual = player.getPlaybackQuality?.();
        // Avoid repeatedly toggling YouTube's player when it already uses
        // the desired quality; reassert when it adapts away from that level.
        if (lastPlayer === player && lastForcedQuality === target && actual === target) return;
        forceQuality(player, target);
        lastPlayer = player;
        lastForcedQuality = target;
    }, 500);
});
