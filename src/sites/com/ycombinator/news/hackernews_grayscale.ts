/**
 * @id hackernews_grayscale
 * @name Hacker News Grayscale
 * @description Desaturates the Hacker News interface to reduce visual salience.
 * @version 1.0.0
 */
import { currentIntensityHigherThan, getIntensity, Intensity, onDOMLoaded, setGrayscale } from "$common";

onDOMLoaded(() => {
    if (!currentIntensityHigherThan(Intensity.None)) return;
    setGrayscale(document.documentElement, getIntensity());
});
