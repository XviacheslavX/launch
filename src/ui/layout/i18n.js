import { i18n } from "../../services/i18nService.js";

export async function initI18n() {
    const config = await window.api.getConfig();
    const lang = config.language || "uk";

    await applyLanguage(lang);

    const settingsSelect = document.getElementById("language-select");
    const topbarSelect = document.getElementById("lang-btn");

    // --- SETTINGS ---
    if (settingsSelect) {
        settingsSelect.value = lang;

        settingsSelect.addEventListener("change", async () => {
            await applyLanguage(settingsSelect.value);
        });
    }

    // --- TOPBAR ---
    if (topbarSelect) {
        topbarSelect.value = lang;

        topbarSelect.addEventListener("change", async () => {
            await applyLanguage(topbarSelect.value);
        });
    }
}

/* =========================
   CORE LANGUAGE HANDLER
========================= */
async function applyLanguage(lang) {
    const cfg = await window.api.getConfig();
    cfg.language = lang;

    await window.api.saveConfig(cfg);
    await i18n.load(lang);
    applyTranslations();

    // sync BOTH selects
    const settingsSelect = document.getElementById("language-select");
    const topbarSelect = document.getElementById("lang-btn");

    if (settingsSelect) settingsSelect.value = lang;
    if (topbarSelect) topbarSelect.value = lang;
}

/* =========================
   APPLY TEXT
========================= */
function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        el.textContent = i18n.t(el.dataset.i18n);
    });
}
