/**
 * @name Instagram Block Reels
 * @description Blocks Instagram reels elements and fetch requests on the reels page.
 * @version 1.0.0
 */
import { onMount, blockNetworkRequests } from "$common";

onMount(() => {
    if (
        window.location.pathname.startsWith("/reels") ||
        window.location.pathname.includes("/reels/")
    ) {
        blockNetworkRequests();
    }

    const reelsIcon = document.querySelector(
        'a[href*="/reels/"]'
    ) as HTMLAnchorElement;

    reelsIcon.style.display = "none";
});
