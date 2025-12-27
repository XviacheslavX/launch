const fs = require("fs");
const path = require("path");
const { app } = require("electron");

// ------------------------------------------------------------
// PATHS
// ------------------------------------------------------------
const DATA_DIR = app.getPath("userData");

const FILES = {
    user: path.join(DATA_DIR, "user.json"),
    selectedServer: path.join(DATA_DIR, "selectedServer.json")
};

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
function ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function readJson(file) {
    if (!fs.existsSync(file)) return null;
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return null;
    }
}

function writeJson(file, data) {
    ensureDir();
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function deleteFile(file) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
}

// ------------------------------------------------------------
// USER
// ------------------------------------------------------------
function getUser() {
    return readJson(FILES.user);
}

function saveUser(user) {
    writeJson(FILES.user, user);
}

function clearUser() {
    deleteFile(FILES.user);
}

// ------------------------------------------------------------
// SELECTED SERVER
// ------------------------------------------------------------
function getSelectedServer() {
    return readJson(FILES.selectedServer);
}

function setSelectedServer(server) {
    writeJson(FILES.selectedServer, server);
}

function clearSelectedServer() {
    deleteFile(FILES.selectedServer);
}

module.exports = {
    getUser,
    saveUser,
    clearUser,

    getSelectedServer,
    setSelectedServer,
    clearSelectedServer
};
