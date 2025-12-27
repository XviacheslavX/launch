const launch1122 = require("../launchers/launch1122");
const launch1165 = require("../launchers/launch1165");
const launch1201 = require("../launchers/launch1201");
const configService = require("./configService");

async function launchGame({ server, user, paths }) {
    const config = configService.loadConfig();

    const memoryArgs = [
        `-Xms${config.memory.xms}`,
        `-Xmx${config.memory.xmx}`
    ];

    switch (server.version) {
        case "1.12.2":
            return launch1122({ server, user, paths, memoryArgs });

        case "1.16.5":
            return launch1165({ server, user, paths, memoryArgs });

        case "1.20.1":
            return launch1201({ server, user, paths, memoryArgs });

        default:
            throw new Error(`Unsupported Minecraft version: ${server.version}`);
    }
}


module.exports = {
    launchGame
};
