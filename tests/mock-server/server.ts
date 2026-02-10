import hostile from "hostile";
import mkcert from "mkcert";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

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
const DEFAULT_HOSTNAME = "boredomserver.dev";
const HOSTNAME = Bun.env.BOREDOM_HOSTNAME || DEFAULT_HOSTNAME;

// Register hostname if it's the default one
if (HOSTNAME === DEFAULT_HOSTNAME) {
    try {
        hostile.set("127.0.0.1", HOSTNAME);
        console.log(`[Hosts] Registered ${HOSTNAME} -> 127.0.0.1`);
    } catch (err) {
        console.error(`[Hosts] Failed to register ${HOSTNAME}. Try running with admin/sudo privileges.`);
        console.debug(err);
    }
}

// Cleanup on exit
const cleanup = () => {
    if (HOSTNAME === DEFAULT_HOSTNAME) {
        try {
            hostile.remove("127.0.0.1", HOSTNAME);
            console.log(`\n[Hosts] Unregistered ${HOSTNAME}`);
        } catch (err) {
            // Silence cleanup errors
        }
    }
    process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

async function startServer() {
    let ssl: { key: string; cert: string } | undefined;

    try {
        console.log(`[SSL] Generating certificates for ${HOSTNAME}...`);

        // Create a certificate authority
        const ca = await mkcert.createCA({
            organization: "Boredom Engine",
            countryCode: "US",
            state: "California",
            locality: "San Francisco",
            validity: 365
        });

        // Create a certificate signed by the CA
        const cert = await mkcert.createCert({
            domains: [HOSTNAME, "127.0.0.1", "localhost"],
            validity: 365,
            ca: ca,
        });

        ssl = { key: cert.key, cert: cert.cert };
        console.log(`[SSL] Certificates ready.`);

        // Install CA cert using certutil on Windows
        if (process.platform === "win32") {
            const caPath = path.join(process.cwd(), "temp_ca.crt");
            fs.writeFileSync(caPath, ca.cert);
            try {
                console.log(`[SSL] Installing CA certificate into Trusted Root store...`);
                // -addstore "Root" adds the cert to the Trusted Root Certification Authorities
                // -f forces overwrite if it already exists (though we generate a new one each time)
                execSync(`certutil -addstore -f "Root" "${caPath}"`, { stdio: "inherit" });
                console.log(`[SSL] CA certificate installed successfully.`);
            } catch (err) {
                console.warn(`[SSL] Failed to install CA certificate. You may need to run as Admin.`);
                console.debug(err);
            } finally {
                if (fs.existsSync(caPath)) fs.unlinkSync(caPath);
            }
        }
    } catch (err) {
        console.error(`[SSL] Failed to setup HTTPS:`, err);
        console.log(`[SSL] Proceeding with HTTP fallback.`);
    }

    const protocol = ssl ? "https" : "http";
    console.log(`Starting mock usage stats server on ${protocol}://${HOSTNAME}:${PORT}...`);
    console.log(`To test, set window.__BOREDOM_SERVER_PORT__ = ${PORT} in your browser.`);
    if (HOSTNAME !== "localhost") {
        console.log(`Also set window.__BOREDOM_SERVER_HOSTNAME__ = "${HOSTNAME}" in your browser.`);
    }

    Bun.serve({
        port: PORT,
        hostname: HOSTNAME,
        tls: ssl ? {
            key: ssl.key,
            cert: ssl.cert,
        } : undefined,
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
                        if (report.activeTimeSeconds > 0 && report.activeTimeSeconds >= 20) {
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
}

startServer();
