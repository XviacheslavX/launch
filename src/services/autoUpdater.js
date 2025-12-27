const { autoUpdater } = require("electron-updater");
const { dialog } = require("electron");

function initAutoUpdater(mainWindow) {
    autoUpdater.autoDownload = false;

    autoUpdater.on("update-available", () => {
        dialog.showMessageBox(mainWindow, {
            type: "info",
            title: "Оновлення",
            message: "Доступна нова версія лаунчера. Завантажити?",
            buttons: ["Так", "Пізніше"]
        }).then(res => {
            if (res.response === 0) {
                autoUpdater.downloadUpdate();
            }
        });
    });

    autoUpdater.on("update-downloaded", () => {
        dialog.showMessageBox(mainWindow, {
            title: "Оновлення готове",
            message: "Перезапустити лаунчер для встановлення?",
            buttons: ["Перезапустити"]
        }).then(() => {
            autoUpdater.quitAndInstall();
        });
    });

    autoUpdater.on("error", err => {
        console.error("[UPDATER]", err);
    });

    autoUpdater.checkForUpdates();
}

module.exports = {
    initAutoUpdater
};
