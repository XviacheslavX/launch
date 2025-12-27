// main.js
const { app, BrowserWindow } = require("electron");
const path = require("path");

const { registerIpc } = require("./src/ipc");
const { startLauncherApi, stopLauncherApi } = require("./src/services/launcherApi");
const { initAutoUpdater } = require("./src/services/autoUpdater");

let mainWindow;

/* ===============================
   🔒 SINGLE INSTANCE (CRITICAL)
================================ */
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
    app.quit();
    return;
}

app.on("second-instance", () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

/* ===============================
   WINDOW
================================ */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }
    });

    mainWindow.loadFile("src/index.html");
}

/* ===============================
   APP READY
================================ */
app.whenReady().then(() => {
    createWindow();
    registerIpc(mainWindow);

    // 🚀 API (safe)
    startLauncherApi();

    // 🔄 Auto updater тільки в білді
    if (app.isPackaged) {
        initAutoUpdater(mainWindow);
    } else {
        console.log("[UPDATER] Disabled in dev mode");
    }
});

/* ===============================
   CLEAN EXIT
================================ */
app.on("before-quit", () => {
    stopLauncherApi();
});
