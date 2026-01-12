/**
 * @id youtube_low_quality
 * @name YouTube Low Quality
 * @description Forces YouTube video quality to 144p (tiny) or 240p (small) to reduce engagement and make the experience less enjoyable.
 * @version 1.0.1
 */

import { onDOMLoaded } from "$common";
import { YouTubeBypassController } from "$sites/com/youtube/shared/youtube-bypass";

onDOMLoaded(() => {
    // Aggressively force quality check every 5 seconds
    setInterval(() => {
        if (window.location.href.includes("/watch")) {
            const bypass = YouTubeBypassController.getInstance();
            // Force to 'tiny' (144p) for maximum boredom
            bypass.enforceQuality("tiny");
        }
    }, 5000);
});
