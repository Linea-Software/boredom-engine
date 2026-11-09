/**
 * @id x_block_for_you
 * @name X Block For You
 * @description Hides X's algorithmic For You tab and switches to Following when possible.
 * @version 1.0.0
 */

import { blockInterface, onDOMLoaded } from "$common";

{
    const homeRoute = (url: URL) => url.pathname === "/" || url.pathname === "/home";

    blockInterface({
        id: "x_block_for_you",
        activeWhen: homeRoute,
        selectors: [
            '[role="tablist"] > div:first-child > [role="tab"]',
            '[data-testid="ScrollSnap-List"] [role="tab"]:first-child',
        ],
    });

    onDOMLoaded(() => {
        const switchToFollowing = () => {
            if (!homeRoute(new URL(window.location.href))) return;
            const tabs = Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'));
            const forYou = tabs.find((tab) =>
                (tab.textContent ?? "").trim().toLowerCase().includes("for you"),
            );
            const following = tabs.find((tab) =>
                (tab.textContent ?? "").trim().toLowerCase().includes("following"),
            );
            if (forYou?.getAttribute("aria-selected") === "true" && following) {
                following.click();
            }
        };

        switchToFollowing();
        const primary =
            document.querySelector('[data-testid="primaryColumn"]') ??
            document.querySelector("main");
        if (!primary) return;

        const observer = new MutationObserver(switchToFollowing);
        observer.observe(primary, { childList: true, subtree: true });
    });
}
