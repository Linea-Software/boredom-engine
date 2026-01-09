/**
 * @name TikTok Remove Sidebar Buttons
 * @description Removes specific buttons from the TikTok sidebar (e.g. "Following" or specific nav items) to reduce clutter.
 * @version 1.0.0
 */
import { onMount, getElementByXpath } from "$common";

onMount(() => {
    // List of XPaths to remove
    const buttonsToRemove = [
        '//*[@id="app"]/div[2]/div/div/div[3]/div[1]/div[3]', // more button
        '//*[@id="app"]/div[2]/div/div/div[3]/div[1]/h2[2]', // explore button
        '//*[@id="app"]/div[2]/div/div/div[3]/div[1]/h2[5]', // live button
    ];

    setInterval(() => {
        buttonsToRemove.forEach((xpath) => {
            const element = getElementByXpath(xpath);
            if (element) {
                element.style.display = "none";
                element.style.pointerEvents = "none";
                // Optional: element.remove();
                // Using display:none is safer for SPAs to prevent crashes if the framework tries to update it.
            }
        });
    }, 1000);
});
