const launch1122 = require("./launch1122");
const launch1165 = require("./launch1165");
const launch1201 = require("./launch1201");

async function launchGame({ server, user, paths }) {
    switch (server.version) {
        case "1.12.2":
            return launch1122({ server, user, paths });

        case "1.16.5":
            return launch1165({ server, user, paths });

        case "1.20.1":
            return launch1201({ server, user, paths });

        default:
            throw new Error(`Unsupported Minecraft version: ${server.version}`);
    }
}

module.exports = {
    launchGame
};
