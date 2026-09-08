/**
 * @id facebook_block_sidebar
 * @name Facebook Block Sidebar
 * @description Hides distracting Facebook sidebars, discovery links, suggestions, and chat surfaces.
 * @version 1.1.0
 */

import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.None)) {
    blockInterface({
        id: "facebook_block_sidebar",
        selectors: [
            '[role="navigation"][aria-label*="Menu"]:not([aria-label*="Main"])',
            '[role="navigation"]:has(a[href*="/marketplace"])',
            '[role="navigation"]:has(a[href*="/groups"])',
            '[role="navigation"]:has(a[href*="/events"])',
            '[role="navigation"]:has(a[href*="/gaming"])',
            '[role="navigation"]:has(a[href*="/watch/"])',
            '[role="navigation"]:has(a[href*="/friends"])',
            '[role="complementary"]',
            'a[href*="/marketplace/"]',
            'a[href*="/groups/"]',
            'a[href*="/events/"]',
            'a[href*="/gaming/"]',
            'a[href*="/pages/"]',
            'a[href="/friends/"]',
            'a[href*="/friends/list"]',
            'a[href*="/friends/suggestions"]',
            'a[href*="/saved/"]',
            '[data-pagelet="ChatTab"]',
            '[aria-label="New Message"]',
            '[aria-label="New message"]',
            'div[aria-label*="Messenger"]',
            'div[aria-label*="People you may know"]',
            'div[aria-label*="Friend requests"]',
            'div[aria-label*="Friends suggestions"]',
            'div[aria-label*="Suggested for you"]',
            'div[aria-label*="Suggested Groups"]',
            'div[aria-label*="Suggested Pages"]',
            'div[aria-label*="Birthdays"]',
            '[role="navigation"][aria-label*="Contacts"]',
            '[role="navigation"][aria-label*="Chat"]',
        ],
    });
}
