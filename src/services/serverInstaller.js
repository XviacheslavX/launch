const fs = require("fs");
const path = require("path");
const https = require("https");
const AdmZip = require("adm-zip");
const { SERVERS_DIR } = require("./paths");

const javaService = require("./java");
const { installForge1201 } = require("./forgeInstaller1201");
const { syncHttpPack } = require("./httpPackManager");


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
function buildGithubReleaseUrl(repo, tag, asset) {
    return `https://github.com/${repo}/releases/download/${tag}/${asset}`;
}

function downloadFile(url, destination, onProgress) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);

        https.get(url, res => {

            // Redirect (GitHub)
            if ([301, 302].includes(res.statusCode)) {
                file.close();
                return downloadFile(res.headers.location, destination, onProgress)
                    .then(resolve)
                    .catch(reject);
            }

            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                res.resume();
                return;
            }

            const total = parseInt(res.headers["content-length"], 10);
            let downloaded = 0;

            res.on("data", chunk => {
                downloaded += chunk.length;
                if (!isNaN(total)) {
                    const percent = Math.floor((downloaded / total) * 100);
                    onProgress?.(percent);
                }
            });

            res.pipe(file);

            file.on("finish", () => {
                file.close(() => resolve());
            });

            file.on("error", reject);
        }).on("error", reject);
    });
}

function extractZip(zipPath, targetDir) {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(targetDir, true);
}

// ------------------------------------------------------------
// MAIN INSTALLER
// ------------------------------------------------------------
async function prepareServer(server, onProgress) {
    const serverDir = path.join(SERVERS_DIR, server.id);
    const installedMarker = path.join(serverDir, ".installed");
    // ------------------------------------------------
    // JAVA CHECK (PER VERSION)
    // ------------------------------------------------
// ------------------------------------------------
// JAVA CHECK (PER VERSION)
// ------------------------------------------------

// Minecraft 1.12.2 → Java 8
    if (server.version === "1.12.2") {
        const hasJava8 = await javaService.hasJava8();

        if (!hasJava8) {
            console.log("[JAVA] Java 8 not found, installing...");
            await javaService.installJava8();
        } else {
            console.log("[JAVA] Java 8 already installed");
        }
    }

    // Minecraft 1.16.5 → Java 11
    if (server.version === "1.16.5") {
        const hasJava11 = await javaService.hasJava11();

        if (!hasJava11) {
            console.log("[JAVA] Java 11 not found, installing...");
            await javaService.installJava11();
        } else {
            console.log("[JAVA] Java 11 already installed");
        }
    }

    // Minecraft 1.20.1 → Java 17
    if (server.version === "1.20.1") {
        const hasJava17 = await javaService.hasJava17();

        if (!hasJava17) {
            console.log("[JAVA] Java 17 not found, installing...");
            await javaService.installJava17();
        } else {
            console.log("[JAVA] Java 17 already installed");
        }
    }

    // ------------------------------------------------
    // 1️⃣ Minecraft client
    // ------------------------------------------------
    if (!fs.existsSync(installedMarker)) {

        const clientUrl = buildGithubReleaseUrl(
            server.client.repo,
            server.client.tag,
            server.client.asset
        );

        if (fs.existsSync(serverDir)) {
            fs.rmSync(serverDir, { recursive: true, force: true });
        }

        fs.mkdirSync(serverDir, { recursive: true });

        const zipPath = path.join(serverDir, "client.zip");

        await downloadFile(clientUrl, zipPath, percent => {
            onProgress?.(percent);
        });

        extractZip(zipPath, serverDir);
        fs.unlinkSync(zipPath);

        fs.writeFileSync(installedMarker, server.version);
    }
    // ------------------------------------------------
    // FORGE 1.20.1
    // ------------------------------------------------
    if (server.version === "1.20.1" && server.type === "forge") {
        await installForge1201({
            serverDir,
            javaPath: javaService.JAVA17_PATH
        });
    }

    // ------------------------------------------------
    // 3️⃣ HTTP PACK (MODS / CONFIGS)
    // ------------------------------------------------
    await syncHttpPack({
        serverId: server.id,
        serverDir,
        onProgress
    });

    onProgress?.(100);
    return { status: "ready", serverDir };
}

module.exports = {
    prepareServer,
    SERVERS_DIR
};
