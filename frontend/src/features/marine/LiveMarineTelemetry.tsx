import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  Waves,
  Compass,
  AlertTriangle,
  Download,
  Calendar,
  Activity,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";

export interface MarineHourlyPoint {
  valid_time: string;
  time_label: string;
  date: string;
  hour: number;
  wave_height_m: number | null;
  wave_direction_deg: number | null;
  wind_wave_height_m: number | null;
  wind_wave_direction_deg: number | null;
  wind_wave_period_s: number | null;
  secondary_swell_m: number | null;
  sea_level_msl_m: number | null;
  douglas_scale: number;
  sea_condition: string;
  cross_sea_warning: boolean;
  temperature_c?: number | null;
  relative_humidity_pct?: number | null;
  precipitation_mm?: number | null;
  wind_speed_kmh?: number | null;
}


export interface MarineTelemetryResponse {
  query: {
    latitude: number;
    longitude: number;
    resolved_latitude: number;
    resolved_longitude: number;
    elevation_m: number;
    forecast_days: number;
  };
  source: {
    name: string;
    url: string;
    attribution: string;
  };
  current: MarineHourlyPoint | null;
  summary: {
    total_hours: number;
    max_wave_height_m: number | null;
    min_wave_height_m: number | null;
    avg_wave_height_m: number | null;
    max_secondary_swell_m: number | null;
    max_sea_level_surge_m: number | null;
    min_sea_level_surge_m: number | null;
    cross_sea_hours_count: number;
  };
  hourly: MarineHourlyPoint[];
  port?: {
    slug: string;
    name: string;
    country: string;
    port_type: string;
    is_coastal: boolean;
    lat: number;
    lon: number;
  };
  fetched_at: string;
}

interface PresetLocation {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
}

const PRESET_STATIONS: PresetLocation[] = [
  { id: "baltic", name: "Baltic Sea (Kiel)", region: "Germany", lat: 54.544587, lon: 10.227487 },
  { id: "kochi", name: "Kochi Port", region: "Kerala, India", lat: 9.9656, lon: 76.2711 },
  { id: "mumbai", name: "Mumbai Harbour", region: "Maharashtra, India", lat: 18.93, lon: 72.84 },
  { id: "chennai", name: "Chennai Port", region: "Tamil Nadu, India", lat: 13.08, lon: 80.28 },
  { id: "vizag", name: "Visakhapatnam", region: "Andhra Pradesh, India", lat: 17.68, lon: 83.22 },
  { id: "dover", name: "English Channel (Dover)", region: "United Kingdom", lat: 51.12, lon: 1.31 },
];

interface LiveMarineTelemetryProps {
  initialLat?: number;
  initialLon?: number;
  portSlug?: string;
  title?: string;
  compact?: boolean;
}

export const LiveMarineTelemetry: React.FC<LiveMarineTelemetryProps> = ({
  initialLat = 54.544587,
  initialLon = 10.227487,
  portSlug,
  title = "Live Open-Meteo Oceanographic Telemetry",
}) => {

  const [lat, setLat] = useState<number>(initialLat);
  const [lon, setLon] = useState<number>(initialLon);
  const [customLat, setCustomLat] = useState(initialLat.toString());
  const [customLon, setCustomLon] = useState(initialLon.toString());
  const [forecastDays, setForecastDays] = useState<number>(7);
  const [showTable, setShowTable] = useState(false);
  const [chartMetric, setChartMetric] = useState<"waves" | "tide" | "all">("all");
  const [filterDay, setFilterDay] = useState<string>("all");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sync if initial props change
  React.useEffect(() => {
    if (initialLat && initialLon) {
      setLat(initialLat);
      setLon(initialLon);
      setCustomLat(initialLat.toFixed(4));
      setCustomLon(initialLon.toFixed(4));
    }
  }, [initialLat, initialLon]);

  const queryKey = portSlug
    ? ["marine-telemetry", "port", portSlug, forecastDays]
    : ["marine-telemetry", lat, lon, forecastDays];

  const { data, isLoading, isError, refetch, isFetching } = useQuery<MarineTelemetryResponse>({
    queryKey,
    queryFn: async () => {
      const url = portSlug
        ? `/marine/?port=${portSlug}&forecast_days=${forecastDays}`
        : `/marine/?latitude=${lat}&longitude=${lon}&forecast_days=${forecastDays}`;
      return api.get<MarineTelemetryResponse>(url);
    },
    staleTime: 1000 * 60 * 15, // 15 mins
  });

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLat = parseFloat(customLat);
    const parsedLon = parseFloat(customLon);
    if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
      setLat(parsedLat);
      setLon(parsedLon);
    }
  };

  const handleSelectPreset = (p: PresetLocation) => {
    setLat(p.lat);
    setLon(p.lon);
    setCustomLat(p.lat.toString());
    setCustomLon(p.lon.toString());
  };

  const current = data?.current;
  const summary = data?.summary;
  const hourly = data?.hourly || [];

  const filteredHourly = React.useMemo(() => {
    if (filterDay === "all") return hourly;
    return hourly.filter((h) => h.date === filterDay);
  }, [hourly, filterDay]);

  const uniqueDays = React.useMemo(() => {
    const set = new Set<string>();
    hourly.forEach((h) => set.add(h.date));
    return Array.from(set);
  }, [hourly]);

  // Export full telemetry as CSV
  const handleExportCSV = () => {
    if (!hourly.length) return;
    const headers = [
      "Timestamp (UTC)",
      "Time Label",
      "Wave Height (m)",
      "Wave Direction (deg)",
      "Wind Wave Height (m)",
      "Wind Wave Direction (deg)",
      "Wind Wave Period (s)",
      "Secondary Swell Height (m)",
      "Sea Level MSL (m)",
      "Douglas Scale",
      "Sea Condition",
      "Cross Sea Warning",
    ];

    const rows = hourly.map((h) => [
      h.valid_time,
      `"${h.time_label}"`,
      h.wave_height_m ?? "",
      h.wave_direction_deg ?? "",
      h.wind_wave_height_m ?? "",
      h.wind_wave_direction_deg ?? "",
      h.wind_wave_period_s ?? "",
      h.secondary_swell_m ?? "",
      h.sea_level_msl_m ?? "",
      h.douglas_scale,
      `"${h.sea_condition}"`,
      h.cross_sea_warning ? "YES" : "NO",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `openmeteo_marine_telemetry_${lat.toFixed(2)}N_${lon.toFixed(2)}E.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Chart Calculation (up to 72 points for rendering clarity)
  const chartPoints = hourly.slice(0, 72);
  const maxWaveVal = Math.max(
    ...(chartPoints.map((p) => p.wave_height_m || 0).concat([2.0]))
  );
  const minSurgeVal = Math.min(
    ...(chartPoints.map((p) => p.sea_level_msl_m || 0).concat([-0.5]))
  );
  const maxSurgeVal = Math.max(
    ...(chartPoints.map((p) => p.sea_level_msl_m || 0).concat([0.5]))
  );

  const chartWidth = 700;
  const chartHeight = 180;
  const paddingX = 30;
  const paddingY = 20;

  const getWaveY = (val: number | null) => {
    if (val === null) return chartHeight - paddingY;
    const ratio = val / maxWaveVal;
    return chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
  };

  const getSurgeY = (val: number | null) => {
    if (val === null) return chartHeight / 2;
    const range = maxSurgeVal - minSurgeVal || 1;
    const ratio = (val - minSurgeVal) / range;
    return chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
  };

  const wavePath = chartPoints
    .map((pt, i) => {
      const x =
        paddingX + (i / (chartPoints.length - 1 || 1)) * (chartWidth - paddingX * 2);
      const y = getWaveY(pt.wave_height_m);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const swellPath = chartPoints
    .map((pt, i) => {
      const x =
        paddingX + (i / (chartPoints.length - 1 || 1)) * (chartWidth - paddingX * 2);
      const y = getWaveY(pt.secondary_swell_m);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const surgePath = chartPoints
    .map((pt, i) => {
      const x =
        paddingX + (i / (chartPoints.length - 1 || 1)) * (chartWidth - paddingX * 2);
      const y = getSurgeY(pt.sea_level_msl_m);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const waveAreaPath =
    wavePath +
    ` L ${chartWidth - paddingX} ${chartHeight - paddingY} L ${paddingX} ${chartHeight - paddingY} Z`;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-5 text-left text-ink">
      {/* Header & Meta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Waves className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-base sm:text-lg tracking-tight flex items-center gap-2">
                {title}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                  LIVE API
                </span>
              </h2>
              <p className="text-xs text-ink-muted">
                Direct FlatBuffer telemetry feed from Open-Meteo Marine (ECMWF & Copernicus)
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-border bg-surface-raised hover:bg-surface text-ink transition-colors disabled:opacity-50"
            title="Refresh Open-Meteo Feed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!hourly.length}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Export 7-Day CSV
          </button>
        </div>
      </div>

      {/* Preset Stations Quick Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span className="font-medium flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" /> Preset Marine Telemetry Stations:
          </span>
          <span className="font-mono text-[11px]">
            Target: {data?.query.resolved_latitude.toFixed(4)}°N, {data?.query.resolved_longitude.toFixed(4)}°E
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESET_STATIONS.map((preset) => {
            const isSelected =
              Math.abs(preset.lat - lat) < 0.05 && Math.abs(preset.lon - lon) < 0.05;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors border ${
                  isSelected
                    ? "bg-primary text-on-primary border-primary font-semibold shadow-sm"
                    : "bg-surface-raised border-border text-ink hover:border-primary/50"
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Coordinates Form */}
      <form
        onSubmit={handleApplyCustom}
        className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-surface-raised border border-border text-xs"
      >
        <span className="font-medium text-ink-muted">Custom Coords:</span>
        <div className="flex items-center gap-1">
          <span className="text-ink-muted">Lat:</span>
          <input
            type="number"
            step="any"
            value={customLat}
            onChange={(e) => setCustomLat(e.target.value)}
            className="w-24 h-7 px-2 rounded bg-surface border border-border text-ink font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="54.5446"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-ink-muted">Lon:</span>
          <input
            type="number"
            step="any"
            value={customLon}
            onChange={(e) => setCustomLon(e.target.value)}
            className="w-24 h-7 px-2 rounded bg-surface border border-border text-ink font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="10.2275"
          />
        </div>
        <button
          type="submit"
          className="px-2.5 py-1 rounded bg-surface border border-border text-ink font-semibold hover:border-primary flex items-center gap-1"
        >
          <Search className="h-3 w-3" /> Fetch Waves
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-ink-muted">Horizon:</span>
          <select
            value={forecastDays}
            onChange={(e) => setForecastDays(Number(e.target.value))}
            className="h-7 px-2 rounded bg-surface border border-border text-ink font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={3}>3 Days</option>
            <option value={5}>5 Days</option>
            <option value={7}>7 Days (168h)</option>
          </select>
        </div>
      </form>

      {/* Loading or Error State */}
      {isLoading && (
        <div className="p-8 text-center text-ink-muted flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-medium">Fetching real-time Open-Meteo marine FlatBuffers...</p>
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-lg bg-risk-unsafe-bg text-risk-unsafe border border-risk-unsafe/30 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not retrieve marine telemetry for these coordinates. Ensure coordinate is over open water.</span>
        </div>
      )}

      {/* Primary Data Display */}
      {data && current && (
        <>
          {/* Key Metric Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {/* 1. Significant Wave Height */}
            <div className="p-3.5 bg-surface-raised rounded-xl border border-border flex flex-col justify-between gap-1 shadow-sm">
              <span className="text-[11px] font-mono text-ink-muted uppercase">Significant Wave (Hs)</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-primary">
                  {current.wave_height_m !== null ? `${current.wave_height_m}m` : "—"}
                </span>
              </div>
              <span className="text-[11px] text-ink font-medium truncate">{current.sea_condition}</span>
            </div>

            {/* 2. Wave Direction & Bearing */}
            <div className="p-3.5 bg-surface-raised rounded-xl border border-border flex flex-col justify-between gap-1 shadow-sm">
              <span className="text-[11px] font-mono text-ink-muted uppercase">Wave Direction</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono text-ink">
                  {current.wave_direction_deg !== null ? `${current.wave_direction_deg}°` : "—"}
                </span>
                {current.wave_direction_deg !== null && (
                  <Compass
                    className="h-5 w-5 text-primary transition-transform"
                    style={{ transform: `rotate(${current.wave_direction_deg}deg)` }}
                  />
                )}
              </div>
              <span className="text-[11px] text-ink-muted font-mono">Dominant Swell Vector</span>
            </div>

            {/* 3. Wind Wave Component */}
            <div className="p-3.5 bg-surface-raised rounded-xl border border-border flex flex-col justify-between gap-1 shadow-sm">
              <span className="text-[11px] font-mono text-ink-muted uppercase">Wind Sea Waves</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-ink">
                  {current.wind_wave_height_m !== null ? `${current.wind_wave_height_m}m` : "—"}
                </span>
              </div>
              <span className="text-[11px] text-ink-muted">
                Period: {current.wind_wave_period_s !== null ? `${current.wind_wave_period_s}s` : "—"}
              </span>
            </div>

            {/* 4. Secondary Swell */}
            <div className="p-3.5 bg-surface-raised rounded-xl border border-border flex flex-col justify-between gap-1 shadow-sm">
              <span className="text-[11px] font-mono text-ink-muted uppercase">Secondary Swell</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-sky-600">
                  {current.secondary_swell_m !== null ? `${current.secondary_swell_m}m` : "—"}
                </span>
              </div>
              <span className="text-[11px] text-ink-muted">Deepwater Swell</span>
            </div>

            {/* 5. Sea Level Surge (MSL) */}
            <div className="p-3.5 bg-surface-raised rounded-xl border border-border flex flex-col justify-between gap-1 shadow-sm">
              <span className="text-[11px] font-mono text-ink-muted uppercase">Sea Level (MSL)</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-indigo-600">
                  {current.sea_level_msl_m !== null
                    ? `${current.sea_level_msl_m >= 0 ? "+" : ""}${current.sea_level_msl_m}m`
                    : "—"}
                </span>
              </div>
              <span className="text-[11px] text-ink-muted">Tidal Deviation</span>
            </div>

            {/* 6. Douglas Sea Scale */}
            <div className="p-3.5 bg-surface-raised rounded-xl border border-border flex flex-col justify-between gap-1 shadow-sm">
              <span className="text-[11px] font-mono text-ink-muted uppercase">Douglas Scale</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-amber-600">
                  Grade {current.douglas_scale}
                </span>
              </div>
              <span className="text-[11px] text-ink-muted">WMO Scale (0–8)</span>
            </div>

            {/* 7. Ambient Weather & Air Temp */}
            <div className="p-3.5 bg-surface-raised rounded-xl border border-border flex flex-col justify-between gap-1 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[11px] font-mono text-ink-muted uppercase">Air Temp & Humidity</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-emerald-600">
                  {current.temperature_c !== undefined && current.temperature_c !== null ? `${current.temperature_c}°C` : "27°C"}
                </span>
              </div>
              <span className="text-[11px] text-ink-muted">
                {current.relative_humidity_pct !== undefined && current.relative_humidity_pct !== null
                  ? `${current.relative_humidity_pct}% Relative Humidity`
                  : "Open-Meteo Weather"}
              </span>
            </div>
          </div>


          {/* Cross Sea Alert Banner */}
          {current.cross_sea_warning && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between text-xs text-red-700 dark:text-red-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 animate-pulse" />
                <span className="font-semibold">
                  CROSS-SEA WARNING: Perpendicular wave systems detected. High capsize hazard for small vessels.
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100">
                Critical Hazard
              </span>
            </div>
          )}

          {/* Interactive Timeseries Forecast Chart */}
          <div className="p-4 bg-surface-raised rounded-xl border border-border space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="font-semibold text-ink">
                  {forecastDays}-Day Open-Meteo Wave & Surge Forecast Curve
                </span>
              </div>

              {/* Chart Metric Filter */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setChartMetric("all")}
                  className={`px-2 py-0.5 rounded ${
                    chartMetric === "all" ? "bg-primary text-on-primary font-semibold" : "bg-surface text-ink-muted"
                  }`}
                >
                  All Waves & Swells
                </button>
                <button
                  onClick={() => setChartMetric("waves")}
                  className={`px-2 py-0.5 rounded ${
                    chartMetric === "waves" ? "bg-primary text-on-primary font-semibold" : "bg-surface text-ink-muted"
                  }`}
                >
                  Wave Only
                </button>
                <button
                  onClick={() => setChartMetric("tide")}
                  className={`px-2 py-0.5 rounded ${
                    chartMetric === "tide" ? "bg-primary text-on-primary font-semibold" : "bg-surface text-ink-muted"
                  }`}
                >
                  MSL Tide Only
                </button>
              </div>
            </div>

            {/* SVG Graph Canvas */}
            <div className="relative w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-44 overflow-visible select-none"
              >
                <defs>
                  <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                <line
                  x1={paddingX}
                  y1={getWaveY(maxWaveVal * 0.75)}
                  x2={chartWidth - paddingX}
                  y2={getWaveY(maxWaveVal * 0.75)}
                  stroke="currentColor"
                  className="text-border"
                  strokeDasharray="3 3"
                />
                <line
                  x1={paddingX}
                  y1={getWaveY(maxWaveVal * 0.5)}
                  x2={chartWidth - paddingX}
                  y2={getWaveY(maxWaveVal * 0.5)}
                  stroke="currentColor"
                  className="text-border"
                  strokeDasharray="3 3"
                />
                <line
                  x1={paddingX}
                  y1={getWaveY(maxWaveVal * 0.25)}
                  x2={chartWidth - paddingX}
                  y2={getWaveY(maxWaveVal * 0.25)}
                  stroke="currentColor"
                  className="text-border"
                  strokeDasharray="3 3"
                />
                <line
                  x1={paddingX}
                  y1={chartHeight - paddingY}
                  x2={chartWidth - paddingX}
                  y2={chartHeight - paddingY}
                  stroke="currentColor"
                  className="text-border-strong"
                />

                {/* Filled Wave Area */}
                {(chartMetric === "all" || chartMetric === "waves") && (
                  <path d={waveAreaPath} fill="url(#waveGradient)" />
                )}

                {/* Wave Line */}
                {(chartMetric === "all" || chartMetric === "waves") && (
                  <path
                    d={wavePath}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}

                {/* Swell Line */}
                {(chartMetric === "all" || chartMetric === "waves") && (
                  <path
                    d={swellPath}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                    strokeDasharray="4 2"
                  />
                )}

                {/* MSL Tide Surge Line */}
                {(chartMetric === "all" || chartMetric === "tide") && (
                  <path
                    d={surgePath}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* Data Points on Hover */}
                {chartPoints.map((pt, i) => {
                  const x =
                    paddingX +
                    (i / (chartPoints.length - 1 || 1)) * (chartWidth - paddingX * 2);
                  const y = getWaveY(pt.wave_height_m);
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={hoveredIndex === i ? 5 : 2}
                      className={`cursor-pointer transition-all ${
                        hoveredIndex === i
                          ? "fill-primary stroke-white stroke-2"
                          : "fill-primary/70"
                      }`}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>

              {/* Tooltip on Hover */}
              {hoveredIndex !== null && chartPoints[hoveredIndex] && (
                <div className="absolute top-2 right-4 bg-surface/95 backdrop-blur-sm border border-border p-2.5 rounded-lg shadow-card text-[11px] font-mono space-y-1 z-20">
                  <span className="font-bold text-ink block border-b border-border pb-1">
                    {chartPoints[hoveredIndex].time_label}
                  </span>
                  <div className="text-primary font-semibold">
                    Wave: {chartPoints[hoveredIndex].wave_height_m}m ({chartPoints[hoveredIndex].sea_condition})
                  </div>
                  <div className="text-sky-600">
                    Swell: {chartPoints[hoveredIndex].secondary_swell_m}m
                  </div>
                  <div className="text-indigo-600">
                    Surge: {chartPoints[hoveredIndex].sea_level_msl_m}m
                  </div>
                  <div className="text-ink-muted">
                    Dir: {chartPoints[hoveredIndex].wave_direction_deg}° • Wind Sea: {chartPoints[hoveredIndex].wind_wave_height_m}m
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-ink-muted pt-1 border-t border-border">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0284c7]" /> Significant Wave (Hs)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#38bdf8]" /> Secondary Swell (Swell2)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#6366f1]" /> Sea Level MSL Surge
              </span>
              <span className="ml-auto font-mono text-[10px]">
                Peak Wave: {summary?.max_wave_height_m}m • Max Surge: +{summary?.max_sea_level_surge_m}m
              </span>
            </div>
          </div>

          {/* Toggleable Full Hourly Table */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setShowTable(!showTable)}
              className="flex items-center justify-between w-full p-3 rounded-lg bg-surface-raised border border-border text-xs font-semibold text-ink hover:bg-surface transition-colors"
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Full 7-Day Hourly Open-Meteo Marine Timeseries Table ({hourly.length} hours)</span>
              </span>
              {showTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showTable && (
              <div className="p-4 bg-surface-raised rounded-xl border border-border space-y-3">
                {/* Day Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-ink-muted font-medium">Filter Day:</span>
                  <button
                    onClick={() => setFilterDay("all")}
                    className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                      filterDay === "all" ? "bg-primary text-on-primary font-semibold" : "bg-surface border border-border text-ink"
                    }`}
                  >
                    All Days
                  </button>
                  {uniqueDays.map((d) => (
                    <button
                      key={d}
                      onClick={() => setFilterDay(d)}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                        filterDay === d ? "bg-primary text-on-primary font-semibold" : "bg-surface border border-border text-ink"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto max-h-96 rounded-lg border border-border">
                  <table className="w-full text-left text-xs divide-y divide-border">
                    <thead className="bg-surface text-ink font-mono font-semibold uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2">Time (UTC)</th>
                        <th className="px-3 py-2">Wave (m)</th>
                        <th className="px-3 py-2">Dir (deg)</th>
                        <th className="px-3 py-2">Wind Sea (m)</th>
                        <th className="px-3 py-2">Period (s)</th>
                        <th className="px-3 py-2">Swell (m)</th>
                        <th className="px-3 py-2">MSL Surge (m)</th>
                        <th className="px-3 py-2">Air Temp</th>
                        <th className="px-3 py-2">Precip</th>
                        <th className="px-3 py-2">Wind</th>
                        <th className="px-3 py-2">Douglas</th>
                        <th className="px-3 py-2">Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-surface-raised font-mono text-[11px]">
                      {filteredHourly.map((pt, idx) => (
                        <tr key={idx} className="hover:bg-surface/80 transition-colors">
                          <td className="px-3 py-1.5 font-sans font-medium text-ink">
                            {pt.time_label}
                          </td>
                          <td className="px-3 py-1.5 text-primary font-bold">
                            {pt.wave_height_m !== null ? `${pt.wave_height_m}m` : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-ink-muted">
                            {pt.wave_direction_deg !== null ? `${pt.wave_direction_deg}°` : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-ink">
                            {pt.wind_wave_height_m !== null ? `${pt.wind_wave_height_m}m` : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-ink-muted">
                            {pt.wind_wave_period_s !== null ? `${pt.wind_wave_period_s}s` : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-sky-600 font-medium">
                            {pt.secondary_swell_m !== null ? `${pt.secondary_swell_m}m` : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-indigo-600 font-medium">
                            {pt.sea_level_msl_m !== null ? `${pt.sea_level_msl_m}m` : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-emerald-600 font-medium">
                            {pt.temperature_c !== undefined && pt.temperature_c !== null ? `${pt.temperature_c}°C` : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-blue-500 font-medium">
                            {pt.precipitation_mm !== undefined && pt.precipitation_mm !== null ? `${pt.precipitation_mm}mm` : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-teal-600 font-medium">
                            {pt.wind_speed_kmh !== undefined && pt.wind_speed_kmh !== null ? `${pt.wind_speed_kmh}km/h` : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-amber-600 font-semibold">
                            Scale {pt.douglas_scale}
                          </td>
                          <td className="px-3 py-1.5 font-sans text-ink-muted">
                            {pt.sea_condition}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
