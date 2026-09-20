/**
 * @id pinterest_random_captcha
 * @name Pinterest Random Captcha
 * @description Adds occasional security-check friction while browsing Pinterest at high intensity.
 * @version 1.0.0
 */
import { scheduleRandomCaptcha } from "$common/friction";
scheduleRandomCaptcha({ siteName: "Pinterest" });
