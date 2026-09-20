/**
 * @id netflix_hide_top_10
 * @name Netflix Hide Top 10
 * @description Hides Netflix Top 10 and ranked-title modules that promote novelty and social proof.
 * @version 1.0.0
 */
import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.None)) {
    blockInterface({
        id: "netflix_hide_top_10",
        selectors: [".top-10-container", ".ranked-boxarts", '[data-uia*="top-10" i]', '[data-uia*="top10" i]'],
    });
}
