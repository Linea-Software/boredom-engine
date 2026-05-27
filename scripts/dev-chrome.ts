import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

const CHROME_DEBUG_PORT = 9222;

function findChromePath(): string {
    if (platform() === "win32") {
        // Common Chrome install paths on Windows
        const candidates = [
            join(
                process.env["PROGRAMFILES"] ?? "C:\\Program Files",
                "Google\\Chrome\\Application\\chrome.exe",
            ),
            join(
                process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)",
                "Google\\Chrome\\Application\\chrome.exe",
            ),
            join(
                process.env["LOCALAPPDATA"] ??
                    "C:\\Users\\Default\\AppData\\Local",
                "Google\\Chrome\\Application\\chrome.exe",
            ),
        ];

        for (const path of candidates) {
            if (existsSync(path)) {
                return path;
            }
        }
    } else if (platform() === "darwin") {
        const macPath =
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
        if (existsSync(macPath)) return macPath;
    } else {
        // Linux
        const candidates = [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
        ];
        for (const path of candidates) {
            if (existsSync(path)) return path;
        }
    }

    // Fallback: hope it's on PATH
    return "chrome";
}

function getUserDataDir(): string {
    // Use a dedicated profile directory so we don't conflict with running Chrome instances
    return join(homedir(), ".cache", "boredom-engine", "chrome-profile");
}

async function main() {
    const chromePath = findChromePath();
    const userDataDir = getUserDataDir();

    console.log(`🔍 Found Chrome at:         ${chromePath}`);
    console.log(`🔍 User data directory:     ${userDataDir}`);
    console.log(`🔍 Remote debugging port:   ${CHROME_DEBUG_PORT}`);
    console.log();

    // Kill existing Chrome instances so we can start fresh with our flags
    console.log("🧹 Closing existing Chrome instances...");

    if (platform() === "win32") {
        spawn("taskkill", ["/F", "/IM", "chrome.exe"], { stdio: "ignore" });
    } else {
        spawn("pkill", ["-f", "chrome"], { stdio: "ignore" });
    }

    // Wait for Chrome to shut down
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("🚀 Launching Chrome with remote debugging...");
    console.log();

    const args = [
        `--remote-debugging-port=${CHROME_DEBUG_PORT}`,
        `--user-data-dir="${userDataDir}"`,
        // Suppress warnings and popups
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-features=ChromeWhatsNewUI,ChromeTipsInMainMenu,MediaRouter",
    ];

    const child = spawn(chromePath, args, {
        stdio: "ignore",
        detached: true,
    });

    child.unref();

    console.log("✅ Chrome is starting in the background.");
    console.log(`   Profile: ${userDataDir}`);
    console.log();
    console.log(
        "📦 If this is the first run, install Tampermonkey in this Chrome window:",
    );
    console.log(
        "   https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo",
    );
    console.log("   It will persist across sessions in the dedicated profile.");
    console.log();
    console.log("⚙️  Add this to your Zed settings to connect the MCP:");
    console.log();
    console.log(`   "context_servers": {`);
    console.log(`     "chrome-devtools-mcp-zed": {`);
    console.log(`       "settings": {`);
    console.log(
        `         "browser_url": "http://127.0.0.1:${CHROME_DEBUG_PORT}"`,
    );
    console.log(`       }`);
    console.log(`     }`);
    console.log(`   }`);
    console.log();
    console.log(
        "⚠️  Close this Chrome window when done, or just leave it running.",
    );
}

main();
