import React from "react";
import { RiskBadge } from "@/components/ui/risk-badge";
import { FactorRow, type FactorData } from "./FactorRow";
import type { RiskLevel } from "@/components/ui/risk-icons";
import { ShieldAlert, AlertTriangle, Info } from "lucide-react";

export interface RiskAssessmentData {
  id: string;
  level: RiskLevel;
  location: { lat: number; lon: number };
  valid_from: string;
  valid_to: string;
  vessel_class: "small_craft" | "mechanised";
  factors: FactorData[];
  advisories?: Array<{
    id: string;
    headline: string;
    severity: string;
    source: string;
  }>;
  missing?: string[];
  rules_version: string;
  disclaimer?: string;
  synthetic?: boolean;
}

interface RiskCardProps {
  assessment: RiskAssessmentData;
}

export const RiskCard: React.FC<RiskCardProps> = ({ assessment }) => {
  const {
    level,
    location,
    valid_from,
    valid_to,
    vessel_class,
    factors,
    advisories = [],
    missing = [],
    rules_version,
    disclaimer = "Official warnings override ORCA. Thresholds are development placeholders.",
    synthetic = false,
  } = assessment;

  const formatDate = (isoStr: string) => {
    try {
      const dt = new Date(isoStr);
      return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoStr;
    }
  };

  const vesselLabel =
    vessel_class === "mechanised"
      ? "Mechanised Vessel (Trawler/Gillnetter)"
      : "Small Craft (FRP Boat/Canoe)";

  return (
    <div className="w-full bg-surface border border-border rounded-lg p-5 shadow-card text-left flex flex-col gap-4">
      {/* Synthetic / Demo Data Banner (Rule #10) */}
      {synthetic && (
        <div className="flex items-center gap-2 p-2.5 rounded-sm bg-risk-caution-bg border border-risk-caution/30 text-risk-caution text-xs font-medium">
          <Info className="h-4 w-4 shrink-0" />
          <span>Demo data active — generated for simulation and coastal testing.</span>
        </div>
      )}

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-ink-muted uppercase tracking-wider">
              {location.lat.toFixed(2)}°N, {location.lon.toFixed(2)}°E
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-water text-primary font-medium">
              {vesselLabel}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-ink mt-0.5">Marine Safety Evaluation</h2>
          <p className="text-xs text-ink-muted">
            Window: Valid {formatDate(valid_from)} to {formatDate(valid_to)} IST
          </p>
        </div>
        <div className="self-start sm:self-center">
          <RiskBadge level={level} size="md" />
        </div>
      </div>

      {/* Active Advisories Alert Box */}
      {advisories.length > 0 && (
        <div className="flex flex-col gap-2 p-3 rounded-sm bg-risk-unsafe-bg/60 border border-risk-unsafe/30 text-left">
          <div className="flex items-center gap-1.5 text-risk-unsafe text-xs font-semibold">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Active Official Marine Bulletin</span>
          </div>
          {advisories.map((adv) => (
            <p key={adv.id} className="text-xs text-ink">
              <strong>{adv.severity.toUpperCase()}:</strong> {adv.headline} ({adv.source.toUpperCase()})
            </p>
          ))}
        </div>
      )}

      {/* Missing or Stale Data Alert Box */}
      {missing.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-sm bg-risk-unknown-bg border border-risk-unknown/30 text-ink text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 text-risk-caution" />
          <span>Missing or stale inputs: {missing.join(", ")}</span>
        </div>
      )}

      {/* Contributing Marine & Atmospheric Factors */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-muted mb-1">
          Contributing Marine Factors
        </h3>
        {factors.map((factor) => (
          <FactorRow key={factor.key} factor={factor} />
        ))}
      </div>

      {/* Card Footer with Mandatory Disclaimer and Rules Version */}
      <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px] text-ink-muted">
        <p className="font-medium text-ink/80">{disclaimer}</p>
        <div className="flex items-center gap-2 font-mono shrink-0">
          <span>Rules v{rules_version}</span>
        </div>
      </div>
    </div>
  );
};
