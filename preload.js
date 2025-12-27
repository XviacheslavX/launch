// preload.js

// Тут пізніше додамо IPC-міст (contextBridge) для роботи з файловою системою,
// запуску Java, тощо. Зараз залишимо простий лог для перевірки.
const { contextBridge, ipcRenderer } = require("electron");

console.log("PRELOAD LOADED");

contextBridge.exposeInMainWorld("api", {
    login: (u, p) => ipcRenderer.invoke("login", { username: u, password: p }),
    logout: () => ipcRenderer.invoke("logout"),
    getUser: () => ipcRenderer.invoke("getUser"),
    getServers: () => ipcRenderer.invoke("getServers"),
    selectServer: id => ipcRenderer.invoke("selectServer", id),
    getSelectedServer: () => ipcRenderer.invoke("getSelectedServer"),
    checkJavaVersion: () => ipcRenderer.invoke("checkJavaVersion"),
    installJava8: () => ipcRenderer.invoke("installJava8"),
    installJava11: () => ipcRenderer.invoke("installJava11"),
    installJava17: () => ipcRenderer.invoke("installJava17"),

    prepareServer: server => ipcRenderer.invoke("prepareServer", server),
    onDownloadProgress: callback =>
    ipcRenderer.on("server-download-progress", (_, percent) => callback(percent)),
    launchGame: (server, user) => ipcRenderer.invoke("launchGame", { server, user }),
    getConfig: () => ipcRenderer.invoke("getConfig"),
    saveConfig: config => ipcRenderer.invoke("saveConfig", config),
    getSystemMemory: () => ipcRenderer.invoke("getSystemMemory"),

    onGameClosed: callback =>
        ipcRenderer.on("game-closed", callback)
});
