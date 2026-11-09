/**
 * @id threads_hide_engagement_metrics
 * @name Threads Hide Engagement Metrics
 * @description Hides like, reply, repost, and quote counts while preserving Threads action buttons.
 * @version 1.0.0
 */
import { injectCss } from "$common";

{
    injectCss(`
        button[aria-label*="like" i] span:not(:first-child),
        button[aria-label*="reply" i] span:not(:first-child),
        button[aria-label*="repost" i] span:not(:first-child),
        button[aria-label*="quote" i] span:not(:first-child) {
            visibility: hidden !important;
        }
    `);
}
