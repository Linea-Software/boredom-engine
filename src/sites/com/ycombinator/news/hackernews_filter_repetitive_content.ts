/**
 * @id hackernews_filter_repetitive_content
 * @name Hacker News Filter Repetitive Content
 * @description Caps repeated front-page stories from the same domain using a simple local intensity-based limit.
 * @version 1.0.0
 */
import { currentIntensityHigherThan, getIntensity, Intensity, onDOMLoaded } from "$common";

const DOMAIN_LIMIT: Record<Intensity, number> = {
    [Intensity.None]: Number.POSITIVE_INFINITY,
    [Intensity.Low]: 5,
    [Intensity.Medium]: 3,
    [Intensity.High]: 2,
    [Intensity.Extreme]: 1,
};

function hideStory(story: HTMLElement): void {
    story.style.setProperty("display", "none", "important");
    const subtext = story.nextElementSibling;
    if (subtext instanceof HTMLElement) subtext.style.setProperty("display", "none", "important");
    const spacer = subtext?.nextElementSibling;
    if (spacer instanceof HTMLElement && spacer.classList.contains("spacer")) {
        spacer.style.setProperty("display", "none", "important");
    }
}

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) return;
    const maxPerDomain = DOMAIN_LIMIT[getIntensity()];
    const seen = new Map<string, number>();

    document.querySelectorAll<HTMLElement>("tr.athing").forEach((story) => {
        const domain = story.querySelector(".sitestr")?.textContent?.trim().toLowerCase();
        if (!domain) return;
        const count = (seen.get(domain) ?? 0) + 1;
        seen.set(domain, count);
        if (count > maxPerDomain) hideStory(story);
    });
});
