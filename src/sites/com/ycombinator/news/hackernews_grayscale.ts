/**
 * @id hackernews_grayscale
 * @name Hacker News Grayscale
 * @description Desaturates the Hacker News interface to reduce visual salience.
 * @version 1.0.0
 */
import { onDOMLoaded, setGrayscale } from "$common";

onDOMLoaded(() => {
    
    setGrayscale(document.documentElement);
});
