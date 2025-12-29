/**
 * @name Twitch Remove Featured Carousel
 * @description Removes the featured carousel from the Twitch homepage.
 * @version 1.0.0
 */
import { onMount, getElementByXpath } from "$common";

onMount(() => {
    const targetPath =
        '//*[@id="root"]/div[1]/div[1]/div[2]/main/div[1]/div/div/div[1]';
    const element = getElementByXpath(targetPath);

    if (element) {
        console.log("Removing Twitch featured carousel.");
        element.remove();
    }
});
