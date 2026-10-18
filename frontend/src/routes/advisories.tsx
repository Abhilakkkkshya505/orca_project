import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  Filter,
} from "lucide-react";

interface AdvisoryItem {
  id: string;
  headline: string;
  body_excerpt: string;
  severity: "info" | "watch" | "warning" | "severe";
  source: string;
  issued_at: string;
  expires_at: string;
  source_url: string;
  area_centroid?: { lat: number; lon: number };
}

interface AdvisoryDetailItem extends AdvisoryItem {
  body: string;
  min_lat: number;
  max_lat: number;
  min_lon: number;
  max_lon: number;
}

interface AdvisoriesResponse {
  results: AdvisoryItem[];
  count: number;
}

export const AdvisoriesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [ordering, setOrdering] = useState("-issued_at");
  const [selectedAdvisory, setSelectedAdvisory] = useState<AdvisoryDetailItem | null>(null);

  // Fetch paginated advisories
  const { data, isLoading } = useQuery<AdvisoriesResponse>({
    queryKey: ["advisories", { page, severity: severityFilter, q: searchQuery, ordering }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        ordering,
        active: "true",
      });
      if (severityFilter) params.append("severity", severityFilter);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      return api.get<AdvisoriesResponse>(`/advisories/?${params.toString()}`);
    },
  });

  const advisories = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / 10) || 1;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "severe":
      case "warning":
        return "bg-risk-unsafe-bg text-risk-unsafe border-risk-unsafe/30";
      case "watch":
        return "bg-risk-caution-bg text-risk-caution border-risk-caution/30";
      default:
        return "bg-surface-raised text-ink-muted border-border";
    }
  };

  const openDetail = async (id: string) => {
    try {
      const detail = await api.get<AdvisoryDetailItem>(`/advisories/${id}/`);
      setSelectedAdvisory(detail);
    } catch {
      // Handle error
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6 text-left">
        {/* Header */}
        <div className="pb-4 border-b border-border">
          <h1 className="text-2xl font-semibold">Official Marine Advisories</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Official INCOIS, IMD, and coastal disaster warnings for Indian maritime zones.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface border border-border p-3 rounded-lg shadow-card">
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-3 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search headline..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-raised border border-border-strong rounded text-ink focus-visible:outline-focus"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1 text-xs text-ink-muted">
              <Filter className="h-3.5 w-3.5" />
              <span>Severity:</span>
            </div>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="bg-surface-raised border border-border-strong rounded px-2.5 py-1.5 text-sm text-ink"
            >
              <option value="">All Severities</option>
              <option value="warning">Warning / Severe</option>
              <option value="watch">Watch Alert</option>
              <option value="info">Informational</option>
            </select>

            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="bg-surface-raised border border-border-strong rounded px-2.5 py-1.5 text-sm text-ink"
            >
              <option value="-issued_at">Latest Issued</option>
              <option value="expires_at">Expiring Soonest</option>
              <option value="-severity">Highest Severity</option>
            </select>
          </div>
        </div>

        {/* Advisories Data Table */}
        <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-raised text-xs text-ink-muted uppercase font-mono">
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Headline</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Issued</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ) : advisories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ink-muted">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-ink-muted opacity-50" />
                      No active marine advisories found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  advisories.map((adv) => (
                    <tr
                      key={adv.id}
                      className="hover:bg-surface-raised/50 cursor-pointer h-12"
                      onClick={() => openDetail(adv.id)}
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold uppercase ${getSeverityBadge(
                            adv.severity,
                          )}`}
                        >
                          {adv.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-ink max-w-xs truncate">
                        {adv.headline}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-ink-muted uppercase">
                        {adv.source}
                      </td>
                      <td className="py-3 px-4 text-xs text-ink-muted font-mono whitespace-nowrap">
                        {new Date(adv.issued_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-xs text-ink-muted font-mono whitespace-nowrap">
                        {new Date(adv.expires_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(adv.id);
                          }}
                          className="text-primary hover:underline text-xs font-semibold inline-flex items-center gap-1"
                        >
                          Inspect <ExternalLink className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-ink-muted bg-surface-raised/40">
            <span>
              Showing {advisories.length} of {totalCount} bulletins
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border border-border disabled:opacity-40 hover:bg-surface-raised"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded border border-border disabled:opacity-40 hover:bg-surface-raised"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advisory Detail Modal */}
        {selectedAdvisory && (
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-surface border border-border rounded-lg max-w-xl w-full p-6 shadow-overlay flex flex-col gap-4 text-left">
              <div className="flex items-start justify-between pb-3 border-b border-border">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold uppercase mb-1.5 ${getSeverityBadge(
                      selectedAdvisory.severity,
                    )}`}
                  >
                    {selectedAdvisory.severity}
                  </span>
                  <h2 className="text-lg font-semibold text-ink">{selectedAdvisory.headline}</h2>
                  <p className="text-xs text-ink-muted">
                    Source: {selectedAdvisory.source.toUpperCase()} • Valid until{" "}
                    {new Date(selectedAdvisory.expires_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAdvisory(null)}
                  className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-raised"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-sm text-ink leading-relaxed whitespace-pre-wrap bg-surface-raised p-4 rounded border border-border max-h-60 overflow-y-auto">
                {selectedAdvisory.body}
              </div>

              {selectedAdvisory.source_url && (
                <div className="text-xs pt-2">
                  <a
                    href={selectedAdvisory.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    View Official Bulletin at Source <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
