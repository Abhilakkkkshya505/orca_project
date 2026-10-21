import React from "react";
import { Link } from "react-router-dom";
import { SeaState } from "@/components/ui/SeaState";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Button } from "@/components/ui/button";
import {
  Anchor,
  WifiOff,
  Compass,
  Fish,
  AlertTriangle,
} from "lucide-react";

export const OfflinePreviewPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      {/* Dev Banner */}
      <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-mono font-semibold text-center">
        DEVELOPMENT PREVIEW: Simulating Offline PWA Standalone Mode
      </div>

      {/* Header */}
      <header className="border-b border-border bg-surface px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-base">
            <Anchor className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>ORCA</span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded bg-water text-primary font-mono flex items-center gap-1">
            <WifiOff className="h-3 w-3" /> OFFLINE CACHE ACTIVE
          </span>
        </div>
        <Link to="/" className="text-xs text-primary hover:underline font-medium">
          Exit Preview
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 flex flex-col gap-8 text-left">
        <div className="space-y-2 pb-4 border-b border-border">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <WifiOff className="h-6 w-6 text-ink-muted" />
            Vessel Beyond Cellular Signal Range
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            You are operating beyond coastal LTE/5G tower reach. ORCA is serving the last synchronized forecast from local IndexedDB cache.
          </p>
        </div>

        {/* Cached Forecast Card with Static SeaState */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <span className="text-[11px] font-mono text-ink-muted uppercase">CACHED HARBOUR FORECAST</span>
              <h2 className="text-xl font-bold">Mumbai Harbour (18.93°N, 72.84°E)</h2>
              <p className="text-xs text-ink-muted mt-0.5">Cached 42 minutes ago while in port</p>
            </div>
            <RiskBadge level="caution" size="md" />
          </div>

          {/* Static SeaState representation */}
          <div className="rounded-lg overflow-hidden border border-border bg-surface-raised">
            <SeaState
              waveHeightM={1.8}
              wavePeriodS={8.0}
              swellHeightM={1.3}
              swellPeriodS={7.5}
              windKmh={22}
              portName="Mumbai Harbour"
              dataAgeMinutes={42}
              validWindow="Next 12 Hours"
              height={150}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-surface-raised border border-border">
              <span className="text-ink-muted block text-[11px]">Wave Forecast</span>
              <span className="font-bold text-ink">1.8 m (Caution &gt; 1.5m)</span>
            </div>
            <div className="p-2.5 rounded bg-surface-raised border border-border">
              <span className="text-ink-muted block text-[11px]">Wind Forecast</span>
              <span className="font-bold text-ink">22 km/h (Moderate breeze)</span>
            </div>
          </div>
        </div>

        {/* Cached Bulletins */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-risk-caution" />
            Last Cached Official Warning
          </h3>
          <div className="p-3 rounded bg-surface-raised border border-border text-xs space-y-1">
            <p className="font-semibold text-ink">INCOIS High Wave Alert: Southwest Coast</p>
            <p className="text-ink-muted leading-relaxed">
              High waves in the range of 2.2–2.8 meters are forecasted along the Maharashtra coast. Small artisanal craft advised to avoid deep-water transit until evening.
            </p>
          </div>
        </div>

        {/* Quick Actions while offline */}
        <div className="flex flex-wrap gap-4 pt-2">
          <Link to="/game">
            <Button variant="primary" className="gap-2">
              <Fish className="h-4 w-4" /> Play Marine Arcade (Zero Data)
            </Button>
          </Link>
          <Link to="/explore">
            <Button variant="secondary" className="gap-2">
              <Compass className="h-4 w-4" /> Open Offline Chart
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-6 text-xs text-ink-muted text-center">
        <p>© 2026 Project ORCA • Marine Ecosystem Reasoning for SDG 14</p>
      </footer>
    </div>
  );
};
