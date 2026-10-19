import React from "react";
import { Link } from "react-router-dom";
import { Compass, Anchor, MapPin, AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Anchor className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm tracking-tight">ORCA Marine</span>
        </div>
        <Link to="/" className="text-xs font-mono text-ink-muted hover:text-ink">
          Beacon ID: ERR_404_OFF_CHART
        </Link>
      </header>

      <main className="max-w-xl mx-auto w-full px-6 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-water flex items-center justify-center mx-auto border border-border">
          <Compass className="h-8 w-8 text-primary animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-primary bg-surface-raised px-2.5 py-1 rounded-sm border border-border">
            Coordinate Uncharted
          </span>
          <h1 className="text-4xl font-semibold tracking-tight">Off-Chart Waters (404)</h1>
          <p className="text-sm text-ink-muted leading-relaxed max-w-md mx-auto">
            The navigational coordinate, depth contour, or page you requested does not exist on this chart grid or has shifted outside surveyed bounds.
          </p>
        </div>

        <div className="p-4 rounded-sm bg-surface-raised border border-border text-left space-y-3">
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-primary" />
            Recommended Navigational Actions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <Link
              to="/explore"
              className="p-2.5 rounded bg-surface border border-border hover:border-primary transition-colors flex items-center gap-2 text-ink font-medium"
            >
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>Interactive Nautical Map</span>
            </Link>
            <Link
              to="/advisories"
              className="p-2.5 rounded bg-surface border border-border hover:border-primary transition-colors flex items-center gap-2 text-ink font-medium"
            >
              <AlertCircle className="h-4 w-4 text-risk-caution shrink-0" />
              <span>Active Marine Bulletins</span>
            </Link>
            <Link
              to="/login"
              className="p-2.5 rounded bg-surface border border-border hover:border-primary transition-colors flex items-center gap-2 text-ink font-medium"
            >
              <Anchor className="h-4 w-4 text-primary shrink-0" />
              <span>Sign In to Harbor Station</span>
            </Link>
            <Link
              to="/"
              className="p-2.5 rounded bg-surface border border-border hover:border-primary transition-colors flex items-center gap-2 text-ink font-medium"
            >
              <Home className="h-4 w-4 text-primary shrink-0" />
              <span>Return to Base Anchorage</span>
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <Link to="/">
            <Button size="md" className="gap-2">
              <Home className="h-4 w-4" /> Return to Safe Port (Home)
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-border bg-surface px-6 py-6 text-xs text-ink-muted text-center">
        <p>© 2026 Project ORCA • Marine Ecosystem Reasoning for SDG 14</p>
      </footer>
    </div>
  );
};
