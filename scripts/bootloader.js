// Tiny bootloader — read this file and pass its content as initScript to navigate_page.
// It loads the Boredom Engine scripts from the local dev server (bun run serve).
const BASE = "http://localhost:48325";
const SCRIPTS = {
    "www.facebook.com": [
        "/com/facebook/facebook_grayscale.js",
        "/com/facebook/facebook_block_feed.js",
        "/com/facebook/facebook_block_reels.js",
        "/com/facebook/facebook_block_stories.js",
        "/com/facebook/facebook_block_sidebar.js",
        "/com/facebook/facebook_hide_reactions.js",
        "/com/facebook/facebook_hide_comments.js",
        "/com/facebook/facebook_limit_scrolling.js",
        "/com/facebook/facebook_random_captcha.js",
    ],
    "www.instagram.com": [
        "/com/instagram/instagram_grayscale.js",
        "/com/instagram/instagram_block_explore.js",
        "/com/instagram/instagram_block_reels.js",
        "/com/instagram/instagram_block_stories.js",
        "/com/instagram/instagram_block_suggestions.js",
        "/com/instagram/instagram_hide_likes.js",
        "/com/instagram/instagram_hide_comments.js",
        "/com/instagram/instagram_random_captcha.js",
    ],
    "www.youtube.com": [
        "/com/youtube/youtube_grayscale.js",
        "/com/youtube/youtube_limit_scrolling.js",
        "/com/youtube/youtube_low_quality.js",
        "/com/youtube/youtube_random_captcha.js",
        "/com/youtube/youtube_shorts_remove.js",
        "/com/youtube/youtube_audio_delay.js",
        "/com/youtube/youtube_video_buffer_delay.js",
    ],
    "www.reddit.com": [
        "/com/reddit/reddit_grayscale.js",
        "/com/reddit/reddit_block_recomandations.js",
        "/com/reddit/reddit_limit_scrolling.js",
        "/com/reddit/reddit_random_captcha.js",
        "/com/reddit/reddit_video_delay.js",
    ],
    "www.tiktok.com": [
        "/com/tiktok/tiktok_block_main_content.js",
        "/com/tiktok/tiktok_desaturate.js",
        "/com/tiktok/tiktok_downgrade_media_quality.js",
        "/com/tiktok/tiktok_remove_sidebar_buttons.js",
        "/com/tiktok/tiktok_video_delay.js",
    ],
    "www.twitch.tv": [
        "/tv/twitch/twitch_grayscale.js",
        "/tv/twitch/twitch_media_quality.js",
        "/tv/twitch/twitch_random_captcha.js",
        "/tv/twitch/twitch_remove_featured_carousel.js",
        "/tv/twitch/twitch_remove_sidebar.js",
        "/tv/twitch/twitch_video_delay.js",
    ],
};

const files = SCRIPTS[location.hostname];
if (files) {
    function inject() {
        if (!document.head) return;
        for (const f of files) {
            const s = document.createElement("script");
            s.src = BASE + f;
            document.head.appendChild(s);
        }
    }
    (function poll() {
        if (document.head) {
            inject();
            return;
        }
        setTimeout(poll, 1);
    })();
}
