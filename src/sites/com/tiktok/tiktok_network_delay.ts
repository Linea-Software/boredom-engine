/**
 * @id tiktok_network_delay
 * @name TikTok Network Delay
 * @description Adds a 5-second delay to all fetch requests on TikTok to reduce immediate gratification.
 * @version 1.0.0
 */
import { onDOMLoaded, addDelayToNetwork } from "$common";

addDelayToNetwork(5000);
