/**
 * @id netflix_disable_autoplay_previews
 * @name Netflix Disable Autoplay Previews
 * @description Pauses and mutes autoplaying browse previews without interfering with intentional watch-page playback.
 * @version 1.0.0
 */
import { blockInterface } from "$common";

{
    blockInterface({
        id: "netflix_disable_autoplay_previews",
        media: {
            containers: [".video-merch-player-container", ".background-video-container", ".billboard-row"],
            mute: true,
            pause: true,
        },
    });
}
