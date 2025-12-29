/**
 * @name Delay Requests
 * @description Delays all requests on the page by 2 seconds.
 * @version 1.0.0
 */

import { addDelayToFetch, onMount } from "$common";

onMount(() => {
    addDelayToFetch(2000); // 2 seconds delay
});
