/**
 * @id facebook_usage_stats
 * @name Facebook Usage Statistics
 * @description Tracks Facebook usage and sends reports to the local boredom server.
 * @version 1.0.0
 * @type usage
 *
 * Rules:
 * 1. Tracks if user is active (clicks, scrolls, typing).
 * 2. Tracks if a video (Reels, Watch, Feed) is currently playing.
 * 3. Sends "heartbeat" reports every 10 seconds when active.
 * 4. After 10 seconds of inactivity (no interactions and no video playing), the session is marked as inactive.
 */
import { onDOMLoaded, haltTracking, resumeTracking, sendUsageReport, stopDefaultTracking } from "$common";

const INACTIVITY_TIMEOUT_MS = 10000; // 10 seconds
const HEARTBEAT_INTERVAL_MS = 10000; // 10 seconds

let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let isActive = true;

function isVideoPlaying(): boolean {
    const videos = document.querySelectorAll('video');
    for (const video of Array.from(videos)) {
        if (!video.paused && !video.ended && video.readyState > 2) {
            return true;
        }
    }
    return false;
}

function resetInactivityTimer() {
    if (!isActive) {
        resumeTracking();
        isActive = true;
    }

    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }

    inactivityTimer = setTimeout(() => {
        if (!isVideoPlaying()) {
            haltTracking();
            isActive = false;
        } else {
            resetInactivityTimer();
        }
    }, INACTIVITY_TIMEOUT_MS);
}

function startHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
        if (isActive || isVideoPlaying()) {
            sendUsageReport("heartbeat");
        }
    }, HEARTBEAT_INTERVAL_MS);
}

onDOMLoaded(() => {
    stopDefaultTracking();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
        window.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    document.addEventListener('play', resetInactivityTimer, true);

    resetInactivityTimer();
    startHeartbeat();
});
