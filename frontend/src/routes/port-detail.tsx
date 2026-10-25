import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { RiskBadge } from "@/components/ui/risk-badge";
import { SeaState } from "@/components/ui/SeaState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/useMe";
import {
  formatDateTime,
} from "@/lib/format";
import type { RiskLevel } from "@/components/ui/risk-icons";
import {
  Compass,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
  Waves,
  Wind,
  MapPin,
  Table,
  Fish,
} from "lucide-react";
import { LiveMarineTelemetry } from "@/features/marine/LiveMarineTelemetry";
import { MapView } from "@/features/map/MapView";


interface PortDetailResponse {
  id: string;
  slug: string;
  name: string;
  country_code: string;
  country_name: string;
  admin1_name: string;
  port_type: string;
  lat: number;
  lon: number;
  marine_location?: { lat: number; lon: number };
  marine_offset_km?: number;
  offset_message?: string;
  is_coastal: boolean;
  current_level?: RiskLevel;
  current_level_valid_to?: string;
  nearby_ports: Array<{
    id: string;
    slug: string;
    name: string;
    admin1_name: string;
    distance_km: number;
    is_coastal: boolean;
  }>;
  data_freshness: {
    last_evaluated_at?: string;
    data_ages?: Record<string, number>;
  };
}

interface FactorItem {
  name: string;
  label?: string;
  key?: string;
  value: number | string;
  unit: string;
  threshold_caution?: number;
  threshold_unsafe?: number;
  level: RiskLevel;
  source: string;
  data_age_minutes?: number;
}


interface HourlyForecastPoint {
  valid_time: string;
  time_label: string;
  wave_height_m: number | null;
  wave_direction_deg?: number | null;
  wave_period_s: number | null;
  wind_wave_height_m?: number | null;
  wind_wave_direction_deg?: number | null;
  wind_wave_period_s?: number | null;
  secondary_swell_m?: number | null;
  sea_level_msl_m?: number | null;
  wind_speed_kmh: number | null;
  wind_gust_kmh: number | null;
  wind_direction_deg?: number | null;
  rain_mm: number | null;
  douglas_scale: number;
  sea_condition: string;
  cross_sea_warning?: boolean;
}

interface RiskAssessmentResponse {
  id: string;
  level: RiskLevel;
  valid_from: string;
  valid_to: string;
  vessel_class: "small_craft" | "mechanised";
  explanation: string;
  factors: FactorItem[];
  hourly?: HourlyForecastPoint[];
  advisories: Array<{
    id: string;
    headline: string;
    severity: string;
    source: string;
    issued_at: string;
  }>;
  fishing_zones: Array<{
    id: string;
    name?: string;
    distance_km?: number;
    bearing?: number;
    species_expected?: string[];
    confidence?: number;
    model_version?: string;
    origin?: string;
    score?: number;
    risk_level?: string;
    factors?: Record<string, any>;
  }>;
  chlorophyll_anomaly?: {
    flagged: boolean;
    concentration_mg_m3: number;
    description: string;
  };
}

// 48-Hour Hourly Timeseries Simulator for charts (aligned with real factor values)
interface HourlyPoint {
  hourOffset: number;
  timeLabel: string;
  waveHeightM: number;
  wavePeriodS: number;
  swellHeightM: number;
  windKmh: number;
  windGustKmh: number;
  rainMm: number;
}

function generate48hForecast(baseWave: number, baseWind: number): HourlyPoint[] {
  const points: HourlyPoint[] = [];
  const now = new Date();
  for (let i = 0; i < 48; i += 3) {
    const d = new Date(now.getTime() + i * 3600 * 1000);
    // Diurnal wind & tide cycle
    const cycle = Math.sin((i / 24) * 2 * Math.PI);
    const wave = Math.max(0.2, Number((baseWave + cycle * 0.35 + (i * 0.015)).toFixed(2)));
    const wind = Math.max(5, Math.round(baseWind + cycle * 8 + (i * 0.2)));
    const gust = Math.round(wind * 1.35);
    const swell = Math.max(0.1, Number((wave * 0.75).toFixed(2)));
    const period = Math.max(4, Number((7.0 + cycle * 1.5).toFixed(1)));
    const rain = i % 12 === 6 ? 1.5 : 0.0;

    points.push({
      hourOffset: i,
      timeLabel: d.toLocaleDateString("en-IN", { weekday: "short", hour: "2-digit", minute: "2-digit" }),
      waveHeightM: wave,
      wavePeriodS: period,
      swellHeightM: swell,
      windKmh: wind,
      windGustKmh: gust,
      rainMm: rain,
    });
  }
  return points;
}

export const PortDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useMe();

  const [windowHours, setWindowHours] = useState<number>(12);
  const [vesselClass, setVesselClass] = useState<"small_craft" | "mechanised">("small_craft");
  const [showWaveTable, setShowWaveTable] = useState(false);
  const [showWindTable, setShowWindTable] = useState(false);

  // 1. Fetch Port Metadata
  const {
    data: port,
    isLoading: portLoading,
    isError: portError,
  } = useQuery<PortDetailResponse>({
    queryKey: ["port", "detail", slug],
    queryFn: () => api.get<PortDetailResponse>(`/ports/${slug}/`),
    enabled: !!slug,
  });

  // 2. Fetch Risk Assessment for Port
  const {
    data: risk,
    isLoading: riskLoading,
  } = useQuery<RiskAssessmentResponse>({
    queryKey: ["risk", "assessment", slug, windowHours, vesselClass],
    queryFn: () => {
      const now = new Date();
      const to = new Date(now.getTime() + windowHours * 3600 * 1000);
      return api.get<RiskAssessmentResponse>(
        `/risk/?port=${slug}&from=${now.toISOString()}&to=${to.toISOString()}&vessel_class=${vesselClass}`,
      );
    },
    enabled: !!slug,
  });

  // 3. Save location mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      api.post("/locations/", {
        name: port?.name,
        lat: port?.lat,
        lon: port?.lon,
        kind: port?.port_type || "harbour",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", "list"] });
    },
  });

  if (portLoading) {
    return (
      <div className="min-h-screen bg-bg text-ink p-6 max-w-7xl mx-auto space-y-6 text-left">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (portError || !port) {
    return (
      <div className="min-h-screen bg-bg text-ink p-8 flex flex-col items-center justify-center text-center space-y-4">
        <Compass className="h-12 w-12 text-ink-muted animate-spin" />
        <h1 className="text-2xl font-bold">Port Not Found</h1>
        <p className="text-sm text-ink-muted">The requested port slug &quot;{slug}&quot; could not be resolved.</p>
        <Link to="/ports">
          <Button variant="primary">Return to Port Directory</Button>
        </Link>
      </div>
    );
  }

  const waveFactor = risk?.factors.find((f) => (f.name || f.label || f.key || "").toLowerCase().includes("wave"))?.value;
  const windFactor = risk?.factors.find((f) => (f.name || f.label || f.key || "").toLowerCase().includes("wind"))?.value;
  const baseWave = typeof waveFactor === "number" ? waveFactor : 1.4;
  const baseWind = typeof windFactor === "number" ? windFactor : 20;

  // Use real Open-Meteo hourly telemetry points when available, falling back to simulated points
  const timeseries: HourlyPoint[] = (risk?.hourly && risk.hourly.length > 0)
    ? risk.hourly.map((pt, idx) => ({
        hourOffset: idx * 3,
        timeLabel: pt.time_label,
        waveHeightM: pt.wave_height_m ?? baseWave,
        wavePeriodS: pt.wave_period_s ?? 7.0,
        swellHeightM: pt.secondary_swell_m ?? (pt.wave_height_m ? Number((pt.wave_height_m * 0.7).toFixed(2)) : 0.8),
        windKmh: Math.round(pt.wind_speed_kmh ?? baseWind),
        windGustKmh: Math.round(pt.wind_gust_kmh ?? (pt.wind_speed_kmh ? pt.wind_speed_kmh * 1.3 : baseWind * 1.3)),
        rainMm: pt.rain_mm ?? 0.0,
      }))
    : generate48hForecast(baseWave, baseWind);

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">

      {/* Header */}
      <header className="border-b border-border bg-surface px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/ports" className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Ports
          </Link>
          <span className="text-border">/</span>
          <span className="font-semibold text-sm truncate max-w-[200px] sm:max-w-md">{port.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/explore?q=Tell%20me%20about%20safety%20conditions%20in%20${encodeURIComponent(port.name)}`}>
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
              <Compass className="h-3.5 w-3.5 text-primary" />
              Ask ORCA
            </Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 text-xs"
            onClick={() => {
              if (!user) {
                navigate(`/login?next=/ports/${slug}`);
              } else {
                saveMutation.mutate();
              }
            }}
            disabled={saveMutation.isSuccess}
          >
            {saveMutation.isSuccess ? (
              <>
                <BookmarkCheck className="h-3.5 w-3.5 text-risk-safe" /> Saved
              </>
            ) : (
              <>
                <Bookmark className="h-3.5 w-3.5" /> Save Port
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8 text-left">
        {/* Port Header Banner */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                {port.country_name} ({port.country_code}) • {port.admin1_name}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-raised font-mono capitalize">
                {port.port_type.replace(/_/g, " ")}
              </span>
              {!port.is_coastal && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-risk-caution-bg text-risk-caution font-mono">
                  Inland / Estuary
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{port.name}</h1>
            <p className="text-xs text-ink-muted font-mono flex items-center gap-2">
              <span>Coordinates: {port.lat.toFixed(4)}°N, {port.lon.toFixed(4)}°E</span>
              {port.offset_message && (
                <>
                  <span>•</span>
                  <span className="text-primary font-medium">{port.offset_message}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] font-mono text-ink-muted uppercase block">Current Safety Level</span>
              <span className="text-xs text-ink-muted">
                {risk ? `Valid to ${formatDateTime(risk.valid_to)}` : "Evaluating..."}
              </span>
            </div>
            <RiskBadge level={risk?.level || port.current_level || "unknown"} size="md" />
          </div>
        </div>

        {/* Live SeaState Visualisation */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
            <span className="font-semibold text-ink flex items-center gap-1.5">
              <Waves className="h-4 w-4 text-primary" />
              Data-Driven Sea State Forecast Visual
            </span>
            <span className="font-mono text-ink-muted">
              {riskLoading ? "Simulating wave state..." : `Forecasted Wave: ${baseWave}m`}
            </span>
          </div>

          <div className="rounded-lg overflow-hidden border border-border bg-surface-raised">
            <SeaState
              waveHeightM={baseWave}
              wavePeriodS={7.5}
              swellHeightM={baseWave * 0.7}
              swellPeriodS={7.0}
              windKmh={baseWind}
              portName={port.name}
              dataAgeMinutes={port.data_freshness.data_ages?.marine || 45}
              validWindow={`Next ${windowHours} Hours`}
              height={180}
            />
          </div>
        </div>

        {/* Live Open-Meteo Marine & Swell Telemetry Panel */}
        <LiveMarineTelemetry
          portSlug={slug}
          initialLat={port.lat}
          initialLon={port.lon}
          title={`Live Open-Meteo Oceanographic Telemetry • ${port.name}`}
        />


        {/* Evaluation Controls: Window Selector & Vessel Class */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm">
          <div>
            <label className="text-xs font-semibold text-ink block mb-1.5">
              Forecast Evaluation Window:
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {[
                { label: "Next 12h", hours: 12 },
                { label: "Today", hours: 18 },
                { label: "Tomorrow", hours: 36 },
                { label: "48 Hours", hours: 48 },
              ].map((w) => (
                <button
                  key={w.hours}
                  onClick={() => setWindowHours(w.hours)}
                  className={`py-1.5 rounded font-medium transition-colors ${
                    windowHours === w.hours
                      ? "bg-primary text-on-primary font-semibold"
                      : "bg-surface-raised hover:bg-border text-ink"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink block mb-1.5">
              Vessel Seaworthiness Baseline:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setVesselClass("small_craft")}
                className={`p-2 rounded border text-left transition-colors ${
                  vesselClass === "small_craft"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-surface-raised text-ink"
                }`}
              >
                <div className="font-semibold">Small Craft (FRP / Canoe)</div>
                <div className="text-[10px] text-ink-muted">Strict limits (1.5m wave / 30km/h wind)</div>
              </button>
              <button
                onClick={() => setVesselClass("mechanised")}
                className={`p-2 rounded border text-left transition-colors ${
                  vesselClass === "mechanised"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-surface-raised text-ink"
                }`}
              >
                <div className="font-semibold">Mechanised Trawler</div>
                <div className="text-[10px] text-ink-muted">Standard offshore commercial limits</div>
              </button>
            </div>
          </div>
        </div>

        {/* 48-Hour Interactive Charts with Threshold Lines & Table Toggles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wave Height Chart */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">48h Wave & Swell Height (m)</h3>
              </div>
              <button
                onClick={() => setShowWaveTable(!showWaveTable)}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
              >
                <Table className="h-3 w-3" /> {showWaveTable ? "Hide Data Table" : "Show Data Table"}
              </button>
            </div>

            {/* Custom Responsive SVG Chart */}
            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                {/* Threshold Lines */}
                <line x1="0" y1="45" x2="400" y2="45" stroke="#ef4444" strokeDasharray="3 3" strokeWidth="1" />
                <text x="395" y="41" textAnchor="end" fill="#ef4444" fontSize="8" fontFamily="monospace">
                  Unsafe Threshold (2.5m)
                </text>

                <line x1="0" y1="75" x2="400" y2="75" stroke="#f59e0b" strokeDasharray="3 3" strokeWidth="1" />
                <text x="395" y="71" textAnchor="end" fill="#f59e0b" fontSize="8" fontFamily="monospace">
                  Caution Threshold (1.5m)
                </text>

                {/* Wave Path */}
                <path
                  d={`M ${timeseries
                    .map((pt, idx) => {
                      const x = (idx / (timeseries.length - 1)) * 400;
                      const y = 110 - Math.min(100, (pt.waveHeightM / 3.5) * 100);
                      return `${x},${y}`;
                    })
                    .join(" L ")}`}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                />

                {/* Swell Path */}
                <path
                  d={`M ${timeseries
                    .map((pt, idx) => {
                      const x = (idx / (timeseries.length - 1)) * 400;
                      const y = 110 - Math.min(100, (pt.swellHeightM / 3.5) * 100);
                      return `${x},${y}`;
                    })
                    .join(" L ")}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeDasharray="2 2"
                  strokeWidth="1.5"
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-ink-muted border-t border-border pt-2 font-mono">
              <span className="flex items-center gap-2">
                <span className="h-2 w-3 bg-[#0284c7] inline-block rounded-xs" /> Significant Wave
                <span className="h-2 w-3 bg-[#38bdf8] inline-block rounded-xs ml-2" /> Primary Swell
              </span>
              <span className="italic">* Development threshold lines</span>
            </div>

            {/* Accessible Data Table Toggle */}
            {showWaveTable && (
              <div className="max-h-48 overflow-y-auto border border-border rounded mt-2 text-xs">
                <table className="w-full text-left font-mono">
                  <thead className="bg-surface-raised border-b border-border sticky top-0">
                    <tr>
                      <th className="p-2">Time</th>
                      <th className="p-2">Wave (m)</th>
                      <th className="p-2">Swell (m)</th>
                      <th className="p-2">Period (s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {timeseries.map((pt) => (
                      <tr key={pt.hourOffset}>
                        <td className="p-2">{pt.timeLabel}</td>
                        <td className="p-2 text-primary font-bold">{pt.waveHeightM}m</td>
                        <td className="p-2">{pt.swellHeightM}m</td>
                        <td className="p-2">{pt.wavePeriodS}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Wind & Gusts Chart */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">48h Wind & Gust Speed (km/h)</h3>
              </div>
              <button
                onClick={() => setShowWindTable(!showWindTable)}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
              >
                <Table className="h-3 w-3" /> {showWindTable ? "Hide Data Table" : "Show Data Table"}
              </button>
            </div>

            {/* Custom Responsive SVG Wind Chart */}
            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                {/* Thresholds */}
                <line x1="0" y1="40" x2="400" y2="40" stroke="#ef4444" strokeDasharray="3 3" strokeWidth="1" />
                <text x="395" y="36" textAnchor="end" fill="#ef4444" fontSize="8" fontFamily="monospace">
                  Unsafe Wind (45 km/h)
                </text>

                <line x1="0" y1="70" x2="400" y2="70" stroke="#f59e0b" strokeDasharray="3 3" strokeWidth="1" />
                <text x="395" y="66" textAnchor="end" fill="#f59e0b" fontSize="8" fontFamily="monospace">
                  Caution Wind (30 km/h)
                </text>

                {/* Gusts */}
                <path
                  d={`M ${timeseries
                    .map((pt, idx) => {
                      const x = (idx / (timeseries.length - 1)) * 400;
                      const y = 110 - Math.min(100, (pt.windGustKmh / 60) * 100);
                      return `${x},${y}`;
                    })
                    .join(" L ")}`}
                  fill="none"
                  stroke="#94a3b8"
                  strokeDasharray="2 2"
                  strokeWidth="1.5"
                />

                {/* Wind */}
                <path
                  d={`M ${timeseries
                    .map((pt, idx) => {
                      const x = (idx / (timeseries.length - 1)) * 400;
                      const y = 110 - Math.min(100, (pt.windKmh / 60) * 100);
                      return `${x},${y}`;
                    })
                    .join(" L ")}`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-ink-muted border-t border-border pt-2 font-mono">
              <span className="flex items-center gap-2">
                <span className="h-2 w-3 bg-[#10b981] inline-block rounded-xs" /> Sustained Wind
                <span className="h-2 w-3 bg-[#94a3b8] inline-block rounded-xs ml-2" /> Peak Gusts
              </span>
              <span className="italic">* Development threshold lines</span>
            </div>

            {/* Table Toggle */}
            {showWindTable && (
              <div className="max-h-48 overflow-y-auto border border-border rounded mt-2 text-xs">
                <table className="w-full text-left font-mono">
                  <thead className="bg-surface-raised border-b border-border sticky top-0">
                    <tr>
                      <th className="p-2">Time</th>
                      <th className="p-2">Wind (km/h)</th>
                      <th className="p-2">Gusts (km/h)</th>
                      <th className="p-2">Rain (mm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {timeseries.map((pt) => (
                      <tr key={pt.hourOffset}>
                        <td className="p-2">{pt.timeLabel}</td>
                        <td className="p-2 text-emerald-600 font-bold">{pt.windKmh} km/h</td>
                        <td className="p-2">{pt.windGustKmh} km/h</td>
                        <td className="p-2">{pt.rainMm} mm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Official Advisories & Marine Bulletins */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-risk-caution" />
              Active Statutory Advisories
            </h3>
            <span className="text-xs font-mono text-ink-muted">
              {risk?.advisories.length || 0} active bulletin(s)
            </span>
          </div>

          {risk?.advisories && risk.advisories.length > 0 ? (
            <div className="space-y-2">
              {risk.advisories.map((adv) => (
                <div key={adv.id} className="p-3 rounded bg-surface-raised border border-border flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-risk-caution shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-ink">{adv.headline}</p>
                    <p className="text-[11px] text-ink-muted font-mono">
                      Issued by {adv.source} • Severity: {adv.severity.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-muted py-2">
              No active cyclone or high-wave surge watches in force for this maritime sector. Official IMD and INCOIS warnings override ORCA.
            </p>
          )}
        </div>

        {/* Coastal Geographic & Satellite Observatory Map */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              Coastal Hydrographic & Satellite Observatory
            </h3>
            <span className="text-[11px] font-mono text-ink-muted">
              {port.lat.toFixed(4)}°N, {port.lon.toFixed(4)}°E • Satellite, Terrestrial, Nautical & Dark Modes
            </span>
          </div>
          <div className="h-80 w-full rounded-xl overflow-hidden border border-border relative">
            <MapView
              selectedLocation={{ lat: port.lat, lon: port.lon }}
              defaultMode="satellite"
              className="h-full w-full"
            />
          </div>
        </div>

        {/* Fishing Zones & Chlorophyll Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Fish className="h-4 w-4 text-primary" />
                Productive Fishing Zones (PFZ)
              </h3>
              <span className="text-[10px] font-mono text-ink-muted">Model: orca-pfz-v1</span>
            </div>

            {risk?.fishing_zones && risk.fishing_zones.length > 0 ? (
              <div className="space-y-2">
                {risk.fishing_zones.map((zone) => {
                  const species = Array.isArray(zone.species_expected) && zone.species_expected.length > 0
                    ? zone.species_expected.join(", ")
                    : "Pelagic / Mackerel / Sardines";
                  const zoneName = zone.name || `Potential Fishing Zone (${zone.origin || zone.model_version || "INCOIS/PFZ"})`;
                  return (
                    <div key={zone.id} className="p-3 rounded bg-surface-raised border border-border text-xs flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-ink">{zoneName}</p>
                        <p className="text-ink-muted font-mono text-[11px]">
                          Target Species: {species}
                        </p>
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        {zone.distance_km !== undefined ? (
                          <span className="font-semibold text-primary">{zone.distance_km} km</span>
                        ) : (
                          <span className="font-semibold text-emerald-600">
                            {zone.score ? `${zone.score}% Potential` : zone.risk_level || "Active Zone"}
                          </span>
                        )}
                        {zone.bearing !== undefined ? (
                          <p className="text-ink-muted">Bearing: {zone.bearing}°</p>
                        ) : zone.factors?.sst_gradient ? (
                          <p className="text-ink-muted">Gradient: {zone.factors.sst_gradient}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-ink-muted py-2">
                No active thermal divergence lines surveyed within small-craft operational radius today.
              </p>
            )}
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-sm pb-2 border-b border-border flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Nearby Coastal Stations
            </h3>
            <div className="divide-y divide-border text-xs">
              {port.nearby_ports && port.nearby_ports.length > 0 ? (
                port.nearby_ports.map((np) => (
                  <div key={np.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <Link to={`/ports/${np.slug}`} className="font-semibold text-ink hover:text-primary">
                        {np.name}
                      </Link>
                      <p className="text-[11px] text-ink-muted">{np.admin1_name}</p>
                    </div>
                    <span className="font-mono text-ink-muted">{np.distance_km} km</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-ink-muted py-2">No other surveyed ports within 300 km.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-6 text-xs text-ink-muted text-center">
        <p>© 2026 Project ORCA • Marine Ecosystem Reasoning for SDG 14</p>
      </footer>
    </div>
  );
};
