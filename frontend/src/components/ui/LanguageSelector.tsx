import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Globe,
  Check,
  Search,
  X,
  ChevronDown,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  SUPPORTED_LANGUAGES,
  getLanguageMeta,
  changeLanguage,
  type LanguageMeta,
} from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";

interface LanguageSelectorProps {
  variant?: "button" | "dropdown" | "settings";
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = "button",
  className = "",
}) => {
  const { i18n, t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentMeta = useMemo(() => {
    return getLanguageMeta(i18n.language);
  }, [i18n.language]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Categories
  const categories = [
    { id: "all", label: t("common.allLanguages", "All (37)") },
    { id: "quick", label: "Featured (EN / HI)" },
    { id: "indic", label: "South Asian (14)" },
    { id: "europe", label: "European (10)" },
    { id: "rtl", label: "RTL (4)" },
    { id: "asia", label: "East / SE Asian (8)" },
  ];

  const quickCodes = new Set(["en", "hi"]);
  const indicCodes = new Set([
    "hi", "ml", "ta", "te", "kn", "bn", "pa", "mr", "gu", "or", "as", "ur", "ne", "si"
  ]);
  const europeCodes = new Set([
    "en", "es", "fr", "de", "it", "pt", "nl", "ru", "pl", "uk", "tr"
  ]);
  const rtlCodes = new Set(["ar", "he", "fa", "ur"]);
  const asiaCodes = new Set([
    "zh-CN", "zh-TW", "ja", "ko", "th", "vi", "id", "ms"
  ]);

  const filteredLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.filter((lang) => {
      // Category filter
      if (activeCategory === "quick" && !quickCodes.has(lang.code)) return false;
      if (activeCategory === "indic" && !indicCodes.has(lang.code)) return false;
      if (activeCategory === "europe" && !europeCodes.has(lang.code)) return false;
      if (activeCategory === "rtl" && !rtlCodes.has(lang.code)) return false;
      if (activeCategory === "asia" && !asiaCodes.has(lang.code)) return false;

      // Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q) ||
        lang.region.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeCategory]);

  const handleSelectLanguage = async (lang: LanguageMeta) => {
    try {
      await changeLanguage(lang.code);
      setIsOpen(false);
      setSearchQuery("");
      toast.success(
        t("notifications.languageChanged", {
          name: `${lang.name} (${lang.nativeName})`,
          defaultValue: `Language changed to ${lang.name} (${lang.nativeName})`,
        })
      );
    } catch {
      toast.error("Failed to change language");
    }
  };

  // Render for settings page (inline selection card)
  if (variant === "settings") {
    return (
      <div className={`space-y-4 notranslate ${className}`} translate="no">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-surface-raised/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">
                  {currentMeta.name} ({currentMeta.nativeName})
                </span>
                {currentMeta.dir === "rtl" && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-wider font-semibold rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    RTL
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted">
                {currentMeta.region} • {currentMeta.code.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-surface border border-border hover:border-primary/50 text-ink hover:text-primary transition-colors shadow-xs"
          >
            <span>{t("common.selectLanguage", "Change Language")}</span>
            <ChevronDown className="w-4 h-4 text-ink-muted" />
          </button>
        </div>

        {/* Modal picker */}
        {isOpen && renderModal()}
      </div>
    );
  }

  // Render button variant (for Navbar, AppShell, Footer, Explore)
  return (
    <div className={`relative notranslate ${className}`} translate="no" ref={modalRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("common.language", "Select language")}
        title={t("common.language", "Select language")}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-secondary hover:text-ink hover:bg-surface-raised border border-border/60 hover:border-border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 notranslate"
        translate="no"
      >
        <Globe className="w-3.5 h-3.5 text-primary" />
        <span className="hidden sm:inline-block max-w-[90px] truncate font-medium">
          {currentMeta.nativeName}
        </span>
        <span className="sm:hidden font-mono text-[11px] uppercase">
          {currentMeta.code.slice(0, 2)}
        </span>
        {currentMeta.dir === "rtl" && (
          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono">
            RTL
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-ink-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && renderModal()}
    </div>
  );

  function renderModal() {
    const englishMeta = getLanguageMeta("en");
    const hindiMeta = getLanguageMeta("hi");

    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 notranslate"
        translate="no"
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-modal-title"
      >
        <div
          ref={modalRef}
          className="w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-surface border-t sm:border border-border shadow-overlay overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 text-left notranslate"
          translate="no"
          dir="ltr"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-surface-raised/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 id="language-modal-title" className="text-sm sm:text-base font-semibold text-ink font-heading flex items-center gap-2 truncate">
                  <span>Choose Language</span>
                  <span className="text-[10px] sm:text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    37 languages
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs text-ink-muted truncate">
                  Full localization with RTL layout support
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Access: English & Hindi Pinned Bar */}
          <div className="px-4 py-3 bg-primary/5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5" /> Popular / Primary:
            </span>
            <div className="flex items-center gap-2 flex-1">
              {/* English Button */}
              <button
                type="button"
                onClick={() => handleSelectLanguage(englishMeta)}
                className={`flex-1 flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  i18n.language === "en"
                    ? "bg-primary text-on-primary border-primary shadow-xs"
                    : "bg-surface hover:bg-surface-raised border-border text-ink hover:text-primary"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">🇬🇧</span>
                  <span className="font-bold">English (Default)</span>
                </span>
                {i18n.language === "en" ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <span className="text-[10px] uppercase font-mono opacity-60">EN</span>
                )}
              </button>

              {/* Hindi Button */}
              <button
                type="button"
                onClick={() => handleSelectLanguage(hindiMeta)}
                className={`flex-1 flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  i18n.language === "hi"
                    ? "bg-primary text-on-primary border-primary shadow-xs"
                    : "bg-surface hover:bg-surface-raised border-border text-ink hover:text-primary"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">🇮🇳</span>
                  <span className="font-bold">हिन्दी (Hindi)</span>
                </span>
                {i18n.language === "hi" ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <span className="text-[10px] uppercase font-mono opacity-60">HI</span>
                )}
              </button>
            </div>
          </div>

          {/* Search bar & filter pills */}
          <div className="p-4 border-b border-border/60 bg-surface space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 37 languages (e.g. Hindi, English, Malayalam, Español, Arabic...)"
                className="w-full pl-9 pr-9 py-2 text-sm rounded-xl bg-surface-raised/60 border border-border text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all notranslate"
                translate="no"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface-raised/70 text-ink-secondary hover:text-ink hover:bg-surface-raised"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Languages Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {filteredLanguages.length === 0 ? (
              <div className="text-center py-12 text-ink-muted space-y-2">
                <Globe className="w-8 h-8 mx-auto opacity-40 text-primary" />
                <p className="text-sm font-medium">No language found matching "{searchQuery}"</p>
                <p className="text-xs">Try searching for the English name, native script, or code.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredLanguages.map((lang) => {
                  const isSelected = i18n.language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-150 group notranslate ${
                        isSelected
                          ? "bg-primary/10 border-primary shadow-xs"
                          : "bg-surface-raised/30 hover:bg-surface-raised border-border/60 hover:border-border"
                      }`}
                      translate="no"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-medium text-sm text-ink group-hover:text-primary transition-colors notranslate"
                            translate="no"
                            dir={lang.dir}
                          >
                            {lang.nativeName}
                          </span>
                          {lang.dir === "rtl" && (
                            <span className="px-1.5 py-0.2 text-[9px] font-mono font-semibold rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              RTL
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-ink-muted notranslate" translate="no">
                          <span className="truncate">{lang.name}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px] uppercase tracking-wide opacity-80">
                            {lang.code}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-border/80 group-hover:border-primary/40 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with Reset to English action */}
          <div className="p-3 sm:px-5 border-t border-border bg-surface-raised/30 flex items-center justify-between text-xs text-ink-muted">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-medium text-ink">
                Active: {currentMeta.name} ({currentMeta.nativeName})
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectLanguage(englishMeta)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised text-ink hover:text-primary font-medium text-xs transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-primary" />
              <span>Reset to English</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
};
