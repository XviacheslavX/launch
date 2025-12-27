const os = require("os");

function getTotalMemoryGB() {
    const bytes = os.totalmem();
    const gb = Math.floor(bytes / 1024 / 1024 / 1024);
    return gb;
}

function getRecommendedMaxRam() {
    const total = getTotalMemoryGB();
    // 80% від фізичної
    return Math.max(1, Math.floor(total * 0.8));
}

module.exports = {
    getTotalMemoryGB,
    getRecommendedMaxRam
};
