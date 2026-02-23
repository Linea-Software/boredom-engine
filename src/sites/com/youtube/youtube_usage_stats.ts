/**
 * @id youtube-usage-stats
 * @name YouTube Usage Statistics
 * @description Tracks YouTube usage and sends reports to the local boredom server.
 * @version 1.0.0
 * 
 * Rules:
 * 1. Tracks if user is active (clicks, scrolls, typing).
 * 2. Tracks if a video is currently playing.
 * 3. Sends "heartbeat" reports every 10 seconds when active.
 * 4. After 10 seconds of inactivity (no interactions and no video playing), the session is marked as inactive.
 */

import { onDOMLoaded, initUsageTracking, haltTracking, resumeTracking, sendUsageReport, stopDefaultTracking } from "$common";

const INACTIVITY_TIMEOUT_MS = 10000; // 10 seconds
const HEARTBEAT_INTERVAL_MS = 10000; // 10 seconds

let inactivityTimer: Timer | null = null;
let heartbeatTimer: Timer | null = null;
let isActive = true;

function resetInactivityTimer() {
    if (!isActive) {
        resumeTracking();
        isActive = true;
    }

    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }

    inactivityTimer = setTimeout(() => {
        // Only halt if no video is playing
        if (!isVideoPlaying()) {
            haltTracking();
            isActive = false;
        } else {
            // If video is playing, we are still "active" in terms of consumption, 
            // so we keep resetting the timer as long as it plays.
            resetInactivityTimer();
        }
    }, INACTIVITY_TIMEOUT_MS);
}

function isVideoPlaying(): boolean {
    const videos = document.querySelectorAll('video');
    for (const video of Array.from(videos)) {
        if (!video.paused && !video.ended && video.readyState > 2) {
            return true;
        }
    }
    return false;
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
    // Disable default tracking as we implement custom video-aware logic here
    stopDefaultTracking();

    // Interaction listeners
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
        window.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    // Video play/pause listeners to ensure accurate tracking during consumption
    document.addEventListener('play', resetInactivityTimer, true);

    // Initial timer setup
    resetInactivityTimer();
    startHeartbeat();
});
