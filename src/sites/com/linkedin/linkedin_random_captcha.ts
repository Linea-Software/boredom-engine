/**
 * @id linkedin_random_captcha
 * @name LinkedIn Random Captcha
 * @description Adds occasional security-check friction while browsing LinkedIn at high intensity.
 * @version 1.0.0
 */

import { scheduleRandomCaptcha } from "$common/friction";

scheduleRandomCaptcha({ siteName: "LinkedIn" });
