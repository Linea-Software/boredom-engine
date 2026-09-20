/**
 * @id snapchat_random_captcha
 * @name Snapchat Random Captcha
 * @description Adds occasional security-check friction while browsing Snapchat Web at high intensity.
 * @version 1.0.0
 */
import { scheduleRandomCaptcha } from "$common/friction";
scheduleRandomCaptcha({ siteName: "Snapchat" });
