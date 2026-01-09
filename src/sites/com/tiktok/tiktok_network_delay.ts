/**
 * @name TikTok Network Delay
 * @description Adds a 5-second delay to all fetch requests on TikTok to reduce immediate gratification.
 * @version 1.0.0
 */
import { onMount, addDelayToNetwork } from "$common";

onMount(() => {
    addDelayToNetwork(5000);
});
