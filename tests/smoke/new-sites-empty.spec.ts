import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { loadScript, openFixture, setIntensity } from "./harness";

const SITE_SCRIPTS: Record<string, string[]> = {
    x: [
        "com/x/x_block_for_you.ts",
        "com/x/x_hide_trends.ts",
        "com/x/x_hide_suggestions.ts",
        "com/x/x_hide_engagement_metrics.ts",
        "com/x/x_limit_scrolling.ts",
        "com/x/x_grayscale.ts",
        "com/x/x_random_captcha.ts",
    ],
    linkedin: [
        "com/linkedin/linkedin_block_feed.ts",
        "com/linkedin/linkedin_hide_news.ts",
        "com/linkedin/linkedin_hide_suggestions.ts",
        "com/linkedin/linkedin_hide_engagement_metrics.ts",
        "com/linkedin/linkedin_limit_scrolling.ts",
        "com/linkedin/linkedin_grayscale.ts",
        "com/linkedin/linkedin_random_captcha.ts",
    ],
    pinterest: [
        "com/pinterest/pinterest_block_home_feed.ts",
        "com/pinterest/pinterest_block_related_pins.ts",
        "com/pinterest/pinterest_block_explore.ts",
        "com/pinterest/pinterest_hide_suggestions.ts",
        "com/pinterest/pinterest_grayscale.ts",
        "com/pinterest/pinterest_limit_scrolling.ts",
        "com/pinterest/pinterest_random_captcha.ts",
    ],
    threads: [
        "net/threads/threads_block_for_you.ts",
        "net/threads/threads_hide_suggestions.ts",
        "net/threads/threads_hide_engagement_metrics.ts",
        "net/threads/threads_grayscale.ts",
        "net/threads/threads_limit_scrolling.ts",
        "net/threads/threads_random_captcha.ts",
    ],
    netflix: [
        "com/netflix/netflix_disable_autoplay_previews.ts",
        "com/netflix/netflix_hide_top_10.ts",
        "com/netflix/netflix_hide_recommendations.ts",
        "com/netflix/netflix_hide_billboard.ts",
        "com/netflix/netflix_grayscale.ts",
        "com/netflix/netflix_playback_delay.ts",
    ],
    hackernews: [
        "com/ycombinator/news/hackernews_limit_front_page.ts",
        "com/ycombinator/news/hackernews_hide_scores.ts",
        "com/ycombinator/news/hackernews_hide_comment_counts.ts",
        "com/ycombinator/news/hackernews_filter_repetitive_content.ts",
        "com/ycombinator/news/hackernews_grayscale.ts",
        "com/ycombinator/news/hackernews_limit_scrolling.ts",
    ],
    snapchat: [
        "com/snapchat/snapchat_block_spotlight.ts",
        "com/snapchat/snapchat_block_discover.ts",
        "com/snapchat/snapchat_hide_suggestions.ts",
        "com/snapchat/snapchat_grayscale.ts",
        "com/snapchat/snapchat_limit_scrolling.ts",
        "com/snapchat/snapchat_random_captcha.ts",
    ],
};

for (const [site, scripts] of Object.entries(SITE_SCRIPTS)) {
    test(`${site} scripts tolerate missing target elements`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await setIntensity(page, "high");
        for (const relative of scripts) {
            await loadScript(page, join(process.cwd(), "src/sites", relative));
        }
        await openFixture(page, "_shared/empty.html");
        await page.waitForTimeout(100);
        expect(errors).toEqual([]);
        await expect(page.locator("#intentional")).toBeVisible();
    });
}
