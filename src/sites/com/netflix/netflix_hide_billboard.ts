/**
 * @id netflix_hide_billboard
 * @name Netflix Hide Billboard
 * @description Hides Netflix's large hero billboard while keeping ordinary browsing rows available.
 * @version 1.0.0
 */
import { blockInterface, currentIntensityHigherThan, Intensity } from "$common";

if (currentIntensityHigherThan(Intensity.None)) {
    blockInterface({
        id: "netflix_hide_billboard",
        selectors: [".billboard-row", '[data-uia="billboard"]'],
        media: { containers: [".billboard-row", '[data-uia="billboard"]'], mute: true, pause: true },
    });
}
