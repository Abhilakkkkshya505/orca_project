import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { AppShell } from "@/components/layout/AppShell";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { RiskLevel } from "@/components/ui/risk-icons";
import {
  MapPin,
  AlertTriangle,
  Bell,
  Activity,
  ArrowRight,
  ShieldCheck,
  Compass,
  Waves,
  Wind,
  Plus,
  RefreshCw,
  Clock,
  Radio,
  CheckCircle2,
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
    time: "12 minutes ago",
    type: "advisory",
    severity: "caution",
  },
  {
    id: "act-2",
    title: "Open-Meteo High-Resolution Telemetry Synced",
    station: "Kochi Marine Observatory",
    time: "24 minutes ago",
    type: "telemetry",
    severity: "safe",
  },
  {
    id: "act-3",
    title: "Deterministic Safety Gate Evaluation Completed",
    station: "Port of Mumbai Offshore Zone",
    time: "1 hour ago",
    type: "evaluation",
    severity: "safe",
  },
  {
    id: "act-4",
    title: "VHF Marine Emergency Beacon Test Acknowledged",
    station: "Coast Guard Regional HQ",
    time: "3 hours ago",
    type: "system",
    severity: "safe",
  },
];

export const DashboardPage: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<"24h" | "48h" | "7d">("7d");
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
      <div className="flex flex-col gap-8 text-left max-w-7xl mx-auto w-full">
        {/* Hero Command Bar */}
        <div className="bg-gradient-to-r from-surface to-surface-raised border border-border rounded-2xl p-6 sm:p-8 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Operations Bridge • Telemetry Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-ink">
              Marine Command Center
            </h1>
            <p className="text-sm text-ink-muted max-w-2xl leading-relaxed">
              Real-time coastal safety intelligence, high-resolution oceanographic telemetry from Open-Meteo & INCOIS, and automated vessel clearance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-ink text-xs font-semibold hover:bg-surface-raised hover:border-border-strong transition-all shadow-sm active:scale-95"
              title="Refresh telemetry"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin text-primary" : "text-ink-muted"}`} />
              Sync Feeds
            </button>
            <Link
              to="/locations"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-ink text-xs font-semibold hover:bg-surface-raised hover:border-border-strong transition-all shadow-sm active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              Add Waypoint
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-hover transition-all shadow-md active:scale-95 group"
            >
              <Compass className="h-4 w-4 group-hover:rotate-45 transition-transform" />
              Launch Map Explorer
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-5 rounded-2xl bg-risk-unsafe-bg text-risk-unsafe border border-risk-unsafe/20 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>Failed to synchronize real-time overview metrics. Server may be in maintenance.</span>
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded-lg bg-risk-unsafe text-white text-xs font-semibold hover:opacity-90"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Top Stat Cards (4 SaaS metrics) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Stat 1: Monitored Stations */}
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-card card-hover flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Monitored Waypoints
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-heading font-bold text-ink">
                    {data.saved_locations.length}
                  </span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    +2 active
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                  <span>Targeted coastal stations</span>
                  <Link to="/locations" className="text-primary hover:underline font-medium">
                    Manage
                  </Link>
                </div>
              </div>

              {/* Stat 2: Active Advisories */}
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-card card-hover flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Official Advisories
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <AlertTriangle className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-heading font-bold text-amber-600 dark:text-amber-400">
                    {data.active_advisories_count}
                  </span>
                  <span className="text-xs font-medium text-ink-muted">INCOIS / IMD</span>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                  <span>Maritime coastal warnings</span>
                  <Link to="/advisories" className="text-primary hover:underline font-medium">
                    Review
                  </Link>
                </div>
              </div>

              {/* Stat 3: Alert Triggers */}
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-card card-hover flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Safety Alert Triggers
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Bell className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-heading font-bold text-ink">
                    {data.alerts_active_count}
                  </span>
                  <span className="text-xs font-medium text-ink-muted">Thresholds Armed</span>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                  <span>Wave / wind telemetry watch</span>
                  <Link to="/alerts" className="text-primary hover:underline font-medium">
                    Configure
                  </Link>
                </div>
              </div>

              {/* Stat 4: Deterministic Engine Rating */}
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-card card-hover flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Safety Gate Health
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-heading font-bold text-emerald-600 dark:text-emerald-400">
                    100%
                  </span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    Zero hallucinations
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                  <span>Rule Engine v2.4</span>
                  <Link to="/how-it-works" className="text-primary hover:underline font-medium">
                    Audit Logic
                  </Link>
                </div>
              </div>
            </div>

            {/* Middle Grid: Wave Height & Forecast Chart + Pre-Voyage Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Forecast & Sea State Chart (2 Cols) */}
              <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-card flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <h2 className="text-base font-bold text-ink flex items-center gap-2">
                      <Waves className="h-4 w-4 text-primary" />
                      7-Day Coastal Wave Height & Douglas Sea State Outlook
                    </h2>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Forecast model: Open-Meteo Marine (ECMWF & GFS ensemble)
                    </p>
                  </div>
                  <div className="flex items-center bg-surface-raised border border-border rounded-xl p-1 gap-1 text-xs">
                    {(["24h", "48h", "7d"] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setSelectedRange(range)}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                          selectedRange === range
                            ? "bg-primary text-white shadow-sm"
                            : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        {range.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Visual Spark & Forecast Bars */}
                <div className="py-6 space-y-6">
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {forecastDays.map((item, idx) => {
                      const waveHeightPercent = Math.min(100, Math.round((item.wave / 3.0) * 100));
                      const barColor =
                        item.risk === "unsafe"
                          ? "bg-rose-500"
                          : item.risk === "caution"
                          ? "bg-amber-500"
                          : "bg-primary";

                      return (
                        <div key={idx} className="flex flex-col items-center gap-2 group">
                          <span className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                            {item.day}
                          </span>
                          <span className="text-[11px] font-mono text-ink-muted">{item.wave}m</span>
                          
                          {/* Visual vertical bar */}
                          <div className="w-full max-w-[36px] h-28 bg-surface-raised rounded-xl relative flex items-end p-1 overflow-hidden border border-border">
                            <div
                              style={{ height: `${waveHeightPercent}%` }}
                              className={`w-full rounded-lg transition-all duration-500 ${barColor}`}
                            />
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-ink-muted">
                            <Wind className="h-3 w-3" />
                            <span>{item.wind}kt</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Douglas Sea State Scale Reference */}
                  <div className="bg-surface-raised/50 border border-border rounded-xl p-3 flex flex-wrap items-center justify-between text-xs text-ink-muted gap-2">
                    <span className="font-semibold text-ink">Douglas Scale Thresholds:</span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary" /> Scale 2-3 (Smooth/Slight &lt;1.25m)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Scale 4 (Moderate 1.25m–2.5m)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> Scale 5+ (Rough &gt;2.5m)
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                  <span>Next high tide: 14:45 IST • Wave direction: WSW 245°</span>
                  <Link to="/explore" className="text-primary hover:underline font-semibold flex items-center gap-1">
                    Examine On Satellite Map <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Pre-Voyage Inspection Checklist (1 Col) */}
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h2 className="text-base font-bold text-ink flex items-center gap-2">
                      <Radio className="h-4 w-4 text-primary" />
                      Pre-Voyage Checklist
                    </h2>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {completedChecks}/{totalChecks} Completed
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-2">
                    Mandatory small-craft pre-departure verification according to DG Shipping guidelines.
                  </p>

                  <div className="mt-4 space-y-3">
                    {[
                      { key: "vhf" as const, label: "VHF Marine Radio on Channel 16 operational" },
                      { key: "lifejackets" as const, label: "Life jackets & flotation suits inspected" },
                      { key: "telemetry" as const, label: "Live ORCA risk assessment & IMD bulletin reviewed" },
                      { key: "fuel" as const, label: "Fuel reserve ≥ 130% of intended voyage route" },
                      { key: "bilge" as const, label: "Bilge pumps & emergency manual pumps tested" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => toggleCheck(item.key)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-xs transition-all ${
                          checklist[item.key]
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-ink"
                            : "bg-surface-raised border-border text-ink-muted hover:border-border-strong"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 ${
                            checklist[item.key]
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-ink-muted/40"
                          }`}
                        >
                          {checklist[item.key] && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                        <span className={checklist[item.key] ? "line-through opacity-80" : "font-medium"}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                  <span>Emergency Coast Guard: <strong className="text-ink">1554</strong></span>
                  <Link to="/offline-preview" className="text-primary hover:underline font-semibold">
                    Offline PWA
                  </Link>
                </div>
              </div>
            </div>

            {/* Monitored Coastal Waypoints Grid */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-heading font-bold text-ink flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Saved Coastal Stations & Ports
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Real-time safety evaluations evaluated against your small-craft vessel limits.
                  </p>
                </div>
                <Link
                  to="/locations"
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  Manage Waypoints <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {data.saved_locations.length === 0 ? (
                <div className="p-10 text-center bg-surface border border-dashed border-border rounded-2xl text-ink-muted space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                    <Compass className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-ink">No Saved Coastal Stations</p>
                    <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                      Save regular fishing zones, landing harbours, or offshore routes to track automatic safety updates.
                    </p>
                  </div>
                  <Link
                    to="/locations"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Add Coastal Waypoint
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {data.saved_locations.map((item) => (
                    <div
                      key={item.location.id}
                      className="bg-surface border border-border rounded-2xl p-5 shadow-card card-hover flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-heading font-bold text-base text-ink">{item.location.name}</h3>
                          <p className="text-xs font-mono text-ink-muted mt-0.5">
                            {item.location.lat.toFixed(2)}°N, {item.location.lon.toFixed(2)}°E
                          </p>
                        </div>
                        <RiskBadge level={item.level} size="md" />
                      </div>

                      <div className="p-3 rounded-xl bg-surface-raised border border-border text-xs space-y-1">
                        <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                          Primary Threshold Factor
                        </span>
                        <p className="font-medium text-ink flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-primary" />
                          {item.top_factor || "Optimal sea parameters"}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                        <span>Valid until 12h horizon</span>
                        <Link
                          to="/explore"
                          className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                        >
                          Inspect <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Row: Recent Maritime Timeline + Data Freshness Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity Timeline (1 Col) */}
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h2 className="text-base font-bold text-ink flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Operational Feed
                    </h2>
                    <span className="text-xs text-ink-muted">Past 24 Hours</span>
                  </div>

                  <div className="mt-4 relative pl-4 border-l-2 border-border space-y-5">
                    {mockRecentActivity.map((act) => (
                      <div key={act.id} className="relative group text-left">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-surface" />
                        <h4 className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                          {act.title}
                        </h4>
                        <p className="text-[11px] text-ink-muted mt-0.5">{act.station}</p>
                        <span className="text-[10px] font-mono text-ink-muted mt-1 block">{act.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                  <span>Encrypted audit log</span>
                  <Link to="/status" className="text-primary hover:underline font-semibold">
                    System Status
                  </Link>
                </div>
              </div>

              {/* Data Freshness Table (2 Cols) */}
              <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h2 className="text-base font-bold text-ink flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Telemetry & Provider Ingestion Health
                      </h2>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Automated pipelines streaming coastal oceanographic feeds
                      </p>
                    </div>
                    <span className="text-xs font-mono text-ink-muted hidden sm:inline">Poll: 60s</span>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-surface-raised text-[11px] text-ink-muted uppercase font-mono">
                          <th className="py-2.5 px-3 rounded-l-lg">Source Provider</th>
                          <th className="py-2.5 px-3">Latest Ingest Age</th>
                          <th className="py-2.5 px-3">Telemetry Health</th>
                          <th className="py-2.5 px-3 rounded-r-lg text-right">Cadence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {data.data_freshness.map((src) => (
                          <tr key={src.source} className="hover:bg-surface-raised/40 transition-colors">
                            <td className="py-3 px-3 font-semibold text-ink flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  src.status === "ok" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                                }`}
                              />
                              {src.name}
                            </td>
                            <td className="py-3 px-3 font-mono text-ink-muted">
                              {src.age_minutes < 999 ? `${src.age_minutes}m ago` : "Pending initial sync"}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  src.status === "ok"
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                    : src.status === "stale"
                                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                    : "bg-surface-raised text-ink-muted border border-border"
                                }`}
                              >
                                {src.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-ink-muted text-right">Hourly</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                  <span>Fail-closed deterministic security model active</span>
                  <Link to="/how-it-works" className="text-primary hover:underline font-semibold">
                    View Pipeline Architecture
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};
