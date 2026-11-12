import { describe, expect, test } from "bun:test";
import {
    parseLiveOptions, validateCdpUrl, validateSiteUrl,
} from "../../tests/live/options.ts";

describe("live-site CLI safeguards", () => {
    test("selects the YouTube Shorts scenario", () => {
        expect(parseLiveOptions(["--site", "youtube", "--script", "youtube_shorts_remove", "--headed"])).toMatchObject({
            site: "youtube", script: "youtube_shorts_remove", headed: true,
            timeoutMs: 30000, skipBuild: false,
        });
    });

    test("accepts a same-site HTTPS page", () => {
        expect(validateSiteUrl("youtube", "https://www.youtube.com/watch?v=abc"))
            .toBe("https://www.youtube.com/watch?v=abc");
        expect(validateSiteUrl("reddit", "https://old.reddit.com/"))
            .toBe("https://old.reddit.com/");
    });

    test("rejects external hosts, credentials, cleartext HTTP and ports", () => {
        for (const url of [
            "http://www.youtube.com/", "https://youtube.com.evil.test/",
            "https://fakeyoutube.com/", "https://user:pass@www.youtube.com/",
            "https://www.youtube.com:8443/",
        ]) {
            expect(() => validateSiteUrl("youtube", url)).toThrow();
        }
    });

    test("only accepts loopback CDP endpoints", () => {
        expect(validateCdpUrl("http://127.0.0.1:9222")).toBe("http://127.0.0.1:9222/");
        for (const url of [
            "http://192.168.1.5:9222", "https://localhost:9222",
            "http://example.com:9222", "http://root:pw@localhost:9222",
            "http://localhost:9222/json/version",
        ]) {
            expect(() => validateCdpUrl(url)).toThrow();
        }
    });

    test("rejects missing or mismatched scenario and unsafe arguments", () => {
        const base = ["--site", "youtube", "--script", "youtube_shorts_remove"];
        expect(() => parseLiveOptions(["--site", "reddit", "--script", "youtube_shorts_remove"])).toThrow();
        expect(() => parseLiveOptions(["--site", "youtube", "--script", "unknown"])).toThrow();
        expect(() => parseLiveOptions([...base, "--timeout-ms", "nan"])).toThrow();
        expect(() => parseLiveOptions([...base, "--timeout-ms", "0"])).toThrow();
        expect(() => parseLiveOptions([...base, "--url", "https://reddit.com/"])).toThrow();
        expect(() => parseLiveOptions([...base, "--whatever"])).toThrow();
        expect(() => parseLiveOptions([...base, "--headed", "--headed"])).toThrow();
        expect(() => parseLiveOptions([...base, "--cdp-url", "http://localhost:9222", "--profile-dir", "/tmp/profile"])).toThrow();
    });

    test("help is available without a site", () => {
        expect(parseLiveOptions(["--help"])).toBeNull();
    });
});
