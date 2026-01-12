/**
 * @id youtube_audio_delay
 * @name YouTube Audio Delay
 * @description Adds a 2-second delay to the audio to make the video more frustrating to watch. Works with both YouTube Shorts and regular videos.
 * @version 1.0.0
 */
import { onDOMLoaded } from "$common";
import { YouTubeBypassController } from "$sites/com/youtube/shared/youtube-bypass";

onDOMLoaded(() => {
    const bypass = YouTubeBypassController.getInstance();
    bypass.setAudioDelay(2);
});
