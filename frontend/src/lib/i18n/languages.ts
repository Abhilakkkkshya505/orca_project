export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  region: string;
  badge?: string;
}

export const RTL_LANGUAGES = new Set(["ar", "he", "fa", "ur"]);

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  // Indic / South Asian Languages
  { code: "en", name: "English", nativeName: "English", dir: "ltr", region: "Global" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr", region: "India" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", dir: "ltr", region: "India (Kerala)" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", dir: "ltr", region: "India / Sri Lanka" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", dir: "ltr", region: "India (Andhra / Telangana)" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", dir: "ltr", region: "India (Karnataka)" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", dir: "ltr", region: "India / Bangladesh" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", dir: "ltr", region: "India / Pakistan" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", dir: "ltr", region: "India (Maharashtra)" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", dir: "ltr", region: "India (Gujarat)" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", dir: "ltr", region: "India (Odisha)" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", dir: "ltr", region: "India (Assam)" },
  { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl", region: "South Asia / Global", badge: "RTL" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", dir: "ltr", region: "Nepal / India" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල", dir: "ltr", region: "Sri Lanka" },

  // European Languages
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", region: "Spain / Latin America" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr", region: "France / Global" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", region: "Germany / Austria" },
  { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr", region: "Italy" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr", region: "Portugal / Brazil" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", dir: "ltr", region: "Netherlands / Belgium" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr", region: "Eastern Europe / Central Asia" },
  { code: "pl", name: "Polish", nativeName: "Polski", dir: "ltr", region: "Poland" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", dir: "ltr", region: "Ukraine" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr", region: "Turkey" },

  // Middle Eastern / RTL Languages
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", region: "Middle East / North Africa", badge: "RTL" },
  { code: "he", name: "Hebrew", nativeName: "עברית", dir: "rtl", region: "Israel", badge: "RTL" },
  { code: "fa", name: "Persian", nativeName: "فارسی", dir: "rtl", region: "Iran / Middle East", badge: "RTL" },

  // East & Southeast Asian Languages
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", dir: "ltr", region: "China / Singapore" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", dir: "ltr", region: "Taiwan / Hong Kong" },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr", region: "Japan" },
  { code: "ko", name: "Korean", nativeName: "한국어", dir: "ltr", region: "South Korea" },
  { code: "th", name: "Thai", nativeName: "ไทย", dir: "ltr", region: "Thailand" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", dir: "ltr", region: "Vietnam" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", dir: "ltr", region: "Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", dir: "ltr", region: "Malaysia / Singapore" },

  // African Languages
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", dir: "ltr", region: "East Africa" },
];

export const LANGUAGE_MAP = new Map<string, LanguageMeta>(
  SUPPORTED_LANGUAGES.map((lang) => [lang.code, lang])
);

export function isRtlLanguage(code: string): boolean {
  const normalized = normalizeLanguageCode(code);
  return RTL_LANGUAGES.has(normalized);
}

export function getLanguageMeta(code: string): LanguageMeta {
  const normalized = normalizeLanguageCode(code);
  return LANGUAGE_MAP.get(normalized) || SUPPORTED_LANGUAGES[0];
}

/**
 * Normalizes browser locale codes to our supported codes (e.g., 'zh-Hans', 'zh-CN' -> 'zh-CN')
 */
export function normalizeLanguageCode(code: string): string {
  if (!code) return "en";
  const lower = code.toLowerCase().trim();

  if (lower.startsWith("zh-tw") || lower.startsWith("zh-hk") || lower.startsWith("zh-hant")) {
    return "zh-TW";
  }
  if (lower.startsWith("zh")) {
    return "zh-CN";
  }

  const baseCode = lower.split("-")[0];
  if (LANGUAGE_MAP.has(baseCode)) {
    return baseCode;
  }
  if (LANGUAGE_MAP.has(code)) {
    return code;
  }

  return "en";
}

/**
 * Detects the user's preferred browser language
 */
export function detectBrowserLanguage(): string {
  if (typeof window === "undefined" || !window.navigator) {
    return "en";
  }

  // 1. Saved preference in localStorage
  try {
    const saved = localStorage.getItem("orca_language");
    if (saved && LANGUAGE_MAP.has(saved)) {
      return saved;
    }
  } catch {
    // Ignore localStorage errors
  }

  // 2. Browser languages list
  const browserLanguages = window.navigator.languages || [window.navigator.language];
  for (const lang of browserLanguages) {
    if (!lang) continue;
    const normalized = normalizeLanguageCode(lang);
    if (LANGUAGE_MAP.has(normalized)) {
      return normalized;
    }
  }

  return "en";
}

/**
 * Updates DOM document element with language and direction attributes
 */
export function applyLanguageToDocument(code: string) {
  if (typeof document === "undefined") return;
  const meta = getLanguageMeta(code);
  const dir = meta.dir;

  document.documentElement.lang = meta.code;
  document.documentElement.dir = dir;
  
  // Also tag data-dir for tailwind/custom CSS styling
  document.documentElement.setAttribute("data-dir", dir);
  document.documentElement.setAttribute("data-lang", meta.code);
}
