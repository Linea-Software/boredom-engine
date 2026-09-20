/**
 * @id pinterest_block_explore
 * @name Pinterest Block Explore
 * @description Hides Pinterest Ideas/Today discovery links and redirects those discovery routes home.
 * @version 1.0.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.Low)) {
    blockInterface({
        id: "pinterest_block_explore",
        selectors: ['a[href^="/ideas/"]', 'a[href^="/today"]'],
        redirect: {
            when: (url) =>
                url.pathname.startsWith("/ideas/") || url.pathname.startsWith("/today"),
            to: "https://www.pinterest.com/",
        },
    });
}
