import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowLeft, Eye, Keyboard, SunMedium, Volume2 } from "lucide-react";
import { RiskBadge } from "@/components/ui/risk-badge";

export const AccessibilityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Home
        </Link>
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm tracking-tight">Accessibility</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-12 text-left space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Accessibility Statement</h1>
          <p className="text-xs font-mono text-ink-muted mt-2">
            Target Conformance: WCAG 2.1 Level AA • Validated: October 2026
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">1. Our Commitment to Universal Marine Access</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Project ORCA is committed to ensuring digital accessibility for all seafarers, coastal communities, fisheries researchers, and maritime authorities—regardless of physical, visual, motor, or cognitive abilities, and across harsh outdoor environmental conditions such as bright midday glare on open waters.
          </p>
          <p className="text-sm text-ink-muted leading-relaxed">
            We target full compliance with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards across all web interfaces and PWA components.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-ink">2. Maritime Usability & Color Independence</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Safety at sea requires instantaneous, unambiguous recognition. In compliance with WCAG 1.4.1 (Use of Color), ORCA never conveys risk level solely through color. Every risk output is strictly encoded through four redundant channels:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-surface-raised border border-border rounded-sm flex items-center justify-between">
              <div>
                <p className="font-semibold text-xs text-ink">Safe Condition</p>
                <p className="text-[11px] text-ink-muted">Circle shape • Solid checkmark</p>
              </div>
              <RiskBadge level="safe" size="md" />
            </div>

            <div className="p-3 bg-surface-raised border border-border rounded-sm flex items-center justify-between">
              <div>
                <p className="font-semibold text-xs text-ink">Caution Condition</p>
                <p className="text-[11px] text-ink-muted">Diamond shape • Warning triangle</p>
              </div>
              <RiskBadge level="caution" size="md" />
            </div>

            <div className="p-3 bg-surface-raised border border-border rounded-sm flex items-center justify-between">
              <div>
                <p className="font-semibold text-xs text-ink">Unsafe Condition</p>
                <p className="text-[11px] text-ink-muted">Octagon shape • Shield exclamation</p>
              </div>
              <RiskBadge level="unsafe" size="md" />
            </div>

            <div className="p-3 bg-surface-raised border border-border rounded-sm flex items-center justify-between">
              <div>
                <p className="font-semibold text-xs text-ink">Unknown / Stale Data</p>
                <p className="text-[11px] text-ink-muted">Dotted circle • Question glyph</p>
              </div>
              <RiskBadge level="unknown" size="md" />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <SunMedium className="h-5 w-5 text-primary" />
            <span>3. High Contrast & High-Glare Visibility</span>
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Artisanal boat operators frequently use mobile devices in direct tropical sunlight. Our nautical chart palette adheres to strict contrast ratios:
          </p>
          <ul className="text-sm text-ink-muted list-disc list-inside space-y-1.5 pl-2">
            <li>Text against background maintains a minimum contrast ratio of <strong>7.2:1</strong> (exceeding WCAG AAA for normal text).</li>
            <li>Interactive elements and focus indicators maintain at least <strong>3:1</strong> contrast with adjacent colors.</li>
            <li>Risk status indicators feature high-chroma fills paired with dark text to remain legible under polarizer-filtered sunglasses.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <span>4. Keyboard Accessibility and Focus Navigation</span>
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            All user flows—including authentication, chat query streaming, waypoint selection, and advisory filtering—are fully operable via standard keyboard commands without a pointing device:
          </p>
          <ul className="text-sm text-ink-muted list-disc list-inside space-y-1.5 pl-2">
            <li>Logical tab order throughout the DOM hierarchy.</li>
            <li>Visible 2px high-contrast outline focus ring on all interactive elements.</li>
            <li>Dedicated <strong className="text-ink">&quot;Use this point&quot;</strong> keyboard-accessible control on the map interface to avoid drag/click dependencies.</li>
            <li>Modal dialogs trap focus and close gracefully on Escape key press.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <span>5. Assistive Technology & Screen Readers</span>
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Tested for compatibility with NVDA, JAWS, and VoiceOver:
          </p>
          <ul className="text-sm text-ink-muted list-disc list-inside space-y-1.5 pl-2">
            <li>ARIA live regions (<code className="font-mono text-xs bg-surface-raised px-1 py-0.5 border border-border">aria-live=&quot;polite&quot;</code>) announce newly generated safety reasoning and SSE tokens without overwhelming speech synthesis.</li>
            <li>MapLibre WebGL canvas contains off-screen semantic fallback descriptions detailing active coordinates, swell, and wind vectors in text format.</li>
            <li>Data tables include structured headers (<code className="font-mono text-xs bg-surface-raised px-1 py-0.5 border border-border">&lt;th scope=&quot;col&quot;&gt;</code>) and row associations.</li>
          </ul>
        </section>

        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-lg font-semibold text-ink">6. Feedback and Assistance</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            If you encounter any accessibility barrier or have suggestions for improving accessibility at sea, please notify our team:
          </p>
          <div className="text-xs font-mono text-ink-muted bg-surface-raised p-3 rounded-sm border border-border flex items-center justify-between">
            <span>Accessibility Coordinator: accessibility@orca-marine.org</span>
            <span className="text-risk-safe flex items-center gap-1 font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Actively Monitored
            </span>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface px-6 py-6 text-xs text-ink-muted text-center">
        <p>© 2026 Project ORCA • Marine Ecosystem Reasoning for SDG 14</p>
      </footer>
    </div>
  );
};
