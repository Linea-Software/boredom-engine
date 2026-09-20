/**
 * @id threads_random_captcha
 * @name Threads Random Captcha
 * @description Adds occasional security-check friction while browsing Threads at high intensity.
 * @version 1.0.0
 */
import { scheduleRandomCaptcha } from "$common/friction";
scheduleRandomCaptcha({ siteName: "Threads" });
