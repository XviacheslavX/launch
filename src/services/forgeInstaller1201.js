// src/services/forgeInstaller1201.js
const fs = require("fs");
const path = require("path");
const https = require("https");
const { spawn } = require("child_process");

/**
 * Download helper
 */
function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);

        https.get(url, res => {
            if ([301, 302].includes(res.statusCode)) {
                return download(res.headers.location, dest)
                    .then(resolve)
                    .catch(reject);
            }

            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }

            res.pipe(file);
            file.on("finish", () => file.close(resolve));
        }).on("error", reject);
    });
}

/**
 * Ensure launcher_profiles.json exists
 */
function ensureLauncherProfile(serverDir) {
    const profilePath = path.join(serverDir, "launcher_profiles.json");

    if (!fs.existsSync(profilePath)) {
        fs.writeFileSync(
            profilePath,
            JSON.stringify(
                {
                    profiles: {},
                    settings: {},
                    version: 3
                },
                null,
                2
            )
        );
    }
}

/**
 * Install Forge 1.20.1
 */
async function installForge1201({ serverDir, javaPath }) {
    const MC_VERSION = "1.20.1";
    const FORGE_VERSION = "47.4.13";
    const VERSION_ID = `${MC_VERSION}-forge-${FORGE_VERSION}`;

    const versionsDir = path.join(serverDir, "versions");
    const vanillaDir = path.join(versionsDir, MC_VERSION);
    const forgeDir = path.join(versionsDir, VERSION_ID);

    // 1️⃣ Vanilla check
    if (
        !fs.existsSync(path.join(vanillaDir, `${MC_VERSION}.json`)) ||
        !fs.existsSync(path.join(vanillaDir, `${MC_VERSION}.jar`))
    ) {
        throw new Error("Vanilla 1.20.1 is not installed");
    }

    // 2️⃣ Skip if already installed
    if (fs.existsSync(forgeDir)) {
        console.log("[FORGE] Already installed:", VERSION_ID);
        return VERSION_ID;
    }

    // 3️⃣ launcher_profiles.json
    ensureLauncherProfile(serverDir);

    // 4️⃣ Download installer
    const installerUrl =
        `https://maven.minecraftforge.net/net/minecraftforge/forge/` +
        `${MC_VERSION}-${FORGE_VERSION}/` +
        `forge-${MC_VERSION}-${FORGE_VERSION}-installer.jar`;

    const installerJar = path.join(
        serverDir,
        `forge-${MC_VERSION}-${FORGE_VERSION}-installer.jar`
    );

    console.log("[FORGE] Downloading installer...");
    await download(installerUrl, installerJar);

    // 5️⃣ Run installer
    console.log("[FORGE] Installing Forge...");

    await new Promise((resolve, reject) => {
        const proc = spawn(
            javaPath,
            ["-jar", installerJar, "--installClient"],
            {
                cwd: serverDir,
                stdio: "inherit"
            }
        );

        proc.on("close", code => {
            code === 0
                ? resolve()
                : reject(new Error(`Forge installer exited with ${code}`));
        });
    });

    fs.unlinkSync(installerJar);

    // 6️⃣ Final validation
    if (!fs.existsSync(forgeDir)) {
        throw new Error("Forge install failed");
    }

    console.log("[FORGE] Installed:", VERSION_ID);
    return VERSION_ID;
}

module.exports = {
    installForge1201
};
