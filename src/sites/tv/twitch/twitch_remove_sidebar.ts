/**
 * @name Twitch Remove Sidebar
 * @description Removes the sidebar navigation on Twitch to reduce distraction.
 * @version 1.0.0
 */
import { onMount, getElementByXpath } from "$common";

onMount(() => {
    // XPath provided by user: //*[@id="root"]/div[1]/div[1]/div[2]/div[1]
    const sidebarXpath = '//*[@id="root"]/div[1]/div[1]/div[2]/div[1]';

    setInterval(() => {
        const sidebar = getElementByXpath(sidebarXpath);
        if (sidebar) {
            sidebar.style.display = "none";
            // Optional: sidebar.remove(); but display:none is often safer for layout stability
        }
    }, 1000);
});
