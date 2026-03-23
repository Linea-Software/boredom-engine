import { onDOMLoaded } from "./dom";
import { getIntensity, setIntensity } from "./intensity";
import { Intensity } from "./intensity";
export { Intensity };

export interface UsageReport {
    siteHostname: string;
    openedAt: string;
    activeTimeSeconds: number;
    currentIntensity: Intensity;
    type: "opened" | "closed" | "heartbeat" | "theme";
    dominantColor?: string;
}

export type ServerAction = "nothing" | "increase_intensity" | "close_tab";



/**
 * Common module to track and send usage statistics to the local server.
 */
const GLOBAL_PORT_KEY = "__BOREDOM_SERVER_PORT__";
const GLOBAL_HOSTNAME_KEY = "__BOREDOM_SERVER_HOSTNAME__";

/**
 * Returns the local server URL where statistics should be sent, or null if not configured.
 */
export function getBoredomServerUrl(): string | null {
    if (typeof window === "undefined") return null;

    const port = (window as any)[GLOBAL_PORT_KEY] || 3000;
    // Default to boredomserver.dev, which we register in the hosts file during mock server startup.
    const hostname = (window as any)[GLOBAL_HOSTNAME_KEY] || "boredomserver.dev";

    if (!port) return null;

    return `https://${hostname}:${port}`;
}



/**
 * Internal state for tracking active time.
 */
let sessionOpenedAt = new Date();
let totalActiveTimeMs = 0;
let lastVisibilityChangeTimestamp = Date.now();
let isPageVisible = typeof document !== "undefined" ? !document.hidden : true;
let isTrackingPaused = false;
let defaultHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
let defaultInactivityTimer: ReturnType<typeof setTimeout> | null = null;

const HEARTBEAT_INTERVAL_MS = 10000;
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

function resetDefaultInactivityTimer() {
    if (isTrackingPaused) {
        resumeTracking();
    }
    if (defaultInactivityTimer) {
        clearTimeout(defaultInactivityTimer);
    }
    defaultInactivityTimer = setTimeout(() => {
        haltTracking();
    }, INACTIVITY_TIMEOUT_MS);
}

/**
 * Stops the default automatic tracking and heartbeat so that a site-specific script can implement custom logic.
 */
export function stopDefaultTracking(): void {
    if (defaultHeartbeatTimer) {
        clearInterval(defaultHeartbeatTimer);
        defaultHeartbeatTimer = null;
    }
    if (defaultInactivityTimer) {
        clearTimeout(defaultInactivityTimer);
        defaultInactivityTimer = null;
    }
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    if (typeof window !== "undefined") {
        activityEvents.forEach(event => {
            window.removeEventListener(event, resetDefaultInactivityTimer);
        });
    }
}


function updateAccumulatedTime(): void {
    const now = Date.now();
    if (isPageVisible && !isTrackingPaused) {
        totalActiveTimeMs += now - lastVisibilityChangeTimestamp;
    }
    lastVisibilityChangeTimestamp = now;
}

/**
 * Halts the accumulated time tracking (e.g., when the user is detected as inactive by a site script).
 */
export function haltTracking(): void {
    updateAccumulatedTime();
    isTrackingPaused = true;
}

/**
 * Resumes the accumulated time tracking.
 */
export function resumeTracking(): void {
    lastVisibilityChangeTimestamp = Date.now();
    isTrackingPaused = false;
}

/**
 * Initializes usage tracking. Should be called once per page load.
 */
export function initUsageTracking(): void {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    if ((window as any).__BOREDOM_TRACKING_INIT__) return;
    (window as any).__BOREDOM_TRACKING_INIT__ = true;

    sessionOpenedAt = new Date();
    totalActiveTimeMs = 0;
    lastVisibilityChangeTimestamp = Date.now();
    isPageVisible = !document.hidden;

    // Send "opened" event
    sendUsageReport("opened");

    // Default activity tracking and heartbeat
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
        window.addEventListener(event, resetDefaultInactivityTimer, { passive: true });
    });
    resetDefaultInactivityTimer();

    defaultHeartbeatTimer = setInterval(() => {
        if (!isTrackingPaused && isPageVisible) {
            sendUsageReport("heartbeat");
        }
    }, HEARTBEAT_INTERVAL_MS);

    // Track visibility changes to calculate "effectively active" time
    document.addEventListener("visibilitychange", () => {
        updateAccumulatedTime();
        isPageVisible = !document.hidden;
    });

    // Send "closed" event on unload
    window.addEventListener("beforeunload", () => {
        sendUsageReport("closed");
    });
}

// Initialize usage tracking when the DOM is loaded
onDOMLoaded(initUsageTracking);

/**
 * Returns the number of seconds the user has been effectively active.
 */
export function getActiveTimeSeconds(): number {
    updateAccumulatedTime();
    return Math.floor(totalActiveTimeMs / 1000);
}

/**
 * Sends a usage report to the local server and handles the response action.
 * @param type The type of report (opened, closed, or heartbeat)
 */
export async function sendUsageReport(
    type: "opened" | "closed" | "heartbeat" | "theme",
    extraData: Partial<UsageReport> = {}
): Promise<void> {
    const report: UsageReport = {
        siteHostname: window.location.hostname,
        openedAt: sessionOpenedAt.toISOString(),
        activeTimeSeconds: getActiveTimeSeconds(),
        type: type,
        currentIntensity: getIntensity(),
        ...extraData,
    };

    const serverUrl = getBoredomServerUrl();
    if (!serverUrl) return;

    const url = `${serverUrl}/usage`;

    try {
        // Use fetch with keepalive for 'closed' events to ensure they are sent during unload
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(report),
            keepalive: type === "closed",
        });

        if (response.ok && type !== "closed") {
            const action: ServerAction = await response.json();
            handleServerAction(action);
        }
    } catch (error) {
        // Silently fail as to not disturb the user experience if the server is down
        console.debug("Boredom Engine: Failed to send usage statistics", error);
    }
}

/**
 * Handles the action returned by the server.
 */
function handleServerAction(action: ServerAction): void {
    switch (action) {
        case "increase_intensity":
            increaseIntensity();
            break;
        case "close_tab":
            window.close();
            break;
        case "nothing":
        default:
            break;
    }
}

/**
 * Increases the current intensity to the next level.
 */
function increaseIntensity(): void {
    const current = getIntensity();
    let next: Intensity;

    switch (current) {
        case Intensity.None:
            next = Intensity.Low;
            break;
        case Intensity.Low:
            next = Intensity.Medium;
            break;
        case Intensity.Medium:
            next = Intensity.High;
            break;
        case Intensity.High:
            next = Intensity.Extreme;
            break;
        case Intensity.Extreme:
            return; // Already at max
    }

    console.log(`Boredom Engine: Increasing intensity from ${current} to ${next}`);
    setIntensity(next);
}
