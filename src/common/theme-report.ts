import { getBoredomServerUrl } from "./server";

// Used to color barchart interactively
export interface SiteThemeReport {
    siteHostname: string;
    color: string; // hex string
}


export async function sendSiteThemeReport(siteHostname: string, color: string) {

    const serverUrl = getBoredomServerUrl();
    if (!serverUrl) return;

    const url = new URL("/report/theme", serverUrl);
    const themeReport: SiteThemeReport = {siteHostname: siteHostname, color: color};

    try {
        // Use fetch with keepalive for 'closed' events to ensure they are sent during unload
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(themeReport),
        });

    } catch (error) {
        // Silently fail as to not disturb the user experience if the server is down
        console.debug("Boredom Engine: Failed to send theme report", error);
    }
}