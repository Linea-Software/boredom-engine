/**
 * @id twitch_remove_sidebar
 * @name Twitch Remove Sidebar
 * @description Hides the Twitch navigation sidebar using stable selectors with a legacy structural fallback.
 * @version 1.1.0
 */

import { blockInterface } from "$common";

{
    blockInterface({
        id: "twitch_remove_sidebar",
        selectors: [
            "#sideNav",
            '[data-a-target="side-nav"]',
            '#root > div:first-child > div:first-child > div:nth-child(2) > div:first-child',
        ],
    });
}
