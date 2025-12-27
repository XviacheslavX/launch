const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function buildClasspathFromForgeJson(serverDir, versionJson) {
    const jars = [];

    for (const lib of versionJson.libraries) {
        const artifact =
            lib.downloads?.artifact ||
            lib.artifact;

        if (!artifact?.path) continue;

        const jarPath = path.join(serverDir, "libraries", artifact.path);
        if (fs.existsSync(jarPath)) {
            jars.push(jarPath);
        }
    }

    // 🔑 FORGE UNIVERSAL JAR (КРИТИЧНО)
    jars.push(
        path.join(
            serverDir,
            "libraries",
            "net",
            "minecraftforge",
            "forge",
            "1.16.5-36.2.42",
            "forge-1.16.5-36.2.42.jar"
        )
    );

    // 🔑 Minecraft client jar
    jars.push(
        path.join(serverDir, "versions", "1.16.5", "1.16.5.jar")
    );

    return jars.join(";");
}



module.exports = async function launch1165({ server, user, paths, memoryArgs }) {
    const { JAVA11_PATH, SERVERS_DIR } = paths;

    if (!fs.existsSync(JAVA11_PATH)) {
        throw new Error("Java 11 not found");
    }

    const serverDir = path.join(SERVERS_DIR, server.id);
    const versionDir = path.join(serverDir, "versions", "Forge 1.16.5");
    const jsonPath = path.join(versionDir, "Forge 1.16.5.json");

    if (!fs.existsSync(jsonPath)) {
        throw new Error("Forge 1.16.5 json not found");
    }

    const versionJson = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

    const classpath = buildClasspathFromForgeJson(serverDir, versionJson);

    const jvmArgs = [
        ...memoryArgs,
        "-Dminecraft.api.auth.host=http://localhost",
        "-Dminecraft.api.session.host=http://localhost",
        "-Dminecraft.api.services.host=http://localhost",
        "-Dminecraft.api.account.host=http://localhost",

        `-Djava.library.path=${path.join(versionDir, "natives")}`,
        "-cp",
        classpath,
        versionJson.mainClass
    ];

    const gameArgs = [
        "--username", user.username,
        "--version", versionJson.id,
        "--gameDir", serverDir,
        "--assetsDir", path.join(serverDir, "assets"),
        "--assetIndex", versionJson.assetIndex.id,

        "--uuid", "00000000-0000-0000-0000-000000000000",
        "--accessToken", "0",
        "--userType", "legacy",
        "--versionType", "release",

        // Forge
        "--launchTarget", "fmlclient",
        "--fml.forgeVersion", "36.2.42",
        "--fml.mcVersion", "1.16.5",
        "--fml.forgeGroup", "net.minecraftforge",
        "--fml.mcpVersion", "20210115.111550"
    ];

    console.log(
    "[DEBUG] modlauncher:",
    classpath.split(";").filter(p => p.includes("modlauncher"))
    );

    const mc = spawn(JAVA11_PATH, [...jvmArgs, ...gameArgs], {
        cwd: serverDir,
        stdio: "inherit"
    });

    mc.on("close", code => {
        console.log("[MC 1.16.5] Closed with code", code);
    });

    return mc;
};
