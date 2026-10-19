import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Attribution } from "@/components/layout/Attribution";
import { ShieldCheck, Anchor, Compass } from "lucide-react";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      {/* Navigation */}
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Anchor className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg tracking-tight">ORCA</span>
          <span className="text-xs px-2 py-0.5 rounded-sm bg-water text-primary font-mono">SDG 14</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link to="/explore" className="text-sm font-medium hover:text-primary transition-colors">
            Explore Map
          </Link>
          <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link to="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-left flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider bg-water px-2.5 py-1 rounded-sm w-fit">
            <Compass className="h-3.5 w-3.5" /> Marine Safety Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Marine ecosystem reasoning for safer coastal operations.
          </h1>
          <p className="text-lg text-ink-muted leading-relaxed">
            ORCA turns scattered oceanographic, satellite, and meteorological data into deterministic safety ratings and productive fishing zones for Indian coastal waters.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/explore">
              <Button size="lg" className="gap-2">
                Launch Coastal Assistant
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="secondary" size="lg">
                Create Free Account
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-6 pt-6 border-t border-border text-xs text-ink-muted">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-risk-safe" />
              <span>Deterministic Rules Engine</span>
            </div>
            <div>• Open-Meteo & INCOIS Feeds</div>
            <div>• Offline PWA Ready</div>
          </div>
        </div>

        {/* Real Labelled Sample Risk Card */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-card text-left flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <span className="text-xs font-mono text-ink-muted">FEATURED COASTAL STATION • MAHARASHTRA</span>
              <h2 className="text-xl font-semibold">Mumbai Harbour (18.93°N, 72.84°E)</h2>
            </div>
            <RiskBadge level="caution" size="md" />
          </div>

          <p className="text-xs text-ink-muted">
            Valid: Next 12 Hours • Evaluated for <strong>Small Craft (FRP / Canoe)</strong>
          </p>

          <div className="flex flex-col gap-2.5 my-2">
            <div className="flex justify-between items-center text-sm p-2 rounded bg-surface-raised border border-border">
              <span className="font-medium">Significant Wave Height</span>
              <span className="font-mono text-risk-caution font-semibold">1.8 m (Caution &gt; 1.5m)</span>
            </div>
            <div className="flex justify-between items-center text-sm p-2 rounded bg-surface-raised border border-border">
              <span className="font-medium">Sustained Wind Speed</span>
              <span className="font-mono text-risk-safe font-semibold">18 km/h (Safe &lt; 30km/h)</span>
            </div>
            <div className="flex justify-between items-center text-sm p-2 rounded bg-surface-raised border border-border">
              <span className="font-medium">Wave Period</span>
              <span className="font-mono text-risk-safe font-semibold">8.2 s (Long swell)</span>
            </div>
          </div>

          <div className="text-xs text-ink-muted bg-surface-raised p-3 rounded border border-border">
            <strong>Official Advisory:</strong> INCOIS High Swell Surge Watch active for southwest coastal belt. Official warnings override ORCA.
          </div>
        </div>
      </main>

      {/* Required Attribution Credits */}
      <Attribution />

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-6 text-xs text-ink-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ORCA Project. SDG 14: Life Below Water.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:underline">Terms of Service</Link>
            <Link to="/accessibility" className="hover:underline">Accessibility</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
