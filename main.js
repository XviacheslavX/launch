// main.js
const { app, BrowserWindow, Menu } = require("electron");
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
        frame: false,
        autoHideMenuBar: true,
        titleBarStyle: "hidden",
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }
    });

    mainWindow.loadFile("src/index.html");

    // 🔴 ДОДАЙ ОЦЕ
    mainWindow.webContents.openDevTools({ mode: "detach" });
}


/* ===============================
   APP READY
================================ */
app.whenReady().then(() => {
    Menu.setApplicationMenu(null);

    createWindow();
    registerIpc(mainWindow);

    startLauncherApi();

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
