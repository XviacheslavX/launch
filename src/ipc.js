const { ipcMain } = require("electron");

const azuriom = require("./services/azuriom");
const javaService = require("./services/java");
const serverInstaller = require("./services/serverInstaller");
const storage = require("./services/storage");
const gameLauncher = require("./services/gameLauncher");
const configService = require("./services/configService");
const systemService = require("./services/systemService");

// ------------------------------------------------------------
// REGISTER IPC
// ------------------------------------------------------------
function registerIpc(mainWindow) {

    // ---------------- AUTH ----------------
    ipcMain.handle("login", async (_, { username, password }) => {
        const user = await azuriom.login(username, password);
        storage.saveUser(user);
        return user;
    });

    ipcMain.handle("logout", async () => {
        const user = storage.getUser();
        if (user?.token) {
            await azuriom.logout(user.token);
        }
        storage.clearUser();
        return true;
    });

    ipcMain.handle("getUser", async () => {
        const user = storage.getUser();
        if (!user) return null;

        const valid = await azuriom.verify(user.token);
        return valid ? user : null;
    });

    // ---------------- SERVERS ----------------
    ipcMain.handle("getServers", async () => {
        const fs = require("fs");
        const path = require("path");
        const file = path.join(__dirname, "..", "servers.json");
        return JSON.parse(fs.readFileSync(file, "utf8")).servers;
    });

    ipcMain.handle("selectServer", async (_, server) => {
        storage.setSelectedServer(server);
        return true;
    });

    ipcMain.handle("getSelectedServer", async () => {
        return storage.getSelectedServer();
    });

    // ---------------- JAVA ----------------
    ipcMain.handle("checkJavaVersion", () => {
        return javaService.checkJavaVersion();
    });

    ipcMain.handle("installJava8", () => {
        return javaService.installJava8();
    });

    ipcMain.handle("installJava11", () => {
        return javaService.installJava11();
    });

    ipcMain.handle("installJava17", () => {
        return javaService.installJava17();
    });

    // ---------------- INSTALL / LAUNCH ----------------
    ipcMain.handle("prepareServer", async (event, server) => {
        return serverInstaller.prepareServer(server, percent => {
            event.sender.send("server-download-progress", percent);
        });
    });

    ipcMain.handle("launchGame", async (_, { server, user }) => {
        if (mainWindow) {
            mainWindow.hide();
        }

        const mc = await gameLauncher.launchGame({
            server,
            user,
            paths: {
                JAVA8_PATH: javaService.JAVA8_PATH,
                JAVA11_PATH: javaService.JAVA11_PATH,
                JAVA17_PATH: javaService.JAVA17_PATH,
                SERVERS_DIR: serverInstaller.SERVERS_DIR
            }
        });

        mc.on("close", () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();

            // 🔔 повідомляємо renderer
            mainWindow.webContents.send("game-closed");
        }
        });

        return true;
    });
    // ---------------- CONFIG ----------------
    ipcMain.handle("getConfig", () => {
        return configService.loadConfig();
    });

    ipcMain.handle("saveConfig", (_, config) => {
        configService.saveConfig(config);
        return true;
    });
    // ---------------- SYSTEM ----------------
    ipcMain.handle("getSystemMemory", () => {
        return {
            total: systemService.getTotalMemoryGB(),
            recommendedMax: systemService.getRecommendedMaxRam()
        };
    });



}

module.exports = {
    registerIpc
};
