/**
 * Google Translate Headless Integration
 * 
 * Provides automated deep-DOM translation across all 37 supported languages,
 * ensuring that every single paragraph, table, scientific formula explanation,
 * card, and dynamic text node is translated into the selected language seamlessly
 * without invasive third-party bars or styling glitches.
 */

const GOOGLE_LANG_MAPPING: Record<string, string> = {
  he: "iw",       // Google Translate code for Hebrew
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
};

/**
 * Maps ORCA standard language code to Google Translate language code
 */
export function toGoogleTranslateCode(langCode: string): string {
  return GOOGLE_LANG_MAPPING[langCode] || langCode;
}

/**
 * Clears all `googtrans` cookies across all domain permutations
 */
export function clearGoogleTranslateCookies(): void {
  if (typeof document === "undefined") return;

  const hostname = window.location.hostname;
  const domainParts = hostname.split(".");
  const domains = [hostname, ""];
  if (domainParts.length > 1) {
    domains.push("." + domainParts.slice(-2).join("."));
    domains.push(domainParts.slice(-2).join("."));
  }

  const expire = "expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  for (const d of domains) {
    const domainAttr = d ? `domain=${d};` : "";
    document.cookie = `googtrans=; ${expire} path=/; ${domainAttr}`;
    document.cookie = `googtrans=/en/en; ${expire} path=/; ${domainAttr}`;
  }
}

/**
 * Sets or clears the `googtrans` cookie across all relevant domains
 */
export function setGoogleTranslateCookie(langCode: string): void {
  if (typeof document === "undefined") return;

  const hostname = window.location.hostname;
  const domainParts = hostname.split(".");
  const domains = [hostname];
  if (domainParts.length > 1) {
    domains.push("." + domainParts.slice(-2).join("."));
  }

  const isEnglish = !langCode || langCode === "en";
  const gtCode = toGoogleTranslateCode(langCode);

  if (isEnglish) {
    clearGoogleTranslateCookies();
  } else {
    // Set translation cookie from English to target language
    const val = `/en/${gtCode}`;
    document.cookie = `googtrans=${val}; path=/;`;
    for (const d of domains) {
      document.cookie = `googtrans=${val}; path=/; domain=${d};`;
    }
  }
}

/**
 * Triggers the headless Google Translate combo element to apply translation to the DOM
 */
export function triggerGoogleTranslate(langCode: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const isEnglish = !langCode || langCode === "en";
  const gtCode = toGoogleTranslateCode(langCode);

  setGoogleTranslateCookie(langCode);

  if (isEnglish) {
    clearGoogleTranslateCookies();

    // Check if the page is currently translated by Google
    const isTranslated =
      document.documentElement.classList.contains("translated-ltr") ||
      document.documentElement.classList.contains("translated-rtl") ||
      document.body.classList.contains("translated-ltr") ||
      document.body.classList.contains("translated-rtl") ||
      document.querySelector("iframe.goog-te-banner-frame");

    const select = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
    if (select) {
      // In Google Translate, empty string "" resets to original page language (English)
      select.value = "";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      select.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // Try finding Google's restore button in iframe or banner
    try {
      const bannerIframe = document.querySelector<HTMLIFrameElement>("iframe.goog-te-banner-frame");
      if (bannerIframe && bannerIframe.contentDocument) {
        const restoreBtn = bannerIframe.contentDocument.querySelector<HTMLElement>(".goog-te-button button, [id*='restore']");
        if (restoreBtn) restoreBtn.click();
      }
    } catch {
      // Cross-origin iframe security
    }

    // If DOM was modified by Google Translate, a swift page reload guarantees pristine restoration
    if (isTranslated) {
      window.location.reload();
    }
    return;
  }

  // Target is non-English language (e.g. Hindi 'hi', Arabic 'ar', etc.)
  const applyToSelect = (): boolean => {
    const select = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
    if (select) {
      if (select.value !== gtCode) {
        select.value = gtCode;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        select.dispatchEvent(new Event("input", { bubbles: true }));
      }
      return true;
    }
    return false;
  };

  if (!applyToSelect()) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (applyToSelect() || attempts > 30) {
        clearInterval(interval);
      }
    }, 120);
  }
}
