import React from "react";
import { Link } from "react-router-dom";
import { Anchor, ShieldCheck, ExternalLink } from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-base hover:opacity-90">
            <Anchor className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>ORCA</span>
          </Link>
          <span className="text-xs text-ink-muted">/ About the Project</span>
        </div>
        <Link to="/" className="text-xs text-primary hover:underline font-medium">
          &larr; Return to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 flex flex-col gap-10 text-left">
        <div className="space-y-3 pb-6 border-b border-border">
          <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
            United Nations SDG 14: Life Below Water
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            About Project ORCA
          </h1>
          <p className="text-base text-ink-muted leading-relaxed">
            Marine Ecosystem Reasoning with Collaborative AI Agents — an open sustainability research initiative developed at Bennett University.
          </p>
        </div>

        {/* Mission Statement */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Our Mission</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            India is home to over 4 million artisanal and small-scale marine fishers operating non-mechanized canoes, motorized FRP skiffs, and wooden catamarans. These operators face extreme hazards from sudden swell surges (Kallakkadal), monsoon squalls, and steep localized waves, yet standard commercial maritime tools are prohibitively complex or require high-bandwidth connections.
          </p>
          <p className="text-sm text-ink-muted leading-relaxed">
            Project ORCA bridges this gap by unifying public satellite telemetry, meteorological models, and oceanographic buoys into deterministic safety ratings and productive fishing zone guidance, accessible even on low-bandwidth 2G connections and offline PWAs.
          </p>
        </section>

        {/* Academic Context */}
        <section className="p-6 rounded-xl bg-surface border border-border shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-ink">Academic & Sustainability Context</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-mono text-ink-muted uppercase">Institution</span>
              <p className="font-semibold text-ink">Bennett University</p>
              <p className="text-ink-muted">Times of India Group, Greater Noida, UP, India</p>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-ink-muted uppercase">Academic Curriculum</span>
              <p className="font-semibold text-ink">B.Tech Semester 1</p>
              <p className="text-ink-muted">Sustainability Engineering Project • SDG 14 Target Group</p>
            </div>
          </div>
          <div className="pt-2 border-t border-border text-xs text-ink-muted">
            Project Lead: <strong>Abhilakshya</strong> • Open-source repository:{" "}
            <a
              href="https://github.com/Abhilakkkkshya505/orca_project"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 font-mono"
            >
              Abhilakkkkshya505/orca_project <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </section>

        {/* Transparency & Disclaimer */}
        <section className="p-6 rounded-xl bg-surface-raised border border-border space-y-3 text-xs text-ink-muted leading-relaxed">
          <h3 className="font-semibold text-sm text-ink flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Scientific Research Disclaimer
          </h3>
          <p>
            ORCA is developed for academic demonstration, algorithmic validation, and sustainability education. It is not an official aid to navigation (AtoN) or a certified ECDIS system. Official maritime advisories and storm warnings issued by statutory authorities (IMD, INCOIS, Indian Coast Guard) strictly supersede ORCA at all times.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-6 text-xs text-ink-muted text-center">
        <p>© 2026 Project ORCA • Marine Ecosystem Reasoning for SDG 14</p>
      </footer>
    </div>
  );
};
