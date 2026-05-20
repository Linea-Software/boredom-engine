/**
 * @id facebook_block_sidebar
 * @name Facebook Block Sidebar
 * @description Removes sidebar elements (Marketplace, Groups, Notifications, Events, etc.) to reduce distractions.
 * @version 1.0.0
 */
import { onDOMLoaded, currentIntensityHigherThan, Intensity, injectCss } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) {
        return;
    }

    // Hide sidebar and distracting navigation elements
    injectCss(`
        /* Hide navigation sidebars - Facebook typically has left and/or right sidebars */
        [role="navigation"][aria-label*="Menu"]:not([aria-label*="Main"]):not([aria-label*="Principale"]),
        [role="navigation"]:has(a[href*="/marketplace"]),
        [role="navigation"]:has(a[href*="/groups"]),
        [role="navigation"]:has(a[href*="/events"]),
        [role="navigation"]:has(a[href*="/gaming"]),
        [role="navigation"]:has(a[href*="/watch/"]),
        [role="navigation"]:has(a[href*="/friends"]),
        [role="navigation"]:has(a[href*="/notifications"]),
        [role="complementary"],

        /* Hide specific sidebar link sections */
        a[href*="/marketplace/"],
        a[href*="/groups/"],
        a[href*="/events/"],
        a[href*="/gaming/"],
        a[href*="/pages/"],
        a[href="/friends/"],
        a[href*="/friends/list"],
        a[href*="/friends/suggestions"],
        a[href*="/saved/"],

        /* Hide notification badges */
        [aria-label*="notifications"]:not([aria-label*="turn off"]):not([aria-label*="disattiva"]),
        [aria-label*="Notificationi"],

        /* Hide "People You May Know" / friend suggestions */
        div[aria-label*="People you may know"],
        div[aria-label*="Persone che potresti conoscere"],
        div[aria-label*="Friend requests"],
        div[aria-label*="Richieste di amicizia"],
        div[aria-label*="Friends suggestions"],

        /* Hide "Birthdays" section */
        div[aria-label*="Birthdays"],
        div[aria-label*="Compleanni"],

        /* Hide contacts/chat sidebar */
        [role="navigation"][aria-label*="Contacts"],
        [role="navigation"][aria-label*="Contatti"],
        [role="navigation"][aria-label*="Chat"] {
            display: none !important;
        }
    `);

    // Also remove any "Suggested" or discovery elements
    const hideSuggestions = () => {
        const elements = document.querySelectorAll('div, section, span');
        elements.forEach(el => {
            const label = el.getAttribute('aria-label') || '';
            const text = (el as HTMLElement).textContent || '';

            if (
                label.includes('Suggested for you') ||
                label.includes('Suggeriti per te') ||
                label.includes('Suggested Groups') ||
                label.includes('Gruppi suggeriti') ||
                label.includes('Suggested Pages') ||
                label.includes('Pagine suggerite') ||
                label.includes('People you may know') ||
                label.includes('Persone che potresti conoscere')
            ) {
                (el as HTMLElement).style.display = 'none';
            }
        });
    };

    const observer = new MutationObserver(() => {
        hideSuggestions();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    hideSuggestions();
});
