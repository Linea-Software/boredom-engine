/**
 * @id youtube_low_quality
 * @name YouTube Low Quality
 * @description Forces YouTube video quality to 144p (tiny) or 240p (small) to reduce engagement and make the experience less enjoyable.
 * @version 1.0.1
 */

import { onDOMLoaded } from "$common";

onDOMLoaded(() => {
    // Aggressively force quality check every 2 seconds
    setInterval(() => {
        if (window.location.href.includes("/watch")) {
            const ytdPlayer = document.getElementById("ytd-player") as any;
            const player = ytdPlayer?.getPlayer ? ytdPlayer.getPlayer() : null;

            if (player) {
                // Try both new and old APIs
                // 'tiny' corresponds to 144p, 'small' to 240p
                if (typeof player.setPlaybackQualityRange === "function") {
                    player.setPlaybackQualityRange("tiny", "tiny");
                }
                if (typeof player.setPlaybackQuality === "function") {
                    player.setPlaybackQuality("tiny");
                }
            }
        }
    }, 2000);
});
