/**
 * @id instagram_grayscale
 * @name Instagram Grayscale
 * @description Makes Instagram media grayscale to reduce dopamine.
 * @version 1.0.0
 */
import { onDOMLoaded, applyMediaDesaturation, enforceCssVariables } from "$common";

onDOMLoaded(() => {
    applyMediaDesaturation();

    {
        // Enforce the badge color to be gray
        enforceCssVariables({
            "--ig-badge": "156, 156, 156",
        });
    }
});
