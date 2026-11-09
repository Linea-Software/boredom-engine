/**
 * @id hackernews_limit_front_page
 * @name Hacker News Limit Front Page
 * @description Limits the number of visible Hacker News front-page stories based on intensity.
 * @version 1.0.0
 */
import { onDOMLoaded } from "$common";

const STORY_LIMIT = 15;

function hideStoryRow(story: Element): void {
    if (story instanceof HTMLElement) story.style.setProperty("display", "none", "important");
    const subtext = story.nextElementSibling;
    if (subtext instanceof HTMLElement) subtext.style.setProperty("display", "none", "important");
    const spacer = subtext?.nextElementSibling;
    if (spacer instanceof HTMLElement && spacer.classList.contains("spacer")) {
        spacer.style.setProperty("display", "none", "important");
    }
}

onDOMLoaded(() => {
    
    if (window.location.pathname !== "/" && window.location.pathname !== "/news") return;

    const stories = Array.from(document.querySelectorAll("tr.athing"));
    stories.slice(STORY_LIMIT).forEach(hideStoryRow);

    const more = document.querySelector("a.morelink");
    if (more instanceof HTMLElement && true) {
        more.style.setProperty("display", "none", "important");
    }
});
