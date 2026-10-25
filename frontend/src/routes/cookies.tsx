import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, Shield } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export const CookiePolicyPage: React.FC = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    essential: true,
    functional: true,
    telemetry: true,
  });

  const handleSave = () => {
    localStorage.setItem("orca_cookie_consent", JSON.stringify(preferences));
    toast.success("Cookie preferences saved.");
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16 text-left space-y-8">
      {/* Title Header */}
      <div className="space-y-3 pb-6 border-b border-border">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase font-mono">
          <Cookie className="h-4 w-4" />
          <span>Transparency & Privacy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-ink">
          Cookie Policy
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          Last revised: October 25, 2026 • Compliant with GDPR, ePrivacy Directive & Digital Personal Data Protection (DPDP) Act.
        </p>
      </div>

      {/* Summary Banner */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-card flex items-start gap-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
          <Shield className="h-6 w-6" />
        </div>
        <div className="space-y-1.5 text-xs text-ink leading-relaxed">
          <h3 className="font-bold text-sm">ORCA Zero-Tracking Guarantee</h3>
          <p className="text-ink-muted">
            ORCA is an open, mission-driven marine safety platform advancing UN SDG 14. We do not sell your personal data, employ cross-site tracking pixels, or use third-party behavioral advertising cookies. We only use cookies strictly required for security, session authentication, and telemetry caching.
          </p>
        </div>
      </div>

      {/* Interactive Cookie Settings */}
      <section className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="font-heading font-bold text-base text-ink">Your Cookie Preferences</h2>
            <p className="text-xs text-ink-muted">Customize how ORCA stores local state in your browser.</p>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-hover transition-all"
          >
            Save Preferences
          </button>
        </div>

        <div className="space-y-4">
          {/* Essential */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-raised border border-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-ink">1. Strictly Necessary & Security Cookies</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  Always Required
                </span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Essential for securing API requests, preventing Cross-Site Request Forgery (CSRF), and maintaining authenticated captain sessions (<code className="font-mono text-primary">csrftoken</code>, <code className="font-mono text-primary">sessionid</code>).
              </p>
            </div>
            <input type="checkbox" checked disabled className="mt-1 h-4 w-4 rounded text-primary opacity-60" />
          </div>

          {/* Functional */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-raised border border-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-ink">2. Functional & Preference Storage</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary">
                  Functional
                </span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Remembers your nautical display units (metric vs. nautical knots), dark/light theme, and basemap preferences.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.functional}
              onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
              className="mt-1 h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          {/* Telemetry Cache */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-raised border border-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-ink">3. Offline Oceanographic Telemetry Cache</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                  Performance
                </span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Stores recent wave height, swell period, and wind speed datasets locally so mariners operating in low-connectivity coastal waters can view telemetry offline.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.telemetry}
              onChange={(e) => setPreferences({ ...preferences, telemetry: e.target.checked })}
              className="mt-1 h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* Detailed Technical Breakdown */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-xl text-ink">Detailed Cookie Inventory</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-xs divide-y divide-border">
            <thead className="bg-surface-raised font-mono font-bold uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-[11px] text-ink">
              <tr className="hover:bg-surface-raised/50">
                <td className="px-4 py-3 font-bold text-primary">csrftoken</td>
                <td className="px-4 py-3">Current Host</td>
                <td className="px-4 py-3 font-sans">Protects against unauthorized form submissions and CSRF attacks</td>
                <td className="px-4 py-3">1 Year</td>
                <td className="px-4 py-3 font-sans">First-party / Essential</td>
              </tr>
              <tr className="hover:bg-surface-raised/50">
                <td className="px-4 py-3 font-bold text-primary">sessionid</td>
                <td className="px-4 py-3">Current Host</td>
                <td className="px-4 py-3 font-sans">Maintains captain authentication across page transitions</td>
                <td className="px-4 py-3">14 Days</td>
                <td className="px-4 py-3 font-sans">First-party / Essential</td>
              </tr>
              <tr className="hover:bg-surface-raised/50">
                <td className="px-4 py-3 font-bold text-primary">orca_theme</td>
                <td className="px-4 py-3">localStorage</td>
                <td className="px-4 py-3 font-sans">Stores light, dark, or chart paper aesthetic choice</td>
                <td className="px-4 py-3">Persistent</td>
                <td className="px-4 py-3 font-sans">Functional</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* How to Manage Cookies in Browsers */}
      <section className="space-y-3">
        <h2 className="font-heading font-bold text-xl text-ink">Managing Cookies in Your Browser</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          You can restrict or block cookies at any time through your browser settings. Please note that disabling essential cookies will prevent authentication into the ORCA Bridge Dashboard:
        </p>
        <ul className="text-xs text-ink-muted space-y-1.5 list-disc list-inside">
          <li><strong>Google Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data</li>
          <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Enhanced Tracking Protection</li>
          <li><strong>Apple Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
          <li><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions &gt; Manage and delete cookies</li>
        </ul>
      </section>

      {/* Contact & Legal Inquiries */}
      <div className="pt-6 border-t border-border flex items-center justify-between text-xs text-ink-muted">
        <span>Questions regarding our cookie architecture?</span>
        <Link to="/contact" className="text-primary font-bold hover:underline">
          Contact Data Protection Officer &rarr;
        </Link>
      </div>
    </div>
  );
};
