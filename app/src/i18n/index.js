import i18n from "i18next";

import en from "./en";
import ru from "./ru";
import be from "./be";

let init = (lang) => {
  i18n.init({
    lng: lang,
    resources: {
      en: {
        translations: en
      },
      ru: {
        translations: ru
      },
      be: {
        translations: be
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

  return i18n;
}

export default { init };