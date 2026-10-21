import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RiskLevel } from "@/components/ui/risk-icons";
import {
  Search,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Anchor,
  X,
  Compass,
} from "lucide-react";

interface PortItem {
  id: string;
  slug: string;
  name: string;
  country_code: string;
  country_name: string;
  admin1_name: string;
  port_type: string;
  lat: number;
  lon: number;
  is_coastal: boolean;
  current_level: RiskLevel | null;
  current_level_valid_to: string | null;
  distance_km?: number;
}

interface PortsListResponse {
  results: PortItem[];
  count: number;
}

export const PortsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const queryQ = searchParams.get("q") || "";
  const queryCountry = searchParams.get("country") || "";
  const queryState = searchParams.get("state") || "";
  const queryType = searchParams.get("type") || "";
  const queryCoastal = searchParams.get("coastal") || "";
  const queryOrdering = searchParams.get("ordering") || "name";
  const queryPage = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(queryQ);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== queryQ) {
        const next = new URLSearchParams(searchParams);
        if (searchInput.trim()) {
          next.set("q", searchInput.trim());
        } else {
          next.delete("q");
        }
        next.set("page", "1");
        setSearchParams(next);
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput, queryQ, searchParams, setSearchParams]);

  // Handle "Use my location"
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setLocationLoading(false);
        const next = new URLSearchParams(searchParams);
        next.set("near", `${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`);
        next.set("page", "1");
        setSearchParams(next);
      },
      () => {
        setLocationLoading(false);
        setLocationError("Location permission was denied or unavailable.");
      },
      { timeout: 10000 },
    );
  };

  // Fetch paginated ports
  const { data, isLoading } = useQuery<PortsListResponse>({
    queryKey: ["ports", "directory", searchParams.toString()],
    queryFn: () => {
      const qs = searchParams.toString();
      return api.get<PortsListResponse>(`/ports/${qs ? `?${qs}` : ""}`);
    },
  });

  const updateParam = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams({ page: "1", ordering: "name" }));
  };

  const totalPages = data?.count ? Math.ceil(data.count / 20) : 1;

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-base hover:opacity-90">
            <Anchor className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>ORCA</span>
          </Link>
          <span className="text-xs text-ink-muted">/ Port Directory</span>
        </div>
        <nav className="flex items-center gap-4 text-xs font-medium">
          <Link to="/explore" className="hover:text-primary">Explore Map</Link>
          <Link to="/compare" className="hover:text-primary">Compare Ports</Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6 text-left">
        {/* Title & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Worldwide Ports & Harbours</h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Search verified coastal landing sites, fishing harbours, and commercial ports.
            </p>
          </div>
          <Button
            onClick={handleUseLocation}
            variant="secondary"
            size="sm"
            className="gap-2 self-start sm:self-auto shrink-0"
            isLoading={locationLoading}
          >
            <Navigation className="h-4 w-4 text-primary" aria-hidden="true" />
            Use My Location
          </Button>
        </div>

        {locationError && (
          <div className="p-3 text-xs bg-risk-caution-bg text-risk-caution border border-risk-caution/30 rounded">
            {locationError}
          </div>
        )}

        {/* Search and Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-surface p-4 rounded-lg border border-border shadow-sm">
          {/* Text Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" aria-hidden="true" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, state, or UN/LOCODE..."
              className="w-full h-9 pl-9 pr-3 rounded bg-surface-raised border border-border text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Search ports by keyword"
            />
          </div>

          {/* Type Filter */}
          <select
            value={queryType}
            onChange={(e) => updateParam("type", e.target.value)}
            className="h-9 px-2.5 rounded bg-surface-raised border border-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Filter by port type"
          >
            <option value="">All Port Types</option>
            <option value="commercial">Commercial</option>
            <option value="fishing_harbour">Fishing Harbour</option>
            <option value="minor">Minor Port</option>
            <option value="landing_centre">Landing Centre</option>
          </select>

          {/* Coastal Filter */}
          <select
            value={queryCoastal}
            onChange={(e) => updateParam("coastal", e.target.value)}
            className="h-9 px-2.5 rounded bg-surface-raised border border-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Filter coastal vs inland"
          >
            <option value="">Coastal & Inland</option>
            <option value="true">Coastal Only</option>
            <option value="false">Inland / Estuary</option>
          </select>

          {/* Sort By */}
          <select
            value={queryOrdering}
            onChange={(e) => updateParam("ordering", e.target.value)}
            className="h-9 px-2.5 rounded bg-surface-raised border border-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Sort ordering"
          >
            <option value="name">Name (A &rarr; Z)</option>
            <option value="-name">Name (Z &rarr; A)</option>
            <option value="country_code">Country Code</option>
          </select>
        </div>

        {/* Filter Chips / Active criteria */}
        {(queryQ || queryState || queryCountry || queryType || queryCoastal) && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-ink-muted">Active filters:</span>
            {queryQ && (
              <span className="px-2 py-0.5 rounded bg-surface-raised border border-border flex items-center gap-1 font-mono">
                q: {queryQ}
                <button onClick={() => updateParam("q", "")} className="hover:text-primary"><X className="h-3 w-3" /></button>
              </span>
            )}
            {queryState && (
              <span className="px-2 py-0.5 rounded bg-surface-raised border border-border flex items-center gap-1">
                State: {queryState}
                <button onClick={() => updateParam("state", "")} className="hover:text-primary"><X className="h-3 w-3" /></button>
              </span>
            )}
            {queryType && (
              <span className="px-2 py-0.5 rounded bg-surface-raised border border-border flex items-center gap-1">
                Type: {queryType}
                <button onClick={() => updateParam("type", "")} className="hover:text-primary"><X className="h-3 w-3" /></button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-primary hover:underline ml-2 font-medium"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between text-xs text-ink-muted font-mono">
          <span>{data ? `Showing ${data.results.length} of ${data.count} stations` : "Scanning directory..."}</span>
          <span>Page {queryPage} of {totalPages}</span>
        </div>

        {/* Table of Ports */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-border">
              <thead className="bg-surface-raised text-ink font-mono font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Station / Port</th>
                  <th scope="col" className="px-4 py-3">State / Province</th>
                  <th scope="col" className="px-4 py-3">Country</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Coordinates</th>
                  <th scope="col" className="px-4 py-3">Current Level</th>
                  <th scope="col" className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                ) : data && data.results.length > 0 ? (
                  data.results.map((port) => (
                    <tr key={port.id} className="hover:bg-surface-raised/60 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          to={`/ports/${port.slug}`}
                          className="font-semibold text-ink hover:text-primary flex items-center gap-1.5"
                        >
                          <span>{port.name}</span>
                          {port.distance_km !== undefined && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-water text-primary">
                              {port.distance_km} km away
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{port.admin1_name || "—"}</td>
                      <td className="px-4 py-3 text-ink-muted font-mono">{port.country_code}</td>
                      <td className="px-4 py-3 capitalize text-ink-muted">
                        {port.port_type.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">
                        {port.lat.toFixed(2)}°, {port.lon.toFixed(2)}°
                      </td>
                      <td className="px-4 py-3">
                        {port.current_level ? (
                          <RiskBadge level={port.current_level} size="sm" />
                        ) : (
                          <span className="text-ink-muted font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/ports/${port.slug}`}
                          className="text-primary hover:underline font-semibold"
                        >
                          Forecast &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-ink-muted space-y-2">
                      <Compass className="h-8 w-8 mx-auto text-ink-muted/50" />
                      <p className="font-semibold text-ink">No ports match your query.</p>
                      <p className="text-xs">Try a different spelling or clear active filters.</p>
                      <Button onClick={clearAllFilters} size="sm" variant="secondary" className="mt-2">
                        Clear all filters
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between text-xs">
              <Button
                variant="secondary"
                size="sm"
                disabled={queryPage <= 1}
                onClick={() => updateParam("page", String(queryPage - 1))}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="font-mono text-ink-muted">
                Page {queryPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={queryPage >= totalPages}
                onClick={() => updateParam("page", String(queryPage + 1))}
                className="gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-6 text-xs text-ink-muted text-center">
        <p>© 2026 Project ORCA • Marine Ecosystem Reasoning for SDG 14</p>
      </footer>
    </div>
  );
};
