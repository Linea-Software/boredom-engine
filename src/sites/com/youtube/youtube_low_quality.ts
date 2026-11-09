/**
 * @id youtube_low_quality
 * @name YouTube Low Quality
 * @description Forces YouTube video quality based on intensity setting to reduce engagement and make the experience less enjoyable.
 * @version 1.1.0
 */
import { onDOMLoaded } from "$common";

const QUALITY_MAP = "large";

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

        const target = QUALITY_MAP;
        const actual = player.getPlaybackQuality?.();
        // Avoid repeatedly toggling YouTube's player when it already uses
        // the desired quality; reassert when it adapts away from that level.
        if (lastPlayer === player && lastForcedQuality === target && actual === target) return;
        forceQuality(player, target);
        lastPlayer = player;
        lastForcedQuality = target;
    }, 500);
});
