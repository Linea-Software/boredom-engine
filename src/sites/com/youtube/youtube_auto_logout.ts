/**
 * @name YouTube Auto Logout
 * @description Automatically logs out the user (goes to youtube.com/logout) if the user has not used YouTube for at least 15 minutes.
 * @version 1.1.0
 */
import { onMount } from "$common";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const LAST_ACTIVE_KEY = "be_yt_last_active";

function performLogout() {
    console.log("User inactive for 15 minutes. Logging out...");
    // Update last active time to prevent immediate re-trigger loop when returning to home page
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    window.location.href = "https://www.youtube.com/logout";
}

onMount(() => {
    let logoutTimer: number;
    let isThrottled = false;

    const checkAndScheduleLogout = () => {
        const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
        const lastActive = lastActiveStr
            ? parseInt(lastActiveStr, 10)
            : Date.now();
        const now = Date.now();
        const inactiveDuration = now - lastActive;

        if (inactiveDuration >= IDLE_TIMEOUT_MS) {
            performLogout();
        } else {
            // User was active recently (possibly in another tab), schedule next check
            // Add a small buffer (1s) to ensure we cross the threshold on next run
            const remainingTime = IDLE_TIMEOUT_MS - inactiveDuration + 1000;
            clearTimeout(logoutTimer);
            logoutTimer = window.setTimeout(
                checkAndScheduleLogout,
                remainingTime
            );
        }
    };

    const handleActivity = () => {
        if (isThrottled) return;

        // Update persistence
        localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());

        // Reset local timer
        clearTimeout(logoutTimer);
        logoutTimer = window.setTimeout(
            checkAndScheduleLogout,
            IDLE_TIMEOUT_MS
        );

        // Throttle to avoid excessive storage writes
        isThrottled = true;
        window.setTimeout(() => {
            isThrottled = false;
        }, 1000);
    };

    // --- Initial Load Check ---
    const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
    if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        if (Date.now() - lastActive > IDLE_TIMEOUT_MS) {
            performLogout();
            return; // Stop execution, we are navigating away
        }
    }

    // If we are here, we are active now.
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    logoutTimer = window.setTimeout(checkAndScheduleLogout, IDLE_TIMEOUT_MS);

    // --- Event Listeners ---
    const activityEvents = [
        "mousemove",
        "keydown",
        "scroll",
        "click",
        "touchstart",
    ];

    activityEvents.forEach((event) => {
        window.addEventListener(event, handleActivity, { passive: true });
    });

    // Handle visibility change (e.g. returning to tab after long time)
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            checkAndScheduleLogout();
        }
    });

    console.log(
        "YouTube Auto Logout script loaded. Idle timeout set to 15 minutes (with persistence)."
    );
});
