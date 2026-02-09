/**
 * @id instagram_block_reels
 * @name Instagram Block Reels
 * @description Blocks Instagram reels elements and fetch requests on the reels page.
 * @version 1.0.0
 */
import { onDOMLoaded, blockNetworkRequests } from "$common";

onDOMLoaded(() => {
    if (
        window.location.pathname.startsWith("/reels") ||
        window.location.pathname.includes("/reels/")
    ) {
        window.location.replace("https://instagram.com");
    }

    const reelsIcon = document.querySelector(
        'a[href*="/reels/"]',
    ) as HTMLAnchorElement;

    reelsIcon.style.display = "none";
});
