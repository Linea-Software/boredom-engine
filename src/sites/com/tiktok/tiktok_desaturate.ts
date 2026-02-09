/**
 * @id tiktok_desaturate
 * @name TikTok Desaturate
 * @description Desaturates media on TikTok to reduce dopamine stimulation.
 * @version 1.0.0
 */
import {
    onDOMLoaded,
    applyMediaDesaturation,
    injectCss,
    enforceCssVariables,
    setCssVariablesToGray,
} from "$common";

// Enforce specific color values
setCssVariablesToGray([
    "--ui-shape-primary",
    "--ui-text-primary-display",
    "--tux-colorPrimary",
    "--tux-colorPrimary-tint-4",
    "--tux-colorPrimary-tint-8",
    "--tux-colorPrimary-tint-12",
    "--tux-colorLink",
]);

onDOMLoaded(() => {
    applyMediaDesaturation();

    // Backup: Inject CSS as well
    injectCss(`
        :root, html, body {
            --tux-colorLink: gray !important;
            --ui-shape-primary: 128, 128, 128 !important;
            --ui-text-primary-display: 128, 128, 128 !important;
        }
        [class*="--SupBadge"] {
            background-color: gray !important;
        }
    `);
});
