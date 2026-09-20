/**
 * @id x_hide_engagement_metrics
 * @name X Hide Engagement Metrics
 * @description Hides reply, repost, like, bookmark, and view counts while preserving action buttons.
 * @version 1.0.0
 */

import { currentIntensityHigherThan, injectCss, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.None)) {
    injectCss(`
        [role="group"] button[data-testid="reply"] span,
        [role="group"] button[data-testid$="retweet"] span,
        [role="group"] button[data-testid$="like"] span,
        [role="group"] button[data-testid$="bookmark"] span,
        [role="group"] button[data-testid$="removeBookmark"] span,
        [role="group"] a[href$="/analytics"] span,
        [data-testid="app-text-transition-container"] {
            visibility: hidden !important;
        }
    `);
}
