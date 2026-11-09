/**
 * @id facebook_hide_comments
 * @name Facebook Hide Comments
 * @description Hides Facebook comment controls, counts, inputs, and comment panels.
 * @version 1.1.0
 */

import { blockInterface } from "$common";

{
    blockInterface({
        id: "facebook_hide_comments",
        selectors: [
            'a[aria-label*="Comment"]',
            'div[role="button"][aria-label*="Comment"]',
            'div[aria-label*="Comment"]',
            'a[aria-label*="View previous comments"]',
            'a[aria-label*="View more comments"]',
            '[role="dialog"] div[aria-label*="Comments"]',
            'form[aria-label*="comment"]',
            'div[aria-label*="Write a comment"]',
            'span[aria-label*="comments"]',
        ],
    });
}
