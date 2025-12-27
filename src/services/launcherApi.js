// src/services/launcherApi.js
const http = require("http");
const azuriom = require("./azuriom");
const storage = require("./storage");

const HOST = "127.0.0.1";
const PORT = 38291;

let serverInstance = null;

/* ===============================
   START API
================================ */
function startLauncherApi() {
    if (serverInstance) {
        console.log("[LAUNCHER API] already running");
        return serverInstance;
    }

    const server = http.createServer(async (req, res) => {

        if (req.method !== "POST" || req.url !== "/launcher/token") {
            res.writeHead(404);
            return res.end();
        }

        const user = storage.getUser();
        if (!user || !user.token) {
            res.writeHead(401);
            return res.end("NOT_AUTHENTICATED");
        }

        try {
            const token = await azuriom.getLauncherToken(user.token);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ token }));
        } catch (e) {
            res.writeHead(500);
            res.end("TOKEN_ERROR");
        }
    });

    server.listen(PORT, HOST, () => {
        console.log(`[LAUNCHER API] Listening on http://${HOST}:${PORT}`);
    });

    serverInstance = server;
    return server;
}

/* ===============================
   STOP API
================================ */
function stopLauncherApi() {
    if (serverInstance) {
        serverInstance.close(() => {
            console.log("[LAUNCHER API] stopped");
        });
        serverInstance = null;
    }
}

module.exports = {
    startLauncherApi,
    stopLauncherApi,
    PORT
};
