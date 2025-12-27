import { i18n } from "../../services/i18nService.js";

export async function initI18n() {
    const config = await window.api.getConfig();
    const lang = config.language || "uk";

    await i18n.load(lang);
    applyTranslations();

    const langSelect = document.getElementById("language-select");
    if (langSelect) {
        langSelect.value = lang;

        langSelect.addEventListener("change", async () => {
            const cfg = await window.api.getConfig();
            cfg.language = langSelect.value;
            await window.api.saveConfig(cfg);

            await i18n.load(cfg.language);
            applyTranslations();
        });
    }
}

function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        el.textContent = i18n.t(el.dataset.i18n);
    });
}
