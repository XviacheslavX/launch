const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const { ROOT_DIR, CONFIG_PATH } = require("./paths");
const systemService = require("./systemService");

const DEFAULT_CONFIG = {
    memory: {
        xms: "2G",
        xmx: "4G"
    },
    language: "uk",
    closeLauncherOnStart: true,
    gameDir: "auto"
};

function sanitizeConfig(cfg) {
    const maxRam = systemService.getRecommendedMaxRam();

    let xmx = parseInt(cfg.memory.xmx.replace("G", ""), 10);
    let xms = parseInt(cfg.memory.xms.replace("G", ""), 10);

    if (xmx > maxRam) xmx = maxRam;
    if (xms > xmx) xms = xmx;
    if (xms < 1) xms = 1;

    cfg.memory.xmx = `${xmx}G`;
    cfg.memory.xms = `${xms}G`;

    return cfg;
}

function ensureDir() {
    if (!fs.existsSync(ROOT_DIR)) {
        fs.mkdirSync(ROOT_DIR, { recursive: true });
    }
}

function loadConfig() {
    ensureDir();

    if (!fs.existsSync(CONFIG_PATH)) {
        saveConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
    }

    try {
        const data = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
        return sanitizeConfig({ ...DEFAULT_CONFIG, ...data });
    } catch {
        saveConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
    }
}


function saveConfig(config) {
    ensureDir();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

module.exports = {
    loadConfig,
    saveConfig,
    DEFAULT_CONFIG
};
