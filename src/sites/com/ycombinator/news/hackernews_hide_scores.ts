/**
 * @id hackernews_hide_scores
 * @name Hacker News Hide Scores
 * @description Hides story point scores to reduce popularity-driven browsing.
 * @version 1.0.0
 */
import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.None)) {
    blockInterface({ id: "hackernews_hide_scores", selectors: [".score"] });
}
