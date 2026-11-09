/**
 * @id instagram_block_suggestions
 * @name Instagram Block Suggestions
 * @description Hides suggested-for-you separators and the suggested posts that follow them.
 * @version 1.1.0
 */

import { blockInterface } from "$common";

{
    blockInterface({
        id: "instagram_block_suggestions",
        selectors: [
            ".x1bs97v6",
            ".x1bs97v6 ~ article",
            ".x6s0dn4.xd18jyu.xso031l.x78zum5.x1q0g3np.x1ejq31n.x18oe1m7.xstzfhl.x1sy0etr.x1y1aw1k.xyri2b.xwxc41k.x1c1uobl",
            ".x6s0dn4.xd18jyu.xso031l.x78zum5.x1q0g3np.x1ejq31n.x18oe1m7.xstzfhl.x1sy0etr.x1y1aw1k.xyri2b.xwxc41k.x1c1uobl + div",
            "article + div:has(h3)",
            "article + div:has(h3) ~ article",
            'div:has(> [role="progressbar"])',
            'div:has(> [role="progressbar"]) ~ :is(img, div)',
        ],
    });
}
