/**
 * Common module to track and send usage statistics to the local server.
 */
const GLOBAL_PORT_KEY = "__BOREDOM_SERVER_PORT__";
const GLOBAL_HOSTNAME_KEY = "__BOREDOM_SERVER_HOSTNAME__";

/**
 * Returns the local server URL where statistics should be sent, or null if not configured.
 */
export function getBoredomServerUrl(): URL | null {
    if (typeof window === "undefined") return null;

    const port = (window as any)[GLOBAL_PORT_KEY] || 3000;
    // Default to boredomserver.dev, which we register in the hosts file during mock server startup.
    const hostname = (window as any)[GLOBAL_HOSTNAME_KEY] || "boredomserver.dev";

    if (!port) return null;

    

    return new URL(`https://${hostname}:${port}`);
}
