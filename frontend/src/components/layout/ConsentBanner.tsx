import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "orca_consent_acknowledged";

export const ConsentBanner: React.FC = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const acknowledged = localStorage.getItem(STORAGE_KEY);
      if (!acknowledged) {
        setVisible(true);
      }
    } catch {
      // Ignore localStorage security/sandbox errors
      setVisible(false);
    }
  }, []);

  const handleAcknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie and privacy information"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md bg-surface border border-border shadow-modal rounded-xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-ink">{t("legal.cookieTitle", "Cookie & Telemetry Policy")}</p>
            <p className="text-ink-muted leading-relaxed">
              {t("notifications.cookieConsent", "ORCA uses strictly essential first-party cookies for secure sessions, CSRF protection, and language preferences. We do not use advertising trackers.")}
            </p>
            <div className="pt-1 flex items-center gap-3">
              <Link to="/privacy" className="text-primary hover:underline font-medium">
                {t("footer.privacy", "Privacy Policy")}
              </Link>
              <Link to="/terms" className="text-primary hover:underline font-medium">
                {t("footer.terms", "Terms of Use")}
              </Link>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAcknowledge}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-muted hover:text-ink transition-colors p-1"
          aria-label={t("common.close", "Dismiss banner")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={handleAcknowledge}>
          {t("notifications.acceptCookies", "Understood")}
        </Button>
      </div>
    </aside>
  );
};

