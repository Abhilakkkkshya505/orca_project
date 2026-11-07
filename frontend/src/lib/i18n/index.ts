import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { translations } from "./locales";
import {
  detectBrowserLanguage,
  applyLanguageToDocument,
  getLanguageMeta,
  SUPPORTED_LANGUAGES,
  isRtlLanguage,
} from "./languages";
import { triggerGoogleTranslate } from "./googleTranslate";

// Assemble resources for i18next
const resources: Record<string, { translation: any }> = {};
for (const [code, trans] of Object.entries(translations)) {
  resources[code] = { translation: trans };
}

const initialLang = detectBrowserLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React handles escaping
  },
  react: {
    useSuspense: false,
  },
});

// Apply document attributes and trigger DOM translation on load
applyLanguageToDocument(initialLang);
if (initialLang && initialLang !== "en") {
  triggerGoogleTranslate(initialLang);
}

// On language change, update localStorage, DOM attributes, and full-DOM translation
i18n.on("languageChanged", (lng: string) => {
  try {
    localStorage.setItem("orca_language", lng);
  } catch {
    // LocalStorage quota or access denied
  }
  applyLanguageToDocument(lng);
  triggerGoogleTranslate(lng);
});

/**
 * Changes language instantly across the entire application without page reload.
 */
export async function changeLanguage(code: string): Promise<void> {
  await i18n.changeLanguage(code);
  triggerGoogleTranslate(code);
}

export { i18n, SUPPORTED_LANGUAGES, getLanguageMeta, isRtlLanguage, triggerGoogleTranslate };
export * from "./languages";
export * from "./types";
export * from "./googleTranslate";
export default i18n;
