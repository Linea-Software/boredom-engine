/**
 * @name TikTok Desaturate
 * @description Desaturates media on TikTok to reduce dopamine stimulation.
 * @version 1.0.0
 */
import { onMount, applyMediaDesaturation, injectCss } from "$common";

onMount(() => {
    applyMediaDesaturation();

    document.documentElement.style.setProperty(
        "--ui-text-primary-display",
        "156, 156, 156"
    );

    injectCss(`
        [class*="--SupBadge"] {
            background-color: gray !important;
        }
    `);
});
