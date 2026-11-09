/**
 * @id hackernews_hide_comment_counts
 * @name Hacker News Hide Comment Counts
 * @description Hides comment-count and discuss links while preserving story age and author links.
 * @version 1.0.0
 */
import { onDOMLoaded } from "$common";

onDOMLoaded(() => {

    document.querySelectorAll<HTMLAnchorElement>(".subtext a").forEach((link) => {
        const label = (link.textContent ?? "").trim().toLowerCase();
        if (label === "discuss" || /\bcomments?$/.test(label)) {
            link.style.setProperty("visibility", "hidden", "important");
        }
    });
});
