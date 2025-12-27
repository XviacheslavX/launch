export class I18n {
    constructor() {
        this.lang = "uk";
        this.messages = {};
    }

    async load(lang) {
        this.lang = lang;
        const res = await fetch(`./locales/${lang}.json`);
        this.messages = await res.json();
    }

    t(key) {
        return this.messages[key] || key;
    }
}

export const i18n = new I18n();
