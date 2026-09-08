/**
 * @id instagram_block_stories
 * @name Instagram Block Stories
 * @description Hides Instagram Stories surfaces and redirects away from story routes.
 * @version 1.1.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.None)) {
    blockInterface({
        id: "instagram_block_stories",
        selectors: [
            '[data-pagelet="story_tray"]',
            "section.x6s0dn4.xrvj5dj.x1o61qjw.x12nagc.x1gslohp",
            "._aicw",
            ".zG432",
            "ul:has(canvas):not(:has(article))",
            '[role="list"]:has(canvas):not(:has(article))',
        ],
        redirect: {
            when: (url) => url.pathname.startsWith("/stories"),
            to: "https://instagram.com/",
        },
    });
}
