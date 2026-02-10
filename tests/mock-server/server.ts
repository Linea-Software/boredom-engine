export enum Intensity {
    Low = "low",
    Medium = "medium",
    High = "high",
    Extreme = "extreme"
}

export interface UsageReport {
    siteHostname: string;
    openedAt: string;
    activeTimeSeconds: number;
    currentIntensity: Intensity;
    type: "opened" | "closed" | "heartbeat";
}

export type ServerAction = "nothing" | "increase_intensity" | "close_tab";

const PORT = Number(Bun.env.BOREDOM_PORT) || 3000;
const HOSTNAME = Bun.env.BOREDOM_HOSTNAME || "localhost";

console.log(`Starting mock usage stats server on http://${HOSTNAME}:${PORT}...`);
console.log(`To test, set window.__BOREDOM_SERVER_PORT__ = ${PORT} in your browser.`);
if (HOSTNAME !== "localhost") {
    console.log(`Also set window.__BOREDOM_SERVER_HOSTNAME__ = "${HOSTNAME}" in your browser.`);
}

Bun.serve({
    port: PORT,
    hostname: HOSTNAME,
    async fetch(req) {
        const url = new URL(req.url);

        // Handle CORS preflight
        if (req.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        }

        if (url.pathname === "/usage" && req.method === "POST") {
            try {
                const report: UsageReport = await req.json();
                console.log(`[${new Date().toLocaleTimeString()}] Report from ${report.siteHostname}:`, {
                    type: report.type,
                    activeTime: `${report.activeTimeSeconds}s`,
                    intensity: report.currentIntensity
                });

                let action: ServerAction = "nothing";

                // Logic: Every 20 seconds of usage, increase intensity.
                // If already extreme, close the tab.
                if (report.type !== "closed") {
                    if (report.activeTimeSeconds > 0 && report.activeTimeSeconds % 20 === 0) {
                        if (report.currentIntensity === Intensity.Extreme) {
                            console.log("!!! User reached Extreme intensity and hit the limit. Sending close_tab.");
                            action = "close_tab";
                        } else {
                            console.log(`>>> Threshold reached (${report.activeTimeSeconds}s). Sending increase_intensity.`);
                            action = "increase_intensity";
                        }
                    }
                }

                return new Response(JSON.stringify(action), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                });
            } catch (err) {
                console.error("Error parsing report:", err);
                return new Response("Invalid JSON", { status: 400 });
            }
        }

        return new Response("Not Found", { status: 404 });
    },
});
