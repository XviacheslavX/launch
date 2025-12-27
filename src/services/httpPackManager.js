const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { URL } = require("url");

/* =========================================================
   HELPERS
========================================================= */

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function isDirectory(p) {
    return p.endsWith("/");
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith("https") ? https : http;

        lib.get(url, res => {
            if ([301, 302].includes(res.statusCode)) {
                return fetchJson(res.headers.location)
                    .then(resolve)
                    .catch(reject);
            }

            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }

            let data = "";
            res.on("data", d => data += d);
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on("error", reject);
    });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        ensureDir(path.dirname(dest));

        const file = fs.createWriteStream(dest);
        const lib = url.startsWith("https") ? https : http;

        lib.get(url, res => {
            if ([301, 302].includes(res.statusCode)) {
                file.close();
                return downloadFile(res.headers.location, dest)
                    .then(resolve)
                    .catch(reject);
            }

            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }

            res.pipe(file);
            file.on("finish", () => file.close(resolve));
        }).on("error", reject);
    });
}

/* =========================================================
   DIRECTORY LISTING (SIMPLE INDEX)
   👉 очікуємо, що сервер віддає список файлів (nginx autoindex або json)
========================================================= */

async function fetchFileList(url) {
    // ⚠️ На першому етапі очікуємо JSON:
    // { "files": ["a.jar", "b.jar"] }

    const data = await fetchJson(url + "/index.json");
    return data.files || [];
}

/* =========================================================
   MAIN
========================================================= */

async function syncHttpPack({ serverId, serverDir, onProgress }) {
    const manifestUrl = `http://mysize.local.test/storage/${serverId}/manifest.json`;
    const localVersionFile = path.join(serverDir, ".remote-pack.json");

    onProgress?.(0);

    // 1️⃣ Manifest
    const manifest = await fetchJson(manifestUrl);

    const {
        version,
        baseUrl,
        installOnce = [],
        alwaysUpdate = [],
        ignore = []
    } = manifest;

    // 2️⃣ installOnce
    for (const item of installOnce) {
        const localPath = path.join(serverDir, item);
        if (fs.existsSync(localPath)) continue;

        const remoteUrl = `${baseUrl}/${item}`;
        if (isDirectory(item)) {
            ensureDir(localPath);
        } else {
            await downloadFile(remoteUrl, localPath);
        }
    }

    // 3️⃣ alwaysUpdate
    for (const folder of alwaysUpdate) {
        const localFolder = path.join(serverDir, folder);
        const remoteFolderUrl = `${baseUrl}/${folder.replace(/\/$/, "")}`;

        ensureDir(localFolder);

        const remoteFiles = await fetchFileList(remoteFolderUrl);
        const localFiles = fs.existsSync(localFolder)
            ? fs.readdirSync(localFolder)
            : [];

        // download / update
        for (const file of remoteFiles) {
            const remoteFileUrl = `${remoteFolderUrl}/${file}`;
            const localFilePath = path.join(localFolder, file);
            await downloadFile(remoteFileUrl, localFilePath);
        }

        // delete removed
        for (const file of localFiles) {
            if (!remoteFiles.includes(file)) {
                fs.rmSync(path.join(localFolder, file), { force: true });
            }
        }
    }

    // 4️⃣ save version
    fs.writeFileSync(
        localVersionFile,
        JSON.stringify({ version }, null, 2)
    );

    onProgress?.(100);

    return { version };
}

module.exports = {
    syncHttpPack
};
