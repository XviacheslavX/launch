const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

/* =========================================================
   Resolve JVM / GAME arguments (Forge-safe)
========================================================= */
function resolveArgs(args, vars) {
    const out = [];
    const isMac = process.platform === "darwin";
    const os =
        process.platform === "win32" ? "windows" :
        process.platform === "darwin" ? "osx" : "linux";

    for (const arg of args) {
        // simple string
        if (typeof arg === "string") {
            let v = arg;
            for (const [k, val] of Object.entries(vars)) {
                v = v.replaceAll(`\${${k}}`, val);
            }
            if (v.includes("${")) continue;
            if (v === "-XstartOnFirstThread" && !isMac) continue;
            out.push(v);
            continue;
        }

        // rules-based args
        if (arg.rules) {
            let allowed = false;

            for (const rule of arg.rules) {
                // ❌ відключаємо demo / resolution / quickPlay
                if (rule.features) {
                    if (
                        rule.features.is_demo_user ||
                        rule.features.has_custom_resolution ||
                        rule.features.has_quick_plays_support ||
                        rule.features.is_quick_play_singleplayer ||
                        rule.features.is_quick_play_multiplayer ||
                        rule.features.is_quick_play_realms
                    ) {
                        allowed = false;
                        break;
                    }
                }

                if (rule.os?.name && rule.os.name !== os) continue;
                allowed = rule.action === "allow";
            }

            if (!allowed) continue;
        }

        const values = Array.isArray(arg.value) ? arg.value : [arg.value];
        for (let v of values) {
            for (const [k, val] of Object.entries(vars)) {
                v = v.replaceAll(`\${${k}}`, val);
            }
            if (!v.includes("${")) out.push(v);
        }
    }

    return out;
}


/* =========================================================
   Build classpath (LIBRARIES ONLY, NO minecraft.jar)
========================================================= */
function buildClasspath(serverDir, vanillaJson, forgeJson) {
    const jars = [];
    const sep = process.platform === "win32" ? ";" : ":";

    const addLibs = json => {
        for (const lib of json.libraries || []) {
            const art = lib.downloads?.artifact;
            if (!art?.path) continue;

            const jar = path.join(serverDir, "libraries", art.path);
            if (fs.existsSync(jar)) jars.push(jar);
        }
    };

    addLibs(vanillaJson);
    addLibs(forgeJson);

    // ❌ NEVER add minecraft client jar here
    return jars.join(sep);
}

/* =========================================================
   MAIN LAUNCHER — Forge 1.20.1
========================================================= */
module.exports = async function launch1201({ server, user, paths, memoryArgs }) {
    const { JAVA17_PATH, SERVERS_DIR } = paths;

    if (!fs.existsSync(JAVA17_PATH)) {
        throw new Error("Java 17 not found");
    }

    const serverDir = path.join(SERVERS_DIR, server.id);

    const forgeJsonPath = path.join(
        serverDir,
        "versions",
        "1.20.1-forge-47.4.13",
        "1.20.1-forge-47.4.13.json"
    );

    const vanillaJsonPath = path.join(
        serverDir,
        "versions",
        "1.20.1",
        "1.20.1.json"
    );

    const forgeJson = JSON.parse(fs.readFileSync(forgeJsonPath, "utf8"));
    const vanillaJson = JSON.parse(fs.readFileSync(vanillaJsonPath, "utf8"));

    const nativesDir = path.join(
        serverDir,
        "versions",
        "1.20.1",
        "natives"
    );

    const classpath = buildClasspath(serverDir, vanillaJson, forgeJson);

    const vars = {
        auth_player_name: user.username,
        auth_uuid: user.uuid,
        auth_access_token: user.token,
        user_type: "mojang",

        version_name: forgeJson.id,
        version_type: "release",

        game_directory: serverDir,
        assets_root: path.join(serverDir, "assets"),
        assets_index_name: vanillaJson.assets,

        natives_directory: nativesDir,
        library_directory: path.join(serverDir, "libraries"),

        classpath_separator: process.platform === "win32" ? ";" : ":",
        classpath,

        launcher_name: "Ucraft",
        launcher_version: "1.0"
    };

    const jvmArgs = resolveArgs(
        [
            ...memoryArgs,
            ...vanillaJson.arguments.jvm,
            ...forgeJson.arguments.jvm
        ],
        vars
    );

    const gameArgs = resolveArgs(
        [
            ...vanillaJson.arguments.game,
            ...forgeJson.arguments.game
        ],
        vars
    );

    console.log("[MC 1.20.1] Java:", JAVA17_PATH);
    console.log("[MC 1.20.1] MainClass:", forgeJson.mainClass);

    const mc = spawn(
        JAVA17_PATH,
        [...jvmArgs, forgeJson.mainClass, ...gameArgs],
        {
            cwd: serverDir,
            stdio: "inherit"
        }
    );

    mc.on("close", code => {
        console.log("[MC 1.20.1] Closed with code", code);
    });

    return mc;
};
