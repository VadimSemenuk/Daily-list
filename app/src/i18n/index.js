import i18n from "i18next";

import en from "./en";
import ru from "./ru";

i18n.init({
  lng: "ru",
  resources: {
    en: {
      translations: en
    },
    ru: {
      translations: ru
    }
  },
  fallbackLng: "en",
  debug: false,

  ns: ["translations"],
  defaultNS: "translations",

  keySeparator: false,

  interpolation: {
    escapeValue: false,
    formatSeparator: ","
  },

  react: {
    wait: true
  }
});

export default i18n;