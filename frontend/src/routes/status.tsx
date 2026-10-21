import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatDataAge } from "@/lib/format";
import {
  Anchor,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SourceStatus {
  slug: string;
  name: string;
  status: "ok" | "stale" | "failing" | "disabled" | string;
  last_success_at: string | null;
  age_minutes: number | null;
  attribution: string;
  license_url: string;
  needs_key: boolean;
}

interface DataStatusResponse {
  sources: SourceStatus[];
}

export const StatusPage: React.FC = () => {
  const { data, isLoading, refetch, isFetching } = useQuery<DataStatusResponse>({
    queryKey: ["data-status", "full"],
    queryFn: () => api.get<DataStatusResponse>("/data-status/"),
    refetchInterval: 30 * 1000,
  });

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "ok") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono font-semibold bg-risk-safe-bg text-risk-safe">
          <CheckCircle2 className="h-3.5 w-3.5" /> OPERATIONAL
        </span>
      );
    }
    if (s.includes("stale") || s.includes("degraded")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono font-semibold bg-risk-caution-bg text-risk-caution">
          <AlertTriangle className="h-3.5 w-3.5" /> DEGRADED
        </span>
      );
    }
    if (s.includes("failing") || s.includes("error")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono font-semibold bg-risk-unsafe-bg text-risk-unsafe">
          <XCircle className="h-3.5 w-3.5" /> OUTAGE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono font-semibold bg-surface-raised text-ink-muted">
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-base hover:opacity-90">
            <Anchor className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>ORCA</span>
          </Link>
          <span className="text-xs text-ink-muted">/ System Status</span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => refetch()}
          isLoading={isFetching}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 flex flex-col gap-8 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
              <Activity className="h-6 w-6 text-primary" />
              Live Telemetry & Provider Status
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Real-time operational health, upstream query latency, and data freshness across all integrated data pipelines.
            </p>
          </div>
          <span className="text-xs font-mono text-ink-muted bg-surface-raised px-3 py-1.5 rounded border border-border">
            Polling every 30s
          </span>
        </div>

        {/* Sources Table */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-surface-raised border-b border-border flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Ingestion Pipelines ({data?.sources.length || 0})
            </span>
          </div>

          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-ink-muted">
                Probing upstream telemetry providers...
              </div>
            ) : (
              data?.sources.map((src) => (
                <div key={src.slug} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-semibold text-sm text-ink">{src.name}</h3>
                      {src.needs_key && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-raised text-ink-muted border border-border">
                          API Key Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {src.attribution}
                    </p>
                    <a
                      href={src.license_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-mono"
                    >
                      Licence & Terms <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                    {getStatusBadge(src.status)}
                    <span className="text-xs font-mono text-ink-muted">
                      {formatDataAge(src.age_minutes)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transparency note */}
        <div className="p-4 rounded-lg bg-surface border border-border text-xs text-ink-muted space-y-1">
          <p className="font-semibold text-ink">Strict Data Freshness Mandate:</p>
          <p>
            When any primary ocean wave or atmospheric wind feed fails or goes stale beyond calibrated limits, ORCA automatically marks conditions as &quot;Unknown&quot; to prevent hazardous maritime excursions.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-6 text-xs text-ink-muted text-center">
        <p>© 2026 Project ORCA • Marine Ecosystem Reasoning for SDG 14</p>
      </footer>
    </div>
  );
};
