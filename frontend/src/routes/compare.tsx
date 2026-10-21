import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { RiskBadge } from "@/components/ui/risk-badge";
import { SeaState } from "@/components/ui/SeaState";
import { formatWaveHeight, formatWindSpeed } from "@/lib/format";
import type { RiskLevel } from "@/components/ui/risk-icons";
import {
  Anchor,
  X,
  Scale,
  Waves,
  Wind,
} from "lucide-react";

interface PortComparisonData {
  slug: string;
  name: string;
  admin1: string;
  country: string;
  level: RiskLevel;
  waveHeightM: number;
  wavePeriodS: number;
  windKmh: number;
  gustKmh: number;
  isCoastal: boolean;
}

const KNOWN_PORT_SAMPLES: Record<string, PortComparisonData> = {
  "mumbai-in": {
    slug: "mumbai-in",
    name: "Mumbai Harbour",
    admin1: "Maharashtra",
    country: "India",
    level: "caution",
    waveHeightM: 1.8,
    wavePeriodS: 8.2,
    windKmh: 18,
    gustKmh: 24,
    isCoastal: true,
  },
  "chennai-in": {
    slug: "chennai-in",
    name: "Chennai Port",
    admin1: "Tamil Nadu",
    country: "India",
    level: "safe",
    waveHeightM: 1.2,
    wavePeriodS: 7.0,
    windKmh: 14,
    gustKmh: 19,
    isCoastal: true,
  },
  "visakhapatnam-in": {
    slug: "visakhapatnam-in",
    name: "Visakhapatnam",
    admin1: "Andhra Pradesh",
    country: "India",
    level: "unsafe",
    waveHeightM: 2.6,
    wavePeriodS: 9.5,
    windKmh: 34,
    gustKmh: 46,
    isCoastal: true,
  },
  "mangalore-in": {
    slug: "mangalore-in",
    name: "New Mangalore",
    admin1: "Karnataka",
    country: "India",
    level: "safe",
    waveHeightM: 1.1,
    wavePeriodS: 6.5,
    windKmh: 12,
    gustKmh: 16,
    isCoastal: true,
  },
  "kandla-in": {
    slug: "kandla-in",
    name: "Kandla Port",
    admin1: "Gujarat",
    country: "India",
    level: "caution",
    waveHeightM: 1.6,
    wavePeriodS: 5.5,
    windKmh: 24,
    gustKmh: 32,
    isCoastal: true,
  },
  "colombo-lk": {
    slug: "colombo-lk",
    name: "Colombo Harbour",
    admin1: "Western Province",
    country: "Sri Lanka",
    level: "caution",
    waveHeightM: 2.0,
    wavePeriodS: 8.5,
    windKmh: 26,
    gustKmh: 35,
    isCoastal: true,
  },
};

export const ComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const portsParam = searchParams.get("ports") || "mumbai-in,chennai-in";
  const selectedSlugs = portsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);

  const [addSlugInput, setAddSlugInput] = useState("");

  const removeSlug = (slug: string) => {
    const updated = selectedSlugs.filter((s) => s !== slug);
    setSearchParams({ ports: updated.join(",") });
  };

  const addSlug = (slug: string) => {
    if (!slug || selectedSlugs.includes(slug) || selectedSlugs.length >= 3) return;
    const updated = [...selectedSlugs, slug];
    setSearchParams({ ports: updated.join(",") });
    setAddSlugInput("");
  };

  const portsData: PortComparisonData[] = selectedSlugs.map((slug) => {
    if (KNOWN_PORT_SAMPLES[slug]) return KNOWN_PORT_SAMPLES[slug];
    return {
      slug,
      name: slug.replace(/-/g, " ").toUpperCase(),
      admin1: "Coastal Station",
      country: "Regional",
      level: "unknown",
      waveHeightM: 1.5,
      wavePeriodS: 7.0,
      windKmh: 20,
      gustKmh: 28,
      isCoastal: true,
    };
  });

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-base hover:opacity-90">
            <Anchor className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>ORCA</span>
          </Link>
          <span className="text-xs text-ink-muted">/ Compare Ports</span>
        </div>
        <Link to="/ports" className="text-xs text-primary hover:underline font-medium">
          &larr; Back to Directory
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
              <Scale className="h-6 w-6 text-primary" />
              Side-by-Side Port Comparison
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Compare seaworthiness levels, hydrodynamic factors, and wave animation across up to 3 ports simultaneously.
            </p>
          </div>

          {selectedSlugs.length < 3 && (
            <div className="flex items-center gap-2">
              <select
                value={addSlugInput}
                onChange={(e) => {
                  addSlug(e.target.value);
                }}
                className="h-9 px-3 rounded bg-surface-raised border border-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">+ Add Port to Compare</option>
                {Object.keys(KNOWN_PORT_SAMPLES)
                  .filter((s) => !selectedSlugs.includes(s))
                  .map((s) => (
                    <option key={s} value={s}>
                      {KNOWN_PORT_SAMPLES[s].name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Side-by-side Port Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portsData.map((port) => (
            <div
              key={port.slug}
              className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4 relative"
            >
              {selectedSlugs.length > 1 && (
                <button
                  onClick={() => removeSlug(port.slug)}
                  className="absolute top-4 right-4 text-ink-muted hover:text-risk-unsafe p-1"
                  aria-label={`Remove ${port.name} from comparison`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <div className="space-y-1 pr-6">
                <span className="text-[11px] font-mono text-primary uppercase tracking-wider font-semibold">
                  {port.country} • {port.admin1}
                </span>
                <h2 className="text-xl font-bold tracking-tight">{port.name}</h2>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs text-ink-muted">Overall Safety Status</span>
                <RiskBadge level={port.level} size="md" />
              </div>

              {/* SeaState Mini-Wave */}
              <div className="rounded-lg overflow-hidden border border-border bg-surface-raised">
                <SeaState
                  waveHeightM={port.waveHeightM}
                  wavePeriodS={port.wavePeriodS}
                  windKmh={port.windKmh}
                  portName={port.name}
                  height={130}
                />
              </div>

              {/* Comparative Factors Grid */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded bg-surface-raised border border-border flex justify-between items-center">
                  <span className="font-medium text-ink-muted flex items-center gap-1.5">
                    <Waves className="h-3.5 w-3.5 text-primary" /> Significant Wave
                  </span>
                  <span className="font-mono font-bold text-ink">
                    {formatWaveHeight(port.waveHeightM)} ({port.wavePeriodS}s)
                  </span>
                </div>

                <div className="p-2.5 rounded bg-surface-raised border border-border flex justify-between items-center">
                  <span className="font-medium text-ink-muted flex items-center gap-1.5">
                    <Wind className="h-3.5 w-3.5 text-primary" /> Sustained Wind
                  </span>
                  <span className="font-mono font-bold text-ink">
                    {formatWindSpeed(port.windKmh)}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-surface-raised border border-border flex justify-between items-center">
                  <span className="font-medium text-ink-muted">Peak Wind Gusts</span>
                  <span className="font-mono text-ink-muted">
                    {formatWindSpeed(port.gustKmh)}
                  </span>
                </div>
              </div>

              <div className="pt-2 mt-auto border-t border-border flex justify-between items-center text-xs">
                <Link to={`/ports/${port.slug}`} className="text-primary hover:underline font-semibold">
                  Full 48h charts &rarr;
                </Link>
                <Link
                  to={`/explore?q=Compare%20conditions%20in%20${encodeURIComponent(port.name)}`}
                  className="text-ink-muted hover:text-ink font-mono"
                >
                  Ask ORCA
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-6 text-xs text-ink-muted text-center">
        <p>© 2026 Project ORCA • Marine Ecosystem Reasoning for SDG 14</p>
      </footer>
    </div>
  );
};
