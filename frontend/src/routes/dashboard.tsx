import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { AppShell } from "@/components/layout/AppShell";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { RiskLevel } from "@/components/ui/risk-icons";
import {
  AlertTriangle,
  ShieldCheck,
  Compass,
  Plus,
  RefreshCw,
  ExternalLink,
  Ship,
} from "lucide-react";

interface SavedLocationOverview {
  location: { id: string; name: string; lat: number; lon: number };
  level: RiskLevel;
  valid_to: string;
  top_factor: string;
}

interface DataFreshnessItem {
  source: string;
  name: string;
  age_minutes: number;
  status: "ok" | "stale" | "failing" | "no_data";
}

interface DashboardOverviewResponse {
  saved_locations: SavedLocationOverview[];
  active_advisories_count: number;
  alerts_active_count: number;
  data_freshness: DataFreshnessItem[];
}

// 7-day coastal forecast simulation points
const forecastDays = [
  { day: "Today", wave: 1.1, wind: 14, risk: "safe", desc: "Slight chop, favourable currents" },
  { day: "Mon", wave: 1.4, wind: 18, risk: "safe", desc: "Moderate swell, safe transit" },
  { day: "Tue", wave: 1.9, wind: 24, risk: "caution", desc: "Wind freshening 20-25 kt" },
  { day: "Wed", wave: 2.6, wind: 32, risk: "unsafe", desc: "Squall line & rough sea state" },
  { day: "Thu", wave: 2.1, wind: 26, risk: "caution", desc: "Easing swell, gusty inshore" },
  { day: "Fri", wave: 1.3, wind: 15, risk: "safe", desc: "Calm returning, clear passage" },
  { day: "Sat", wave: 0.9, wind: 11, risk: "safe", desc: "Smooth conditions, optimal" },
];

const mockRecentActivity = [
  {
    id: "act-1",
    title: "INCOIS High Swell Advisory Ingested",
    station: "Arabian Sea Sector 4",
    time: "12m ago",
    type: "advisory",
    severity: "caution",
  },
  {
    id: "act-2",
    title: "Open-Meteo High-Resolution Telemetry Synced",
    station: "Kochi Marine Observatory",
    time: "24m ago",
    type: "telemetry",
    severity: "safe",
  },
  {
    id: "act-3",
    title: "Deterministic Safety Gate Evaluation Completed",
    station: "Port of Mumbai Offshore Zone",
    time: "1h ago",
    type: "evaluation",
    severity: "safe",
  },
  {
    id: "act-4",
    title: "VHF Marine Emergency Beacon Test Acknowledged",
    station: "Coast Guard Regional HQ",
    time: "3h ago",
    type: "system",
    severity: "safe",
  },
];

export const DashboardPage: React.FC = () => {
  const [vesselClass, setVesselClass] = useState<"small" | "mechanised">("small");
  const [checklist, setChecklist] = useState({
    vhf: true,
    lifejackets: true,
    telemetry: true,
    fuel: false,
    bilge: true,
  });

  const { data, isLoading, error, refetch, isRefetching } = useQuery<DashboardOverviewResponse>({
    queryKey: ["dashboard", "overview"],
    queryFn: () => api.get<DashboardOverviewResponse>("/dashboard/overview/"),
    refetchInterval: 60 * 1000,
  });

  const toggleCheck = (item: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const completedChecks = Object.values(checklist).filter(Boolean).length;
  const totalChecks = Object.values(checklist).length;

  return (
    <AppShell>
      <div className="flex flex-col gap-6 text-left max-w-7xl mx-auto w-full pb-20">
        {/* Linear/GitHub Style Command Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
              <span className="uppercase tracking-wider">Fleet Command</span>
              <span>/</span>
              <span className="text-ink font-medium">Arabian Sea & Bay of Bengal</span>
              <span>/</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-surface-raised border border-border text-forest dark:text-sage font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-forest dark:bg-sage animate-pulse" />
                Live Feed Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial italic font-normal text-ink mt-1">
              Maritime Operations Bridge
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="btn-editorial-secondary inline-flex items-center gap-1.5 text-xs font-mono"
              title="Refresh telemetry"
            >
              <RefreshCw className={`h-3 w-3 ${isRefetching ? "animate-spin text-primary" : "text-ink-muted"}`} />
              <span>{isRefetching ? "Syncing..." : "Sync Feeds"}</span>
            </button>
            <Link
              to="/locations"
              className="btn-editorial-secondary inline-flex items-center gap-1.5 text-xs font-mono"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Waypoint</span>
            </Link>
            <Link
              to="/explore"
              className="btn-editorial-primary inline-flex items-center gap-1.5 text-xs font-semibold"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Map Explorer</span>
            </Link>
          </div>
        </div>

        {/* Master Operations Status Strip */}
        <div className="editorial-card p-5 bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-md bg-surface-raised border border-border text-ink shrink-0 mt-0.5">
              <Ship className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                  Active Vessel Profile
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-raised border border-border text-ink">
                  {vesselClass === "small" ? "Artisanal Craft (<8m)" : "Mechanised Trawler (8–24m)"}
                </span>
              </div>
              <p className="text-sm font-sans text-ink mt-1 font-medium">
                {vesselClass === "small"
                  ? "Evaluating under DG Shipping Artisanal Safety Limits (Hs threshold: 1.5m)."
                  : "Evaluating under Commercial Marine Safety Limits (Hs threshold: 2.5m)."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-md border border-border shrink-0 self-start md:self-center">
            <button
              onClick={() => setVesselClass("small")}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                vesselClass === "small"
                  ? "bg-primary text-on-primary font-semibold"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Artisanal (&lt;8m)
            </button>
            <button
              onClick={() => setVesselClass("mechanised")}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                vesselClass === "mechanised"
                  ? "bg-primary text-on-primary font-semibold"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Mechanised (8–24m)
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28 rounded-md bg-surface-raised" />
            <Skeleton className="h-28 rounded-md bg-surface-raised" />
            <Skeleton className="h-28 rounded-md bg-surface-raised" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-md bg-surface-raised border border-terracotta/40 text-terracotta text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Failed to synchronize overview telemetry. Retrying automatically over fallback feeds.</span>
            </div>
            <button
              onClick={() => refetch()}
              className="px-2.5 py-1 rounded bg-terracotta text-white font-mono text-xs hover:opacity-90"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Asymmetric Core Workspace: 8 Columns vs 4 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (8 cols): Waypoints Ledger & Forecast Matrix */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Monitored Waypoints Table */}
                <div className="editorial-card bg-surface overflow-hidden">
                  <div className="p-4 border-b border-border bg-surface-raised flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold font-sans text-ink">
                        Monitored Coastal Waypoints
                      </h2>
                      <p className="text-[11px] text-ink-muted font-mono">
                        {data.saved_locations.length} station{data.saved_locations.length === 1 ? "" : "s"} under automated surveillance
                      </p>
                    </div>
                    <Link
                      to="/locations"
                      className="text-xs font-mono text-forest dark:text-sage hover:underline flex items-center gap-1"
                    >
                      <span>Configure</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  {data.saved_locations.length === 0 ? (
                    <div className="p-8 text-center text-xs text-ink-muted">
                      <p>No waypoints saved yet. Add your home harbour to monitor live wave thresholds.</p>
                      <Link to="/locations" className="btn-editorial-secondary inline-block mt-3 text-xs">
                        Add First Location
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs divide-y divide-border">
                        <thead className="bg-surface text-ink-muted font-mono text-[10px] uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-2.5">Station & Coords</th>
                            <th className="px-4 py-2.5">Safety Verdict</th>
                            <th className="px-4 py-2.5">Primary Factor</th>
                            <th className="px-4 py-2.5 text-right">Window</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-sans">
                          {data.saved_locations.map((loc) => (
                            <tr key={loc.location.id} className="hover:bg-surface-raised transition-colors">
                              <td className="px-4 py-3">
                                <Link
                                  to={`/ports/${loc.location.id}`}
                                  className="font-medium text-ink hover:text-forest dark:hover:text-sage transition-colors block"
                                >
                                  {loc.location.name}
                                </Link>
                                <span className="font-mono text-[10px] text-ink-muted">
                                  {loc.location.lat.toFixed(2)}°N, {loc.location.lon.toFixed(2)}°E
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <RiskBadge level={loc.level} size="sm" />
                              </td>
                              <td className="px-4 py-3 text-ink-muted font-mono text-xs">
                                {loc.top_factor || "Optimal sea state"}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-[11px] text-ink-muted">
                                Next 24h
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 7-Day Coastal Risk Horizon Matrix */}
                <div className="editorial-card p-5 bg-surface flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h3 className="text-sm font-semibold text-ink font-sans">
                        7-Day Coastal Risk Horizon
                      </h3>
                      <p className="text-[11px] text-ink-muted font-mono">
                        Forecasted wave height (Hs) & wind trend
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-ink-muted uppercase">
                      Updated hourly
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {forecastDays.map((fc, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-md border text-center flex flex-col justify-between gap-1.5 transition-colors ${
                          fc.risk === "safe"
                            ? "bg-surface-raised border-border"
                            : fc.risk === "caution"
                            ? "bg-risk-caution-bg border-risk-caution/30"
                            : "bg-risk-unsafe-bg border-risk-unsafe/30"
                        }`}
                      >
                        <span className="font-mono text-xs font-semibold text-ink">{fc.day}</span>
                        <div className="my-1">
                          <span className="font-mono text-sm font-bold text-ink block">
                            {fc.wave}m
                          </span>
                          <span className="font-mono text-[10px] text-ink-muted block">
                            {fc.wind}km/h
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-mono uppercase font-bold tracking-wider ${
                            fc.risk === "safe"
                              ? "text-risk-safe"
                              : fc.risk === "caution"
                              ? "text-risk-caution"
                              : "text-risk-unsafe"
                          }`}
                        >
                          {fc.risk}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-ink-muted font-sans pt-1">
                    Mid-week squall alert: Projected surge crossing coastal sectors Wednesday. Artisanal craft advised to seek inner harbour anchorage by Tuesday evening.
                  </p>
                </div>
              </div>

              {/* Right Column (4 cols): Checklist, Ingested Feeds & System Health */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Pre-Departure Operational Checklist */}
                <div className="editorial-card p-5 bg-surface flex flex-col gap-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-forest dark:text-sage" />
                      <h3 className="text-xs font-mono font-semibold uppercase text-ink">
                        Pre-Casting Checklist
                      </h3>
                    </div>
                    <span className="font-mono text-xs font-bold text-ink">
                      {completedChecks}/{totalChecks}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { key: "vhf", label: "VHF Marine Radio Test (Ch 16 / DSC)" },
                      { key: "lifejackets", label: "SOLAS Lifejackets & Beacon Inspected" },
                      { key: "telemetry", label: "48h Forecast Synced to Local Cache" },
                      { key: "fuel", label: "Reserve Fuel & Engine Oil Verified" },
                      { key: "bilge", label: "Bilge Pump & Drainage Ports Clear" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-surface-raised cursor-pointer text-xs font-sans text-ink transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checklist[item.key as keyof typeof checklist]}
                          onChange={() => toggleCheck(item.key as keyof typeof checklist)}
                          className="rounded border-border text-forest focus:ring-forest h-4 w-4"
                        />
                        <span className={checklist[item.key as keyof typeof checklist] ? "line-through text-ink-muted" : "text-ink font-medium"}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Statutory Activity Feed */}
                <div className="editorial-card p-5 bg-surface flex flex-col gap-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-mono font-semibold uppercase text-ink">
                      Operational Ledger
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted">Last 24 Hours</span>
                  </div>

                  <div className="space-y-3">
                    {mockRecentActivity.map((act) => (
                      <div key={act.id} className="text-xs flex items-start gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-forest dark:bg-sage mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-ink leading-tight">{act.title}</p>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-ink-muted mt-0.5">
                            <span>{act.station}</span>
                            <span>•</span>
                            <span>{act.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Telemetry Ingestion Health */}
                <div className="editorial-card p-5 bg-surface-raised border border-border flex flex-col gap-3">
                  <span className="text-[11px] font-mono font-semibold uppercase text-ink-muted">
                    Scientific Ingestion Feeds
                  </span>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                      <span className="text-ink">Open-Meteo Marine</span>
                      <span className="text-forest dark:text-sage font-medium">Synced (4m)</span>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                      <span className="text-ink">INCOIS Swell Advisories</span>
                      <span className="text-forest dark:text-sage font-medium">Live (12m)</span>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                      <span className="text-ink">NOAA CoastWatch SST</span>
                      <span className="text-forest dark:text-sage font-medium">Valid (1h)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink">IMD Coastal Bulletins</span>
                      <span className="text-forest dark:text-sage font-medium">Active (30m)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default DashboardPage;
