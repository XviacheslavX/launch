const path = require("path");
const { app } = require("electron");

const APPDATA = app.getPath("appData"); // Roaming
const ROOT_DIR = path.join(APPDATA, "Ucraft");

const RUNTIME_DIR = path.join(ROOT_DIR, "runtime");
const JAVA_DIR = path.join(RUNTIME_DIR, "java");

const GAME_DIR = path.join(ROOT_DIR, "game");
const SERVERS_DIR = path.join(GAME_DIR, "servers");
const CONFIG_PATH = path.join(ROOT_DIR, "config.json");

module.exports = {
    ROOT_DIR,
    RUNTIME_DIR,
    JAVA_DIR,

    GAME_DIR,
    SERVERS_DIR,
    CONFIG_PATH
};
