/**
 * @id linkedin_hide_engagement_metrics
 * @name LinkedIn Hide Engagement Metrics
 * @description Hides reaction, comment, and repost counts while keeping LinkedIn post actions usable.
 * @version 1.0.0
 */

import { injectCss } from "$common";

{
    injectCss(`
        .social-details-social-counts,
        [data-view-name="feed-full-update-social-counts"],
        button[aria-label*="reaction" i] span:not(:first-child),
        button[aria-label*="comment" i] span:not(:first-child),
        button[aria-label*="repost" i] span:not(:first-child) {
            visibility: hidden !important;
        }
    `);
}
