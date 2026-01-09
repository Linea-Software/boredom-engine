/**
 * @name Delay Requests
 * @description Delays all requests on the page by 2 seconds.
 * @version 1.0.0
 */

import { addDelayToNetwork, onMount } from "$common";

onMount(() => {
    addDelayToNetwork(2000); // 2 seconds delay
});
