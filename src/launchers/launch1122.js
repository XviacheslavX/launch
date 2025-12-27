const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function applyMinecraftArgs(template, vars) {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replaceAll(`\${${key}}`, value);
    }
    return result.split(" ");
}

function buildClasspathFromJson(serverDir, versionJson) {
    const cp = [];

    for (const lib of versionJson.libraries) {
        const [group, name, version] = lib.name.split(":");
        const jarPath = path.join(
            serverDir,
            "libraries",
            group.replace(/\./g, "/"),
            name,
            version,
            `${name}-${version}.jar`
        );
        if (fs.existsSync(jarPath)) cp.push(jarPath);
    }

    cp.push(
        path.join(
            serverDir,
            "versions",
            versionJson.id,
            `${versionJson.id}.jar`
        )
    );

    return cp.join(";");
}

module.exports = async function launch1122({ server, user, paths, memoryArgs }) {
    const { JAVA8_PATH, SERVERS_DIR } = paths;

    const serverDir = path.join(SERVERS_DIR, server.id);

    const forgeJsonPath = path.join(
        serverDir,
        "versions",
        "Forge 1.12.2",
        "Forge 1.12.2.json"
    );

    const forgeJson = JSON.parse(fs.readFileSync(forgeJsonPath, "utf8"));
    const classpath = buildClasspathFromJson(serverDir, forgeJson);

    const nativesDir = path.join(
        serverDir,
        "versions",
        "Forge 1.12.2",
        "natives"
    );

    const gameArgs = applyMinecraftArgs(
        forgeJson.minecraftArguments,
        {
            auth_player_name: user.username,
            version_name: forgeJson.id,
            game_directory: serverDir,
            assets_root: path.join(serverDir, "assets"),
            assets_index_name: forgeJson.assets,
            auth_uuid: user.uuid,
            auth_access_token: user.token,
            user_type: "mojang"
        }
    );

    const args = [
        ...memoryArgs,
        `-Djava.library.path=${nativesDir}`,
        "-cp",
        classpath,
        forgeJson.mainClass,
        ...gameArgs
    ];

    return spawn(JAVA8_PATH, args, {
        cwd: serverDir,
        stdio: "inherit"
    });
};
