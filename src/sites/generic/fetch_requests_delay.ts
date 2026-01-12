/**
 * @id generic_fetch_requests_delay
 * @name Delay Requests
 * @description Delays all requests on the page by 2 seconds.
 * @version 1.0.0
 */

import { addDelayToNetwork, onDOMLoaded } from "$common";

onDOMLoaded(() => {
    addDelayToNetwork(2000); // 2 seconds delay
});
