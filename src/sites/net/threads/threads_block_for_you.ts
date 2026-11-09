/**
 * @id threads_block_for_you
 * @name Threads Block For You
 * @description Hides the Threads For You tab and switches to Following when the algorithmic tab is selected.
 * @version 1.0.0
 */
import { blockInterface, onDOMLoaded } from "$common";

{
    blockInterface({
        id: "threads_block_for_you",
        selectors: ['a[href="/for_you"]', '[role="tab"][href="/for_you"]'],
        redirect: {
            when: (url) => url.pathname === "/for_you",
            to: "https://www.threads.net/following",
        },
    });

    onDOMLoaded(() => {
        const switchToFollowing = () => {
            const tabs = Array.from(document.querySelectorAll<HTMLElement>('[role="tab"], a'));
            const forYou = tabs.find((tab) =>
                (tab.textContent ?? "").trim().toLowerCase().includes("for you"),
            );
            const following = tabs.find((tab) =>
                (tab.textContent ?? "").trim().toLowerCase().includes("following"),
            );
            if (forYou?.getAttribute("aria-selected") === "true" && following) following.click();
        };
        switchToFollowing();
        const primary = document.querySelector("main") ?? document.querySelector('[role="main"]');
        if (!primary) return;
        const observer = new MutationObserver(switchToFollowing);
        observer.observe(primary, { childList: true, subtree: true });
    });
}
