/**
 * @id pinterest_hide_suggestions
 * @name Pinterest Hide Suggestions
 * @description Hides Pinterest recommendation and suggestion modules outside intentional search results.
 * @version 1.0.0
 */

import { blockInterface } from "$common";

{
    blockInterface({
        id: "pinterest_hide_suggestions",
        selectors: [
            '[data-test-id*="suggest" i]',
            '[aria-label*="ideas for you" i]',
            '[aria-label*="picked for you" i]',
        ],
    });
}
