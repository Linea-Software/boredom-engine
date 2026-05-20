/**
 * One-time project setup script.
 *
 * 1. Installs dependencies (bun install)
 * 2. Downloads & extracts the latest Tampermonkey CRX for use with --load-extension
 * 3. Writes the required chrome_arg into .zed/settings.json so the MCP browser loads Tampermonkey
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Unzip } from "zip-lib";

const PROJECT_ROOT = join(import.meta.dir, "..");
const EXT_DIR = join(PROJECT_ROOT, "extensions", "tampermonkey");
const ZED_SETTINGS_PATH = join(PROJECT_ROOT, ".zed", "settings.json");
const CRX_URL = "https://www.tampermonkey.net/crx/tampermonkey_stable.crx";

// ── Step 1: Install dependencies ──────────────────────────────────────────

async function installDependencies(): Promise<void> {
    console.log("📦 Installing dependencies...");
    const proc = Bun.spawn(["bun", "install"], {
        cwd: PROJECT_ROOT,
        stdout: "inherit",
        stderr: "inherit",
    });
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
        console.error("Failed to install dependencies");
        process.exit(1);
    }
    console.log("✅ Dependencies installed\n");
}

// ── Step 2: Download & extract Tampermonkey ────────────────────────────────

async function fetchTampermonkey(): Promise<string> {
    console.log("🌐 Downloading Tampermonkey...");

    const response = await fetch(CRX_URL);
    if (!response.ok) {
        console.error(
            `Failed to download: ${response.status} ${response.statusText}`,
        );
        process.exit(1);
    }

    const buffer = await response.arrayBuffer();
    const crxPath = join(EXT_DIR, "tampermonkey.crx");

    await mkdir(EXT_DIR, { recursive: true });
    await writeFile(crxPath, new Uint8Array(buffer));

    // Strip CRX header to get the ZIP payload
    const crxData = new Uint8Array(buffer);
    const magic = new TextDecoder().decode(crxData.slice(0, 4));
    if (magic !== "Cr24") {
        console.error("Not a valid CRX file (missing Cr24 magic)");
        process.exit(1);
    }

    const version = crxData[4];
    let zipStart = 0;
    if (version === 3) {
        const headerSize = new DataView(crxData.buffer, 8, 4).getUint32(
            0,
            true,
        );
        zipStart = 12 + headerSize;
    } else if (version === 2) {
        const pubKeyLen = new DataView(crxData.buffer, 8, 4).getUint32(0, true);
        const sigLen = new DataView(crxData.buffer, 12, 4).getUint32(0, true);
        zipStart = 16 + pubKeyLen + sigLen;
    } else {
        console.error(`Unsupported CRX version: ${version}`);
        process.exit(1);
    }

    const zipPath = join(EXT_DIR, "extension.zip");
    await writeFile(zipPath, crxData.slice(zipStart));

    const extractDir = join(EXT_DIR, "unpacked");
    await mkdir(extractDir, { recursive: true });

    const unzipper = new Unzip();
    try {
        await unzipper.extract(zipPath, extractDir);
    } catch (e) {
        console.error("Failed to extract ZIP:", e);
        process.exit(1);
    }

    // Clean up intermediate files
    try {
        const { unlink } = await import("node:fs/promises");
        await unlink(zipPath);
        await unlink(crxPath);
    } catch {}

    console.log(`✅ Tampermonkey extracted to: ${extractDir}\n`);
    return extractDir;
}

// ── Step 3: Write chrome_arg into .zed/settings.json ─────────────────────

async function writeZedSettings(extractDir: string): Promise<void> {
    console.log("🔧 Updating .zed/settings.json...");

    const posixPath = extractDir.split("\\").join("/");

    const zedDir = join(PROJECT_ROOT, ".zed");
    await mkdir(zedDir, { recursive: true });

    const content =
        JSON.stringify(
            {
                context_servers: {
                    "chrome-devtools-mcp-zed": {
                        settings: {
                            chrome_arg: [`--load-extension=${posixPath}`],
                        },
                    },
                },
            },
            null,
            4,
        ) + "\n";

    await writeFile(ZED_SETTINGS_PATH, content, "utf-8");
    console.log(`✅ .zed/settings.json updated with chrome_arg\n`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log("═══════════════════════════════════════════");
    console.log("  Boredom Engine — Project Setup");
    console.log("═══════════════════════════════════════════\n");

    await installDependencies();
    const extractDir = await fetchTampermonkey();
    await writeZedSettings(extractDir);

    console.log("═══════════════════════════════════════════");
    console.log("  ✅ All done!");
    console.log("═══════════════════════════════════════════");
}

main().catch(console.error);
