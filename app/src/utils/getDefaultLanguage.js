import config from "../config/config";

function getDefaultLanguage() {
    let lang = navigator.language || navigator.userLanguage || config.defaultLang;
    if (lang.indexOf("-") !== -1) {
        lang = lang.split("-")[0];
        let availableLangs = ["en", "ru", "be"];
        if (!availableLangs.find((l) => l === lang.toLowerCase())) {
            lang = config.defaultLang;
        }
    } else {
        lang = config.defaultLang;
    }

    return lang;
}

export default getDefaultLanguage;