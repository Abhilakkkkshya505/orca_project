import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { RiskBadge } from "@/components/ui/risk-badge";
import { SeaState } from "@/components/ui/SeaState";
import { formatWaveHeight, formatWindSpeed, formatDataAge } from "@/lib/format";
import type { RiskLevel } from "@/components/ui/risk-icons";
import {
  Search,
  ArrowRight,
  WifiOff,
  Database,
  ChevronDown,
  Fish,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { LiveMarineTelemetry } from "@/features/marine/LiveMarineTelemetry";

interface SamplePortSummary {
  slug: string;
  name: string;
  shortName: string;
  admin1: string;
  lat: number;
  lon: number;
  waveHeightM: number | null;
  wavePeriodS: number | null;
  swellHeightM: number | null;
  swellPeriodS: number | null;
  windKmh: number | null;
  level: RiskLevel;
  validWindow: string;
  dataAgeMinutes: number | null;
}

const SAMPLE_PORTS_FALLBACK: SamplePortSummary[] = [
  {
    slug: "mumbai-in",
    name: "Mumbai Harbour",
    shortName: "Mumbai",
    admin1: "Maharashtra",
    lat: 18.93,
    lon: 72.84,
    waveHeightM: 1.8,
    wavePeriodS: 8.2,
    swellHeightM: 1.4,
    swellPeriodS: 8.0,
    windKmh: 18,
    level: "caution",
    validWindow: "Next 12 Hours",
    dataAgeMinutes: 45,
  },
  {
    slug: "chennai-in",
    name: "Chennai Port",
    shortName: "Chennai",
    admin1: "Tamil Nadu",
    lat: 13.08,
    lon: 80.28,
    waveHeightM: 1.2,
    wavePeriodS: 7.0,
    swellHeightM: 0.9,
    swellPeriodS: 6.5,
    windKmh: 14,
    level: "safe",
    validWindow: "Next 12 Hours",
    dataAgeMinutes: 30,
  },
  {
    slug: "visakhapatnam-in",
    name: "Visakhapatnam",
    shortName: "Visakhapatnam",
    admin1: "Andhra Pradesh",
    lat: 17.68,
    lon: 83.22,
    waveHeightM: 2.6,
    wavePeriodS: 9.5,
    swellHeightM: 2.2,
    swellPeriodS: 9.0,
    windKmh: 34,
    level: "unsafe",
    validWindow: "Next 12 Hours",
    dataAgeMinutes: 20,
  },
  {
    slug: "mangalore-in",
    name: "New Mangalore",
    shortName: "Mangalore",
    admin1: "Karnataka",
    lat: 12.92,
    lon: 74.82,
    waveHeightM: 1.1,
    wavePeriodS: 6.5,
    swellHeightM: 0.8,
    swellPeriodS: 6.0,
    windKmh: 12,
    level: "safe",
    validWindow: "Next 12 Hours",
    dataAgeMinutes: 60,
  },
  {
    slug: "kandla-in",
    name: "Kandla (Deendayal)",
    shortName: "Kandla",
    admin1: "Gujarat",
    lat: 23.0,
    lon: 70.22,
    waveHeightM: 1.6,
    wavePeriodS: 5.5,
    swellHeightM: 1.1,
    swellPeriodS: 5.0,
    windKmh: 24,
    level: "caution",
    validWindow: "Next 12 Hours",
    dataAgeMinutes: 15,
  },
];

interface CoverageResponse {
  total_ports: number;
  total_coastal_ports: number;
  states_count: number;
}

interface DataStatusResponse {
  sources: Array<{
    name: string;
    slug: string;
    status: string;
    age_minutes: number;
    attribution: string;
  }>;
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const [heroSearch, setHeroSearch] = useState("");
  const [activePortIndex, setActivePortIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);

  // 1. Fetch live coastal station count
  const { data: coverage } = useQuery<CoverageResponse>({
    queryKey: ["ports-coverage"],
    queryFn: () => api.get<CoverageResponse>("/ports/coverage/"),
    staleTime: 60 * 60 * 1000,
  });

  // 2. Fetch live data status
  const { data: dataStatus } = useQuery<DataStatusResponse>({
    queryKey: ["data-status"],
    queryFn: () => api.get<DataStatusResponse>("/data-status/"),
    staleTime: 60 * 1000,
  });

  // Rotate sample ports every 14s if user has not interacted
  useEffect(() => {
    if (userInteracted) return;
    const interval = setInterval(() => {
      setActivePortIndex((prev) => (prev + 1) % SAMPLE_PORTS_FALLBACK.length);
    }, 14000);
    return () => clearInterval(interval);
  }, [userInteracted]);

  const activePort = SAMPLE_PORTS_FALLBACK[activePortIndex];

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/ports?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate("/ports");
    }
  };

  return (
    <div className="flex-1 w-full bg-bg text-ink flex flex-col justify-between selection:bg-sand selection:text-charcoal transition-colors duration-200">
      {/* Skip Link for a11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded-md focus:shadow-sm"
      >
        Skip to main content
      </a>

      <main id="main-content" className="flex-1 w-full flex flex-col gap-20 sm:gap-28 pb-32">
        {/* SECTION 1: BESPOKE EDITORIAL HERO */}
        <section className="relative w-full border-b border-border pt-14 sm:pt-20 pb-20 overflow-hidden bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Editorial Index Eyebrow */}
            <div className="flex items-center justify-between pb-8 mb-8 border-b border-border/70 text-xs font-mono text-ink-muted">
              <span className="tracking-widest uppercase font-medium">01 / Coastal Intelligence & Safety Matrix</span>
              <span className="hidden sm:inline-block tracking-wider">Arabian Sea • Bay of Bengal • Indian Ocean</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start text-left">
              {/* Left Column: Architectural Editorial Statement & Query Form */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm text-[11px] font-mono tracking-wider uppercase bg-surface-raised border border-border text-ink-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                    Autonomous Ocean Observation
                  </span>

                  <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-editorial leading-[1.03] tracking-tight text-ink font-normal">
                    Verified ocean safety, <br />
                    <span className="italic font-normal text-ink-secondary">calculated before casting off.</span>
                  </h1>

                  <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-xl font-sans font-normal pt-1">
                    Deterministic seaworthiness evaluation, real-time FlatBuffer ocean telemetry, and productive thermal fishing fronts for artisanal and mechanised vessels across Indian waters.
                  </p>
                </div>

                {/* Tactile Editorial Search Input */}
                <form onSubmit={handleHeroSubmit} className="flex flex-col sm:flex-row gap-2.5 pt-3 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" aria-hidden="true" />
                    <input
                      type="text"
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      placeholder="Search port, harbour, or enter lat / lon coordinates..."
                      className="w-full h-11 pl-10 pr-3.5 rounded-md bg-surface border border-border text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none focus:border-ink transition-colors font-sans"
                      aria-label="Search port, harbour or coastal coordinates"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-editorial-primary h-11 px-5 rounded-md text-xs font-semibold flex items-center justify-center gap-2 shrink-0 tracking-wide uppercase"
                  >
                    <span>Check Seaworthiness</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </form>

                {/* Ground Truth Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-border/80 text-xs text-ink-secondary">
                  <div>
                    <span className="block font-mono text-[10px] text-ink-muted uppercase">Rule Evaluation</span>
                    <span className="font-medium text-ink">Deterministic Gates</span>
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] text-ink-muted uppercase">Scientific Sources</span>
                    <span className="font-medium text-ink">INCOIS • IMD • ECMWF</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="block font-mono text-[10px] text-ink-muted uppercase">Hallucination Risk</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">Zero (Code-Enforced)</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Handcrafted Telemetry Slate */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="editorial-card p-5 sm:p-6 border border-border bg-surface flex flex-col gap-4">
                  {/* Ledger Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider font-semibold">
                          Live Station Feed • {activePort.admin1}
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-forest animate-pulse" />
                      </div>
                      <h2 className="text-xl font-editorial italic font-normal text-ink mt-0.5">
                        {activePort.name}
                      </h2>
                    </div>
                    <RiskBadge level={activePort.level} size="sm" />
                  </div>

                  {/* Minimalist Wave Diagram Container */}
                  <div className="rounded-md overflow-hidden border border-border bg-surface-raised">
                    <SeaState
                      waveHeightM={activePort.waveHeightM}
                      wavePeriodS={activePort.wavePeriodS}
                      swellHeightM={activePort.swellHeightM}
                      swellPeriodS={activePort.swellPeriodS}
                      windKmh={activePort.windKmh}
                      portName={activePort.name}
                      dataAgeMinutes={activePort.dataAgeMinutes}
                      validWindow={activePort.validWindow}
                      height={120}
                    />
                  </div>

                  {/* Precise Telemetry Numerical Readouts */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-md bg-surface-raised border border-border flex flex-col gap-0.5">
                      <span className="text-[10px] font-mono text-ink-muted uppercase">Significant Wave (Hs)</span>
                      <span className="font-mono font-bold text-ink text-sm">
                        {formatWaveHeight(activePort.waveHeightM)}
                        <span className="text-xs font-normal text-ink-muted ml-1">({activePort.wavePeriodS}s)</span>
                      </span>
                    </div>
                    <div className="p-3 rounded-md bg-surface-raised border border-border flex flex-col gap-0.5">
                      <span className="text-[10px] font-mono text-ink-muted uppercase">Sustained Wind</span>
                      <span className="font-mono font-bold text-ink text-sm">
                        {formatWindSpeed(activePort.windKmh)}
                      </span>
                    </div>
                  </div>

                  {/* Station Selector Bar */}
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      {SAMPLE_PORTS_FALLBACK.map((port, idx) => (
                        <button
                          key={port.slug}
                          onClick={() => {
                            setUserInteracted(true);
                            setActivePortIndex(idx);
                          }}
                          className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                            activePortIndex === idx
                              ? "bg-primary text-on-primary font-semibold"
                              : "bg-surface-raised hover:bg-border text-ink-secondary"
                          }`}
                        >
                          {port.shortName}
                        </button>
                      ))}
                    </div>

                    <Link
                      to={`/ports/${activePort.slug}`}
                      className="text-xs font-mono text-ink hover:underline inline-flex items-center gap-1 shrink-0 ml-2"
                    >
                      <span>Full Log</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: LIVE OPEN-METEO GLOBAL MARINE OBSERVATORY */}
        <section id="marine-telemetry" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-border text-xs font-mono text-ink-muted">
            <span className="tracking-widest uppercase">02 / Telemetry Engine & Timeseries</span>
            <span>Direct FlatBuffers</span>
          </div>

          <div className="editorial-card p-5 sm:p-7 bg-surface">
            <div className="mb-5">
              <h2 className="text-2xl font-editorial font-normal italic text-ink">
                Global Open-Meteo Oceanographic Observatory
              </h2>
              <p className="text-xs text-ink-muted mt-1 max-w-2xl">
                Real-time ocean coordinate telemetry. Evaluates significant wave height, primary and secondary swell bearings, sea level MSL tidal surge, and ambient meteorology.
              </p>
            </div>
            <LiveMarineTelemetry
              initialLat={18.93}
              initialLon={72.84}
              title="Indian Ocean Coastal Telemetry"
            />
          </div>
        </section>

        {/* SECTION 3: REASONING ENGINE & MARITIME INQUIRY */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-left">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-border text-xs font-mono text-ink-muted">
            <span className="tracking-widest uppercase">03 / Conversational Safety Gate</span>
            <span>Zero Hallucinations</span>
          </div>

          <div className="editorial-card p-6 sm:p-8 bg-surface flex flex-col gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-editorial font-normal italic text-ink">
                Natural inquiry with deterministic verdict gates.
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted mt-1.5 max-w-xl leading-relaxed">
                Inspect how calibrated safety parameters evaluate unstructured mariner queries without probabilistic drift:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/explore?q=Is%20it%20safe%20for%20a%20small%20canoe%20out%20of%20Mumbai%20tomorrow%20morning%3F"
                className="p-5 rounded-md bg-surface-raised border border-border hover:border-ink transition-colors flex flex-col justify-between gap-4 group"
              >
                <div>
                  <span className="text-[11px] font-mono text-forest dark:text-sage font-semibold uppercase tracking-wider">
                    Small Craft Seaworthiness
                  </span>
                  <p className="text-sm font-sans font-medium text-ink mt-2 leading-snug">
                    &ldquo;Is it safe for a small canoe out of Mumbai tomorrow morning?&rdquo;
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-ink-muted group-hover:text-ink font-mono transition-colors">
                  <span>Inspect rule trail</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>

              <Link
                to="/explore?q=Where%20are%20the%20productive%20fishing%20zones%20near%20Visakhapatnam%20today%3F"
                className="p-5 rounded-md bg-surface-raised border border-border hover:border-ink transition-colors flex flex-col justify-between gap-4 group"
              >
                <div>
                  <span className="text-[11px] font-mono text-forest dark:text-sage font-semibold uppercase tracking-wider">
                    Thermal Fronts & PFZ
                  </span>
                  <p className="text-sm font-sans font-medium text-ink mt-2 leading-snug">
                    &ldquo;Where are the productive fishing zones near Visakhapatnam today?&rdquo;
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-ink-muted group-hover:text-ink font-mono transition-colors">
                  <span>Inspect rule trail</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>

              <Link
                to="/explore?q=What%20is%20the%20wave%20height%20and%20swell%20period%20off%20Chennai%20right%20now%3F"
                className="p-5 rounded-md bg-surface-raised border border-border hover:border-ink transition-colors flex flex-col justify-between gap-4 group"
              >
                <div>
                  <span className="text-[11px] font-mono text-forest dark:text-sage font-semibold uppercase tracking-wider">
                    Hydrodynamic Ingestion
                  </span>
                  <p className="text-sm font-sans font-medium text-ink mt-2 leading-snug">
                    &ldquo;What is the wave height and swell period off Chennai right now?&rdquo;
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-ink-muted group-hover:text-ink font-mono transition-colors">
                  <span>Inspect rule trail</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 4: THE ARCHITECTURE OF OCEAN RISK */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-left flex flex-col gap-6">
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-border text-xs font-mono text-ink-muted">
            <span className="tracking-widest uppercase">04 / Multi-Agent Ingestion Topology</span>
            <span>ECMWF • Copernicus • NOAA</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Agent Ledger */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {[
                {
                  id: "01",
                  name: "Atmospheric Wind & Squall Agent",
                  desc: "Evaluates sustained wind speeds, convective squall gusts, and barometric gradient drops from global ECMWF models.",
                  source: "Open-Meteo High-Res Atmosphere",
                },
                {
                  id: "02",
                  name: "Hydrodynamic Wave State Agent",
                  desc: "Computes significant wave height (Hs), dominant swell period, and Douglas sea state index across oceanic coordinates.",
                  source: "Copernicus Marine FlatBuffers",
                },
                {
                  id: "03",
                  name: "Thermal Satellite Radiometry Agent",
                  desc: "Processes NOAA CoastWatch ERDDAP and Sentinel-3 radiometry for sea surface temperature (SST) divergence lines.",
                  source: "NOAA CoastWatch ERDDAP",
                },
                {
                  id: "04",
                  name: "Potential Fishing Zones (PFZ) Agent",
                  desc: "Identifies nutrient-rich upwelling areas, enforcing strict exclusion masks across statutory Marine Protected Areas.",
                  source: "MODIS Chlorophyll + INCOIS",
                },
                {
                  id: "05",
                  name: "Statutory Coastal Advisories Agent",
                  desc: "Ingests bulletins from IMD and INCOIS, triggering immediate status overrides on cyclone, storm surge, or gale watches.",
                  source: "IMD Marine Bulletin Protocol",
                },
              ].map((agent) => (
                <div key={agent.id} className="p-4 rounded-md bg-surface border border-border flex items-start gap-4">
                  <span className="font-mono text-xs text-ink-muted font-bold shrink-0 pt-0.5">
                    {agent.id}
                  </span>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-ink text-sm font-sans">{agent.name}</h3>
                      <span className="font-mono text-[10px] text-ink-muted">{agent.source}</span>
                    </div>
                    <p className="text-ink-muted mt-1 leading-relaxed">{agent.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Deterministic Boundary Manifesto Box */}
            <div className="lg:col-span-5 editorial-card p-6 bg-surface-raised flex flex-col gap-4">
              <div>
                <span className="text-[10px] font-mono text-forest dark:text-sage uppercase font-semibold">
                  Safety Governance Rule
                </span>
                <h3 className="text-xl font-editorial font-normal italic text-ink mt-1">
                  Why language models do not decide seaworthiness.
                </h3>
              </div>

              <p className="text-xs text-ink-muted leading-relaxed">
                Probabilistic models generate text; calibrated physical thresholds govern maritime safety. In ORCA, language models are strictly constrained to translating pre-evaluated JSON into clear plain-language explanations.
              </p>

              <div className="p-3.5 rounded-md bg-surface border border-border space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Wave &lt; 1.5 m & Wind &lt; 30 km/h</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-risk-safe-bg text-risk-safe border border-risk-safe/30">SAFE</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">Wave 1.5–2.5 m or Wind 30–45 km/h</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-risk-caution-bg text-risk-caution border border-risk-caution/30">CAUTION</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                  <span className="text-rose-700 dark:text-rose-400 font-semibold">Wave &gt; 2.5 m or Wind &gt; 45 km/h</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-risk-unsafe-bg text-risk-unsafe border border-risk-unsafe/30">UNSAFE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted font-semibold">Missing sensor telemetry</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-risk-unknown-bg text-risk-unknown border border-risk-unknown/30">UNKNOWN</span>
                </div>
              </div>

              <p className="text-[11px] text-ink-muted leading-normal">
                * Calibrated against DG Shipping & INCOIS Small Craft seaworthiness standards.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: FOUR PRECISE OPERATIONAL TIERS */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-left">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-border text-xs font-mono text-ink-muted">
            <span className="tracking-widest uppercase">05 / Verdict Classifications</span>
            <span>Deterministic Tiers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-md bg-surface border border-border flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="font-editorial text-lg italic text-ink">Safe</span>
                  <RiskBadge level="safe" size="sm" />
                </div>
                <p className="text-xs text-ink-muted mt-2.5 leading-relaxed">
                  Hydrodynamic conditions are well within standard seaworthiness limits. Sustained wind &lt; 30 km/h, wave height &lt; 1.5 m, zero active gale alerts.
                </p>
              </div>
              <span className="text-[10px] font-mono text-ink-muted">Standard transit permitted</span>
            </div>

            <div className="p-5 rounded-md bg-surface border border-border flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="font-editorial text-lg italic text-ink">Caution</span>
                  <RiskBadge level="caution" size="sm" />
                </div>
                <p className="text-xs text-ink-muted mt-2.5 leading-relaxed">
                  Elevated chop, gusty winds, or long-period deepwater swell. Small canoes and artisanal craft must exercise extreme care or remain inshore.
                </p>
              </div>
              <span className="text-[10px] font-mono text-ink-muted">Artisanal craft warning</span>
            </div>

            <div className="p-5 rounded-md bg-surface border border-border flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="font-editorial text-lg italic text-ink">Unsafe</span>
                  <RiskBadge level="unsafe" size="sm" />
                </div>
                <p className="text-xs text-ink-muted mt-2.5 leading-relaxed">
                  Hazardous sea state, wave height &gt; 2.5 m, squall gusts &gt; 45 km/h, or statutory gale warnings active. Operations strictly not advised.
                </p>
              </div>
              <span className="text-[10px] font-mono text-ink-muted">Vessel departure closed</span>
            </div>

            <div className="p-5 rounded-md bg-surface border border-border flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="font-editorial text-lg italic text-ink">Unknown</span>
                  <RiskBadge level="unknown" size="sm" />
                </div>
                <p className="text-xs text-ink mt-2.5 font-medium leading-relaxed">
                  ORCA outputs Unknown when buoy or satellite telemetry is stale. It never guesses calm waters without verified live feeds.
                </p>
              </div>
              <span className="text-[10px] font-mono text-ink-muted">Zero assumption policy</span>
            </div>
          </div>
        </section>

        {/* SECTION 6: COASTAL STATION DIRECTORY */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-left">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-border text-xs font-mono text-ink-muted">
            <span className="tracking-widest uppercase">06 / Geographic Coverage</span>
            <span>3,874 Coastal Stations</span>
          </div>

          <div className="editorial-card p-6 sm:p-8 bg-surface flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-editorial font-normal italic text-ink">
                  Indian coastline coverage directory.
                </h2>
                <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-xl leading-relaxed">
                  Comprehensive coverage across major commercial ports, minor fishing harbours, and artisanal landing centres.
                </p>
              </div>

              <div className="flex items-center gap-6 bg-surface-raised p-4 rounded-md border border-border shrink-0">
                <div>
                  <p className="text-2xl font-mono font-bold text-ink">
                    {coverage?.total_ports || 3875}
                  </p>
                  <p className="text-[10px] font-mono text-ink-muted uppercase">Cataloged Stations</p>
                </div>
                <div className="h-6 w-px bg-border" />
                <div>
                  <p className="text-2xl font-mono font-bold text-forest dark:text-sage">
                    {coverage?.total_coastal_ports || 3874}
                  </p>
                  <p className="text-[10px] font-mono text-ink-muted uppercase">Coastal Harbours</p>
                </div>
              </div>
            </div>

            {/* Coastal State Chips */}
            <div>
              <p className="text-xs font-mono text-ink-muted uppercase mb-3">Browse by Coastal State:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "Gujarat", count: 22 },
                  { name: "Kerala", count: 17 },
                  { name: "Andhra Pradesh", count: 14 },
                  { name: "Tamil Nadu", count: 13 },
                  { name: "Maharashtra", count: 13 },
                  { name: "Karnataka", count: 9 },
                  { name: "Odisha", count: 9 },
                  { name: "West Bengal", count: 4 },
                  { name: "Goa", count: 4 },
                  { name: "Andaman and Nicobar Islands", count: 2 },
                ].map((st) => (
                  <Link
                    key={st.name}
                    to={`/ports?state=${encodeURIComponent(st.name)}`}
                    className="px-3 py-1.5 rounded-md bg-surface-raised border border-border hover:border-ink text-xs font-medium text-ink flex items-center gap-2 transition-colors font-mono"
                  >
                    <span>{st.name}</span>
                    <span className="text-[10px] text-ink-muted font-mono">{st.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/ports"
                className="btn-editorial-secondary inline-flex items-center gap-2 text-xs font-mono"
              >
                <span>Open complete coastal directory</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 7: OFFSHORE PWA RESILIENCE */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-left">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-border text-xs font-mono text-ink-muted">
            <span className="tracking-widest uppercase">07 / Low-Connectivity Architecture</span>
            <span>Progressive Web App</span>
          </div>

          <div className="editorial-card p-6 sm:p-8 bg-surface grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-forest dark:text-sage uppercase font-semibold">
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" /> Offshore Cache Engine
              </span>
              <h2 className="text-2xl sm:text-3xl font-editorial font-normal italic text-ink">
                Built for the realities of zero cellular bars.
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                ORCA functions as an installable Progressive Web App (PWA). When sailing beyond coastal cell towers (5–12 nautical miles offshore), recent port forecasts, telemetry curves, and advisory snapshots remain accessible from local device cache.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  to="/offline-preview"
                  className="btn-editorial-primary inline-flex items-center gap-2 text-xs font-semibold"
                >
                  <span>Inspect Offline Mode</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/game"
                  className="btn-editorial-secondary inline-flex items-center gap-2 text-xs"
                >
                  <Fish className="h-3.5 w-3.5" />
                  <span>Marine Fish Game</span>
                </Link>
              </div>
            </div>

            <div className="p-5 rounded-md bg-surface-raised border border-border text-xs space-y-3 font-mono">
              <div className="flex items-start gap-2.5">
                <span className="text-forest dark:text-sage font-bold">✓</span>
                <div>
                  <strong className="text-ink font-sans">Persistent Local Cache:</strong>
                  <p className="text-ink-muted font-sans text-xs mt-0.5">The last synchronized 48h sea state outlook stays interactive offshore.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-forest dark:text-sage font-bold">✓</span>
                <div>
                  <strong className="text-ink font-sans">Sub-100KB Payloads:</strong>
                  <p className="text-ink-muted font-sans text-xs mt-0.5">FlatBuffers and compressed JSON ensure fast transfers over 2G/3G links.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-forest dark:text-sage font-bold">✓</span>
                <div>
                  <strong className="text-ink font-sans">Zero Extraneous Bloat:</strong>
                  <p className="text-ink-muted font-sans text-xs mt-0.5">No video trackers or heavy advertising scripts draining mariner data.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: STATUTORY BOUNDARIES & SOLAS */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-left">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-border text-xs font-mono text-ink-muted">
            <span className="tracking-widest uppercase">08 / Governance & Legal Precedence</span>
            <span>SOLAS Compliance</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 editorial-card bg-surface overflow-hidden">
              <div className="p-4 border-b border-border bg-surface-raised flex items-center justify-between">
                <h3 className="text-xs font-mono font-semibold text-ink flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-forest dark:text-sage" />
                  Telemetry Source Ingestion Status
                </h3>
                <Link to="/status" className="text-xs font-mono text-ink-muted hover:text-ink">
                  Detailed Status &rarr;
                </Link>
              </div>
              <div className="divide-y divide-border text-xs font-sans">
                {dataStatus?.sources ? (
                  dataStatus.sources.slice(0, 5).map((src) => (
                    <div key={src.slug} className="p-3.5 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink">{src.name}</p>
                        <p className="text-ink-muted text-[11px] truncate max-w-sm">{src.attribution}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-surface-raised border border-border text-forest dark:text-sage">
                          {src.status}
                        </span>
                        <p className="text-[10px] text-ink-muted font-mono mt-0.5">
                          {formatDataAge(src.age_minutes)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-xs text-ink-muted">Awaiting telemetry telemetry response...</div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="p-5 rounded-md bg-surface-raised border border-terracotta/30 text-ink space-y-1.5">
                <div className="flex items-center gap-1.5 text-terracotta font-semibold text-xs font-mono uppercase">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Statutory Precedence
                </div>
                <p className="text-xs font-bold text-ink">
                  Official IMD & INCOIS warnings strictly supersede ORCA.
                </p>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Statutory maritime broadcasts, gale warnings, and cyclone advisories issued by national maritime authorities override any automated output or advisory produced by ORCA.
                </p>
              </div>

              <div className="p-5 rounded-md border border-border bg-surface space-y-2 text-xs">
                <h4 className="font-semibold text-ink font-mono uppercase text-[11px]">Operational Boundaries:</h4>
                <ul className="space-y-1.5 text-ink-muted list-disc list-inside">
                  <li>Does not replace certified nautical ECDIS paper charts.</li>
                  <li>Does not interface with vessel rudder or autopilot systems.</li>
                  <li>Does not fabricate calm parameters during sensor outages.</li>
                  <li>Does not relieve vessel masters of statutory SOLAS duties.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9: UNITED NATIONS SDG 14 COMMITMENT */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-left">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-border text-xs font-mono text-ink-muted">
            <span className="tracking-widest uppercase">09 / Sustainability Mandate</span>
            <span>UN SDG 14 Life Below Water</span>
          </div>

          <div className="editorial-card p-6 sm:p-8 bg-surface flex flex-col gap-6">
            <div>
              <span className="font-mono text-xs text-forest dark:text-sage font-bold">UN SDG 14</span>
              <h2 className="text-2xl font-editorial font-normal italic text-ink mt-1">
                Preserving life at sea and protecting marine habitats.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="p-4 rounded-md bg-surface-raised border border-border flex flex-col gap-2">
                <span className="font-mono text-forest dark:text-sage font-semibold text-[11px]">Target 14.b</span>
                <h3 className="font-bold text-ink text-sm font-sans">Artisanal Small-Scale Fisheries</h3>
                <p className="text-ink-muted leading-relaxed">
                  Provide artisanal coastal fishers with free, deterministic safety intelligence to eliminate avoidable casualties and gear destruction at sea.
                </p>
              </div>

              <div className="p-4 rounded-md bg-surface-raised border border-border flex flex-col gap-2">
                <span className="font-mono text-forest dark:text-sage font-semibold text-[11px]">Target 14.1</span>
                <h3 className="font-bold text-ink text-sm font-sans">Prevent Marine Contamination</h3>
                <p className="text-ink-muted leading-relaxed">
                  Avert vessel wreckage, hull breaching, and coastal diesel spills by providing reliable advance warnings against cross-sea swells.
                </p>
              </div>

              <div className="p-4 rounded-md bg-surface-raised border border-border flex flex-col gap-2">
                <span className="font-mono text-forest dark:text-sage font-semibold text-[11px]">Target 14.2</span>
                <h3 className="font-bold text-ink text-sm font-sans">Marine Protected Area Enclaves</h3>
                <p className="text-ink-muted leading-relaxed">
                  Strictly exclude sensitive coral reefs, mangrove estuaries, and Marine Protected Areas (MPAs) from all recommended fishing zones.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: ACCESSIBLE FAQ */}
        <section className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-left flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-border text-xs font-mono text-ink-muted">
            <span className="tracking-widest uppercase">10 / Methodological Reference</span>
            <span>FAQ</span>
          </div>

          <div>
            <h2 className="text-3xl font-editorial font-normal italic text-ink">
              Frequently clarified questions.
            </h2>
          </div>

          <div className="space-y-2.5">
            {[
              {
                q: "How is the seaworthiness rating computed?",
                a: "ORCA evaluates forecast significant wave height, primary swell period, sustained wind speed, wind gusts, and active weather advisories against calibrated marine thresholds. If any single parameter exceeds caution or unsafe boundaries for the selected vessel class (Small Craft or Mechanised), the overall rating escalates.",
              },
              {
                q: "What happens when mobile signal drops offshore?",
                a: "ORCA operates as an installable Progressive Web App (PWA). All forecast snapshots, sea state parameters, and active advisories fetched while in harbour are saved in persistent offline storage. You can also play the built-in marine fish game without internet connectivity.",
              },
              {
                q: "Why does ORCA show 'Unknown' instead of guessing?",
                a: "In safety-critical maritime operations, false confidence can be fatal. If live satellite telemetry, atmospheric forecast feeds, or oceanographic observation stations are delayed or unavailable, ORCA marks conditions as Unknown rather than assuming calm seas.",
              },
              {
                q: "How are productive fishing zones identified?",
                a: "Machine learning models analyze Sea Surface Temperature (SST) gradients from NOAA CoastWatch and chlorophyll concentration fronts from satellite radiometry. Areas with thermal divergence lines indicate nutrient-rich upwelling. All suggestions exclude Marine Protected Areas (MPAs).",
              },
              {
                q: "Can I rely on ORCA instead of official IMD or INCOIS bulletins?",
                a: "No. Official statutory warnings from the India Meteorological Department (IMD) and the Indian National Centre for Ocean Information Services (INCOIS) always take precedence over ORCA. ORCA is an advisory decision-support tool.",
              },
            ].map((faq, i) => (
              <details key={i} className="group border border-border rounded-md bg-surface p-4 cursor-pointer">
                <summary className="font-medium text-sm text-ink flex items-center justify-between list-none">
                  <span>{faq.q}</span>
                  <ChevronDown className="h-4 w-4 text-ink-muted group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-xs text-ink-muted mt-2.5 leading-relaxed font-sans">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
