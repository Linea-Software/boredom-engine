/**
 * Downloads the latest Tampermonkey CRX and extracts it for use with --load-extension.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { Unzip } from "zip-lib";

const CRX_URL = "https://www.tampermonkey.net/crx/tampermonkey_stable.crx";
const EXT_DIR = join(import.meta.dir, "../extensions/tampermonkey");

async function main() {
    console.log(`Downloading Tampermonkey from ${CRX_URL}...`);

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
    console.log(`Saved CRX to ${crxPath}`);

    // CRX v3 format: first 8 bytes are magic ("Cr24" + version + header length),
    // followed by the ZIP header. We need to strip the CRX header.
    const crxData = new Uint8Array(buffer);

    // CRX v3 header is always at least 8 bytes (magic) + 4 (version) + 4 (header length)
    const magic = new TextDecoder().decode(crxData.slice(0, 4));
    if (magic !== "Cr24") {
        console.error("Not a valid CRX file (missing Cr24 magic)");
        process.exit(1);
    }

    const version = crxData[4];
    console.log(`CRX version: ${version}`);

    let zipStart = 0;
    if (version === 3) {
        // CRX3 format: 4 bytes magic + 4 bytes (version: 3, key_size: 0) + 4 bytes header_size
        const headerSize = new DataView(crxData.buffer, 8, 4).getUint32(
            0,
            true,
        );
        zipStart = 12 + headerSize;
    } else if (version === 2) {
        // CRX2 format: 4 bytes magic + 4 bytes version + 4 bytes pub key len + 4 bytes sig len
        const pubKeyLen = new DataView(crxData.buffer, 8, 4).getUint32(0, true);
        const sigLen = new DataView(crxData.buffer, 12, 4).getUint32(0, true);
        zipStart = 16 + pubKeyLen + sigLen;
    } else {
        console.error(`Unsupported CRX version: ${version}`);
        process.exit(1);
    }

    // Extract the ZIP portion
    const zipData = crxData.slice(zipStart);
    const zipPath = join(EXT_DIR, "extension.zip");
    await writeFile(zipPath, zipData);
    console.log(`Extracted ZIP to ${zipPath}`);

    // Extract the ZIP
    const extractDir = join(EXT_DIR, "unpacked");
    await mkdir(extractDir, { recursive: true });

    // Remove previous contents
    const unzipper = new Unzip();
    try {
        await unzipper.extract(zipPath, extractDir);
        console.log(`Extracted extension to ${extractDir}`);
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

    console.log("\n✅ Done! Tampermonkey extracted to:");
    console.log(`   ${extractDir}`);
    console.log("\nTo use it, add this to your MCP settings:");
    console.log(
        `"chrome_arg": ["--load-extension=${extractDir.replace(/\\/g, "\\\\")}"]`,
    );
}

main().catch(console.error);
