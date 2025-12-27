const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");
const { execFile, exec } = require("child_process");

const { JAVA_DIR } = require("./paths");

const JAVA8_PATH  = path.join(JAVA_DIR, "jre8",  "bin", "java.exe");
const JAVA11_PATH = path.join(JAVA_DIR, "jre11", "bin", "java.exe");
const JAVA17_PATH = path.join(JAVA_DIR, "jre17", "bin", "java.exe");


/* =========================================================
   CHECK JAVA
========================================================= */
function checkJava(javaPath) {
    return new Promise(resolve => {
        execFile(javaPath, ["-version"], (error, stdout, stderr) => {
            if (error) return resolve(null);
            const match = stderr.toString().match(/version "(\d+\.\d+)/);
            if (!match) return resolve(null);
            resolve(match[1]);
        });
    });
}

async function checkJavaVersion() {
    if (fs.existsSync(JAVA8_PATH)) {
        const ver = await checkJava(JAVA8_PATH);
        if (ver) return { found: true, version: ver, path: JAVA8_PATH };
    }

    if (fs.existsSync(JAVA11_PATH)) {
        const ver = await checkJava(JAVA11_PATH);
        if (ver) return { found: true, version: ver, path: JAVA11_PATH };
    }

    if (fs.existsSync(JAVA17_PATH)) {
        const ver = await checkJava(JAVA17_PATH);
        if (ver) return { found: true, version: ver, path: JAVA17_PATH };
    }

    return { found: false };
}

/* =========================================================
   DOWNLOAD JAVA (ZIP)
========================================================= */
function downloadJava(url, targetDir) {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(targetDir, { recursive: true });

        const zipPath = path.join(targetDir, "java.zip");
        const tempExtractDir = path.join(targetDir, "_temp");

        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        if (fs.existsSync(tempExtractDir)) {
            fs.rmSync(tempExtractDir, { recursive: true, force: true });
        }

        const command =
            `powershell -Command "Invoke-WebRequest -Uri '${url}' -OutFile '${zipPath}'"`;

        exec(command, err => {
            if (err) return reject(err);

            fs.mkdirSync(tempExtractDir, { recursive: true });

            fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: tempExtractDir }))
                .on("close", () => {
                    try { fs.unlinkSync(zipPath); } catch {}

                    // знайти java.exe
                    const findJava = dir => {
                        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
                            const full = path.join(dir, item.name);
                            if (item.isDirectory()) {
                                const found = findJava(full);
                                if (found) return found;
                            } else if (item.name === "java.exe") {
                                return full;
                            }
                        }
                        return null;
                    };

                    const javaExe = findJava(tempExtractDir);
                    if (!javaExe) return reject("java.exe not found");

                    const javaRoot = path.dirname(path.dirname(javaExe));

                    const copy = (src, dst) => {
                        if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
                        for (const e of fs.readdirSync(src, { withFileTypes: true })) {
                            const s = path.join(src, e.name);
                            const d = path.join(dst, e.name);
                            e.isDirectory() ? copy(s, d) : fs.copyFileSync(s, d);
                        }
                    };

                    copy(javaRoot, targetDir);
                    fs.rmSync(tempExtractDir, { recursive: true, force: true });

                    resolve(true);
                })
                .on("error", reject);
        });
    });
}

/* =========================================================
   INSTALLERS
========================================================= */
function installJava8() {
    return downloadJava(
        "https://download.bell-sw.com/java/8u402+7/bellsoft-jre8u402+7-windows-amd64.zip",
        path.join(JAVA_DIR, "jre8")
    );
}

function installJava11() {
    return downloadJava(
        "https://github.com/adoptium/temurin11-binaries/releases/download/jdk-11.0.22+7/OpenJDK11U-jre_x64_windows_hotspot_11.0.22_7.zip",
        path.join(JAVA_DIR, "jre11")
    );
}

function installJava17() {
    return downloadJava(
        "https://download.bell-sw.com/java/17.0.10+13/bellsoft-jre17.0.10+13-windows-amd64.zip",
        path.join(JAVA_DIR, "jre17")
    );
}

/* =========================================================
   HAS JAVA
========================================================= */
async function hasJava8() {
    return fs.existsSync(JAVA8_PATH) && !!(await checkJava(JAVA8_PATH));
}

async function hasJava11() {
    return fs.existsSync(JAVA11_PATH) && !!(await checkJava(JAVA11_PATH));
}

async function hasJava17() {
    return fs.existsSync(JAVA17_PATH) && !!(await checkJava(JAVA17_PATH));
}

module.exports = {
    JAVA8_PATH,
    JAVA11_PATH,
    JAVA17_PATH,

    checkJavaVersion,

    installJava8,
    installJava11,
    installJava17,

    hasJava8,
    hasJava11,
    hasJava17
};
