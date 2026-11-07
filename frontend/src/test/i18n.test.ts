import { describe, it, expect } from "vitest";
import {
  SUPPORTED_LANGUAGES,
  isRtlLanguage,
  getLanguageMeta,
  normalizeLanguageCode,
  applyLanguageToDocument,
} from "../lib/i18n/languages";
import { translations } from "../lib/i18n/locales";
import i18n, { changeLanguage } from "../lib/i18n";

describe("i18n Internationalization System", () => {
  it("supports exactly 37 languages", () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(37);
  });

  it("has translations for all 37 languages", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(translations[lang.code]).toBeDefined();
      expect(translations[lang.code].nav).toBeDefined();
      expect(translations[lang.code].common).toBeDefined();
      expect(translations[lang.code].auth).toBeDefined();
      expect(translations[lang.code].dashboard).toBeDefined();
      expect(translations[lang.code].settings).toBeDefined();
    }
  });

  it("identifies RTL languages correctly", () => {
    expect(isRtlLanguage("ar")).toBe(true);
    expect(isRtlLanguage("he")).toBe(true);
    expect(isRtlLanguage("fa")).toBe(true);
    expect(isRtlLanguage("ur")).toBe(true);

    // LTR languages
    expect(isRtlLanguage("en")).toBe(false);
    expect(isRtlLanguage("hi")).toBe(false);
    expect(isRtlLanguage("ml")).toBe(false);
    expect(isRtlLanguage("ta")).toBe(false);
    expect(isRtlLanguage("es")).toBe(false);
    expect(isRtlLanguage("fr")).toBe(false);
    expect(isRtlLanguage("ja")).toBe(false);
  });

  it("normalizes locale codes properly", () => {
    expect(normalizeLanguageCode("zh-TW")).toBe("zh-TW");
    expect(normalizeLanguageCode("zh-HK")).toBe("zh-TW");
    expect(normalizeLanguageCode("zh-Hant")).toBe("zh-TW");
    expect(normalizeLanguageCode("zh-CN")).toBe("zh-CN");
    expect(normalizeLanguageCode("zh")).toBe("zh-CN");
    expect(normalizeLanguageCode("en-US")).toBe("en");
    expect(normalizeLanguageCode("es-ES")).toBe("es");
    expect(normalizeLanguageCode("unknown-lang")).toBe("en");
  });

  it("applies document lang and dir attributes correctly for LTR and RTL", () => {
    // English
    applyLanguageToDocument("en");
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");

    // Arabic (RTL)
    applyLanguageToDocument("ar");
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");

    // Hebrew (RTL)
    applyLanguageToDocument("he");
    expect(document.documentElement.lang).toBe("he");
    expect(document.documentElement.dir).toBe("rtl");

    // Hindi (LTR)
    applyLanguageToDocument("hi");
    expect(document.documentElement.lang).toBe("hi");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("changes language without page reload", async () => {
    await changeLanguage("ml");
    expect(i18n.language).toBe("ml");
    expect(document.documentElement.lang).toBe("ml");
    expect(document.documentElement.dir).toBe("ltr");

    await changeLanguage("ar");
    expect(i18n.language).toBe("ar");
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");

    // Reset back to en
    await changeLanguage("en");
    expect(i18n.language).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("retrieves language metadata with fallback", () => {
    const mlMeta = getLanguageMeta("ml");
    expect(mlMeta.name).toBe("Malayalam");
    expect(mlMeta.nativeName).toBe("മലയാളം");
    expect(mlMeta.dir).toBe("ltr");

    const arMeta = getLanguageMeta("ar");
    expect(arMeta.name).toBe("Arabic");
    expect(arMeta.nativeName).toBe("العربية");
    expect(arMeta.dir).toBe("rtl");

    const fallback = getLanguageMeta("non-existent");
    expect(fallback.code).toBe("en");
  });
});
