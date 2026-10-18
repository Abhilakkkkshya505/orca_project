import React from "react";
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
  ExternalLink,
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

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<DashboardOverviewResponse>({
    queryKey: ["dashboard", "overview"],
    queryFn: () => api.get<DashboardOverviewResponse>("/dashboard/overview/"),
    refetchInterval: 60 * 1000, // 1 min poll
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-8 text-left">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Marine Operations Dashboard</h1>
            <p className="text-sm text-ink-muted mt-0.5">
              Real-time coastal safety conditions, official weather bulletins, and data status.
            </p>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover self-start transition-colors"
          >
            Launch Map Explorer <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded bg-risk-unsafe-bg text-risk-unsafe border border-risk-unsafe/20 text-sm">
            Failed to load dashboard overview. Please check connection and retry.
          </div>
        )}

        {data && (
          <>
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-surface border border-border rounded-lg p-5 shadow-card flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-ink-muted">Monitored Stations</p>
                  <p className="text-3xl font-semibold mt-1 font-mono">{data.saved_locations.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-water text-primary flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-surface border border-border rounded-lg p-5 shadow-card flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-ink-muted">Active Advisories</p>
                  <p className="text-3xl font-semibold mt-1 font-mono text-risk-caution">
                    {data.active_advisories_count}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-risk-caution-bg text-risk-caution flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-surface border border-border rounded-lg p-5 shadow-card flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-ink-muted">Active Alert Thresholds</p>
                  <p className="text-3xl font-semibold mt-1 font-mono">{data.alerts_active_count}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-water text-primary flex items-center justify-center">
                  <Bell className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Monitored Coastal Locations Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Saved Coastal Waypoints</h2>
                <Link to="/locations" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                  Manage Locations <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {data.saved_locations.length === 0 ? (
                <div className="p-8 text-center bg-surface border border-dashed border-border rounded-lg text-ink-muted">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-primary opacity-60" />
                  <p className="text-sm font-medium text-ink">No saved coastal waypoints yet</p>
                  <p className="text-xs mt-1">Save your regular harbour or fishing grounds to track automated safety ratings.</p>
                  <Link
                    to="/locations"
                    className="inline-block mt-3 px-3 py-1.5 rounded bg-primary text-on-primary text-xs font-semibold"
                  >
                    Add Waypoint
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.saved_locations.map((item) => (
                    <div
                      key={item.location.id}
                      className="bg-surface border border-border rounded-lg p-4 shadow-card flex flex-col justify-between gap-3 hover:border-border-strong transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-base text-ink">{item.location.name}</h3>
                          <p className="text-xs font-mono text-ink-muted">
                            {item.location.lat.toFixed(2)}°N, {item.location.lon.toFixed(2)}°E
                          </p>
                        </div>
                        <RiskBadge level={item.level} size="md" />
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                        <span>{item.top_factor}</span>
                        <Link
                          to={`/explore`}
                          className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                        >
                          Inspect <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ingestion & Telemetry Data Freshness */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Data Source Freshness
                </h2>
                <span className="text-xs text-ink-muted">Auto-refreshed every minute</span>
              </div>

              <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-card">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-raised text-xs text-ink-muted uppercase font-mono">
                      <th className="py-3 px-4">Source Provider</th>
                      <th className="py-3 px-4">Latest Ingest Age</th>
                      <th className="py-3 px-4">Operational Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.data_freshness.map((src) => (
                      <tr key={src.source} className="hover:bg-surface-raised/40">
                        <td className="py-3 px-4 font-medium text-ink">{src.name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-ink-muted">
                          {src.age_minutes < 999 ? `${src.age_minutes} minutes ago` : "Pending initial sync"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              src.status === "ok"
                                ? "bg-risk-safe-bg text-risk-safe border border-risk-safe/30"
                                : src.status === "stale"
                                ? "bg-risk-caution-bg text-risk-caution border border-risk-caution/30"
                                : "bg-risk-unknown-bg text-risk-unknown border border-risk-unknown/30"
                            }`}
                          >
                            {src.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};
