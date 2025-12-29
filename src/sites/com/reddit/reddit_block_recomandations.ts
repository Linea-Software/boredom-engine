/**
 * @name Reddit Block Recommendations
 * @description Blocks recommendation feeds on Reddit.
 * @version 1.0.0
 */
import { onMount, getElementByXpath } from "../../../common";

onMount(() => {
    const element = getElementByXpath('//*[@id="subgrid-container"]/div[1]');
    if (element) {
        console.log("Blocking recommendation element.");
        element.remove();
    }
});
