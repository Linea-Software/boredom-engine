/**
 * @id x_random_captcha
 * @name X Random Captcha
 * @description Adds occasional security-check friction while browsing X when this intervention is enabled.
 * @version 1.0.0
 */

import { scheduleRandomCaptcha } from "$common/friction";

scheduleRandomCaptcha({ siteName: "X" });
