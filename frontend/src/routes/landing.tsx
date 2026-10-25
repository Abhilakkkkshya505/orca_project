import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { RiskBadge } from "@/components/ui/risk-badge";
import { SeaState } from "@/components/ui/SeaState";
import { formatWaveHeight, formatWindSpeed, formatDataAge } from "@/lib/format";
import type { RiskLevel } from "@/components/ui/risk-icons";
import {
  ShieldCheck,
  Search,
  ArrowRight,
  WifiOff,
  Database,
  ChevronDown,
  CloudSun,
  Waves,
  Satellite,
  Fish,
  AlertTriangle,
  Radio,
  Globe,
  Anchor,
  Compass,
} from "lucide-react";
import { LiveMarineTelemetry } from "@/features/marine/LiveMarineTelemetry";
import { useTheme } from "@/lib/theme/ThemeContext";
import GlimmerVale from "@/components/originkit/ui/glimmer-vale";
import TerraDusk from "@/components/originkit/ui/terra-dusk";
import PlinthTally from "@/components/originkit/ui/plinth-tally";

interface SamplePortSummary {
  slug: string;
  name: string;
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
    dataAgeMinutes: 50,
  },
  {
    slug: "port-blair-in",
    name: "Port Blair",
    admin1: "Andaman & Nicobar",
    lat: 11.67,
    lon: 92.75,
    waveHeightM: 1.9,
    wavePeriodS: 8.8,
    swellHeightM: 1.7,
    swellPeriodS: 8.5,
    windKmh: 22,
    level: "caution",
    validWindow: "Next 12 Hours",
    dataAgeMinutes: 40,
  },
];

interface CoverageResponse {
  total_ports: number;
  total_coastal_ports: number;
  by_country: Array<{ country_code: string; country_name: string; port_count: number }>;
  india_by_state: Array<{ admin1_name: string; port_count: number }>;
}

interface DataStatusResponse {
  sources: Array<{
    slug: string;
    name: string;
    status: string;
    age_minutes: number | null;
    attribution: string;
  }>;
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [heroSearch, setHeroSearch] = useState("");
  const [activePortIndex, setActivePortIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [showFullGlobe, setShowFullGlobe] = useState(false);

  // 1. Fetch coverage data
  const { data: coverage } = useQuery<CoverageResponse>({
    queryKey: ["ports", "coverage"],
    queryFn: () => api.get<CoverageResponse>("/ports/coverage/"),
    staleTime: 60 * 60 * 1000,
  });

  // 2. Fetch live data status
  const { data: dataStatus } = useQuery<DataStatusResponse>({
    queryKey: ["data-status"],
    queryFn: () => api.get<DataStatusResponse>("/data-status/"),
    staleTime: 60 * 1000,
  });

  // Rotate sample ports every 12s if user has not interacted
  useEffect(() => {
    if (userInteracted) return;
    const interval = setInterval(() => {
      setActivePortIndex((prev) => (prev + 1) % SAMPLE_PORTS_FALLBACK.length);
    }, 12000);
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
    <div className="flex-1 w-full bg-bg text-ink flex flex-col justify-between selection:bg-water selection:text-primary transition-colors duration-200">
      {/* Skip Link for a11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-md"
      >
        Skip to main content
      </a>

      <main id="main-content" className="flex-1 w-full flex flex-col gap-16 sm:gap-24 pb-24">
        {/* SECTION 1: EDITORIAL HERO SECTION */}
        <section className="relative w-full border-b border-border pt-12 sm:pt-16 pb-16 overflow-hidden bg-surface">
          {/* Subtle Glimmer Vale Atmosphere in Background */}
          <div
            className="absolute inset-0 overflow-hidden z-0 opacity-20 dark:opacity-30 pointer-events-none"
            aria-hidden="true"
          >
            <GlimmerVale
              speed={25}
              sparkle={40}
              density={45}
              scale={90}
              background="transparent"
              skyTop={resolvedTheme === "dark" ? "#0B0F17" : "#FAFAF9"}
              skyHorizon={resolvedTheme === "dark" ? "#131926" : "#F5F5F4"}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </div>

          {/* Terra Dusk 3D Globe Covering Right Half */}
          <div
            className="hidden lg:block absolute top-0 right-0 bottom-0 w-1/2 overflow-hidden z-0 pointer-events-auto opacity-75 dark:opacity-90"
            aria-label="Interactive 3D Earth Globe"
          >
            <TerraDusk
              background="transparent"
              size={620}
              stars={resolvedTheme === "dark" ? 4 : 1}
              speed={4}
              hover={6}
              sun="cursor"
              look={{
                clouds: 4,
                lights: resolvedTheme === "dark" ? 5 : 2,
                atmosphere: resolvedTheme === "dark" ? "#38BDF8" : "#0284C7",
              }}
              style={{
                position: "absolute",
                right: "-10%",
                top: "50%",
                transform: "translateY(-50%)",
                width: "620px",
                height: "620px",
              }}
            />
            {/* Smooth transition mask */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-surface to-transparent pointer-events-none" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center text-left">
            {/* Left Column: Headline, Plinth Tally Branding & Search */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              {/* Monolithic Plinth Tally 3D Extruded Brand Typography */}
              <div className="pt-1">
                <PlinthTally
                  text="ORCA"
                  size="hero"
                  subtitle="Ocean Risk & Coastal Analytics"
                  depth={8}
                  tiltIntensity={12}
                  glow={false}
                  className="!items-start"
                />
              </div>

              {/* Strict 2-Line Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight text-ink leading-[1.12]">
                Verified ocean safety. <br />
                Before casting off.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-xl font-normal">
                Deterministic seaworthiness ratings, live wave telemetry, and productive fishing zones for small-craft and mechanised vessels across Indian coastal waters.
              </p>

              {/* Clean Functional Search Bar */}
              <form onSubmit={handleHeroSubmit} className="flex flex-col sm:flex-row gap-2.5 pt-2 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" aria-hidden="true" />
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Search Mumbai, Kochi, Chennai, or coordinates..."
                    className="w-full h-11 pl-10 pr-3.5 rounded-lg bg-surface border border-border text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-primary transition-colors"
                    aria-label="Search port, harbour or coastal coordinates"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-ocean-primary h-11 px-5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Check Port</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </form>

              {/* Editorial Baseline Claims */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 text-xs text-ink-muted font-normal">
                <span className="flex items-center gap-1.5 text-ink font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Hardcoded Safety Rules
                </span>
                <span>• Official IMD & INCOIS Feeds</span>
                <span>• Zero AI Hallucinations</span>
              </div>
            </div>

            {/* Right Column: Live Harbour Telemetry Card */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="ocean-card p-5 sm:p-6 flex flex-col gap-4 border border-border bg-surface shadow-xs">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider font-semibold">
                        LIVE HARBOUR TELEMETRY • {activePort.admin1}
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Live station" />
                    </div>
                    <h2 className="text-lg font-heading font-bold text-ink mt-0.5">{activePort.name}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFullGlobe(!showFullGlobe)}
                      className="hidden lg:flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border border-border bg-surface-raised text-ink-muted hover:text-ink transition-colors"
                      title="Toggle globe view"
                    >
                      <Globe className="h-3 w-3 text-primary" />
                      <span>{showFullGlobe ? "Telemetry" : "Orbit"}</span>
                    </button>
                    <RiskBadge level={activePort.level} size="sm" />
                  </div>
                </div>

                {/* SeaState Live Animated Wave Display */}
                <div className="rounded-lg overflow-hidden border border-border bg-surface-raised">
                  <SeaState
                    waveHeightM={activePort.waveHeightM}
                    wavePeriodS={activePort.wavePeriodS}
                    swellHeightM={activePort.swellHeightM}
                    swellPeriodS={activePort.swellPeriodS}
                    windKmh={activePort.windKmh}
                    portName={activePort.name}
                    dataAgeMinutes={activePort.dataAgeMinutes}
                    validWindow={activePort.validWindow}
                    height={130}
                  />
                </div>

                {/* Metric Capsules */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface-raised border border-border flex flex-col gap-0.5">
                    <span className="text-ink-muted text-[11px] font-medium">Significant Wave</span>
                    <span className="font-mono text-ink font-semibold text-xs">
                      {formatWaveHeight(activePort.waveHeightM)} ({activePort.wavePeriodS}s)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-raised border border-border flex flex-col gap-0.5">
                    <span className="text-ink-muted text-[11px] font-medium">Sustained Wind</span>
                    <span className="font-mono text-ink font-semibold text-xs">
                      {formatWindSpeed(activePort.windKmh)}
                    </span>
                  </div>
                </div>

                {/* Station Selector Chips */}
                <div className="pt-2 border-t border-border">
                  <p className="text-[11px] text-ink-muted mb-1.5 font-medium">Switch sample harbour:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_PORTS_FALLBACK.map((port, idx) => (
                      <button
                        key={port.slug}
                        onClick={() => {
                          setUserInteracted(true);
                          setActivePortIndex(idx);
                        }}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                          activePortIndex === idx
                            ? "bg-primary text-white font-semibold"
                            : "bg-surface-raised hover:bg-border text-ink"
                        }`}
                      >
                        {port.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1 text-right">
                  <Link
                    to={`/ports/${activePort.slug}`}
                    className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 transition-colors"
                  >
                    View 48h outlook for {activePort.name} &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: LIVE OPEN-METEO GLOBAL MARINE OBSERVATORY */}
        <section id="marine-telemetry" className="max-w-7xl mx-auto w-full px-4 sm:px-6">
          <div className="border border-border rounded-xl p-5 sm:p-6 bg-surface">
            <div className="mb-4">
              <h2 className="text-xl font-heading font-bold text-ink">
                Global Open-Meteo Marine Telemetry Observatory
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Live ocean coordinate telemetry with wave height, swell directions, wind speed, and sea state.
              </p>
            </div>
            <LiveMarineTelemetry
              initialLat={18.93}
              initialLon={72.84}
              title="Indian Ocean Coastal Telemetry"
            />
          </div>
        </section>

        {/* SECTION 2: ASK IN PLAIN WORDS */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 text-left">
          <div className="border border-border rounded-xl p-6 sm:p-8 bg-surface flex flex-col gap-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-ink">
                Ask in plain words. Get deterministic safety verdicts.
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-xl leading-relaxed">
                Inspect how the deterministic evaluation engine processes real maritime queries:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/explore?q=Is%20it%20safe%20for%20a%20small%20canoe%20out%20of%20Mumbai%20tomorrow%20morning%3F"
                className="p-4 rounded-lg bg-surface border border-border hover:border-border-strong transition-colors flex flex-col justify-between gap-3 group"
              >
                <div>
                  <span className="text-[11px] font-mono text-primary font-semibold">Small Craft Seaworthiness</span>
                  <p className="text-xs font-medium text-ink mt-1.5 leading-snug">
                    &ldquo;Is it safe for a small canoe out of Mumbai tomorrow morning?&rdquo;
                  </p>
                </div>
                <span className="text-[11px] text-ink-muted group-hover:text-primary flex items-center gap-1 font-medium transition-colors">
                  Inspect verdict <ArrowRight className="h-3 w-3" />
                </span>
              </Link>

              <Link
                to="/explore?q=Where%20are%20the%20productive%20fishing%20zones%20near%20Visakhapatnam%20today%3F"
                className="p-4 rounded-lg bg-surface border border-border hover:border-border-strong transition-colors flex flex-col justify-between gap-3 group"
              >
                <div>
                  <span className="text-[11px] font-mono text-primary font-semibold">Thermal Fronts & PFZ</span>
                  <p className="text-xs font-medium text-ink mt-1.5 leading-snug">
                    &ldquo;Where are the productive fishing zones near Visakhapatnam today?&rdquo;
                  </p>
                </div>
                <span className="text-[11px] text-ink-muted group-hover:text-primary flex items-center gap-1 font-medium transition-colors">
                  Inspect verdict <ArrowRight className="h-3 w-3" />
                </span>
              </Link>

              <Link
                to="/explore?q=What%20is%20the%20wave%20height%20and%20swell%20period%20off%20Chennai%20right%20now%3F"
                className="p-4 rounded-lg bg-surface border border-border hover:border-border-strong transition-colors flex flex-col justify-between gap-3 group"
              >
                <div>
                  <span className="text-[11px] font-mono text-primary font-semibold">Live Hydrodynamics</span>
                  <p className="text-xs font-medium text-ink mt-1.5 leading-snug">
                    &ldquo;What is the wave height and swell period off Chennai right now?&rdquo;
                  </p>
                </div>
                <span className="text-[11px] text-ink-muted group-hover:text-primary flex items-center gap-1 font-medium transition-colors">
                  Inspect verdict <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 3: DETERMINISTIC ARCHITECTURE */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 text-left flex flex-col gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-ink">
              Five specialized agents. One deterministic rules engine.
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl leading-relaxed">
              ORCA separates data collection and explanation synthesis from safety judgment. LLMs format explanations; calibrated numerical thresholds decide safety.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Agent List */}
            <div className="lg:col-span-7 flex flex-col gap-2.5">
              {[
                {
                  icon: CloudSun,
                  name: "1. Weather Agent",
                  desc: "Evaluates sustained atmospheric wind speeds, squall gusts, and convective precipitation from Open-Meteo models.",
                },
                {
                  icon: Waves,
                  name: "2. Ocean State Agent",
                  desc: "Computes significant wave height, primary swell period, and Douglas sea state classification at oceanic coordinates.",
                },
                {
                  icon: Satellite,
                  name: "3. Satellite Telemetry Agent",
                  desc: "Processes NOAA CoastWatch ERDDAP and Sentinel imagery for sea surface temperature (SST) gradients and chlorophyll.",
                },
                {
                  icon: Fish,
                  name: "4. Fishing Zones Agent",
                  desc: "Identifies productive thermal divergence lines using machine learning, strictly excluding Marine Protected Areas.",
                },
                {
                  icon: Radio,
                  name: "5. Official Advisories Agent",
                  desc: "Ingests statutory bulletins from INCOIS and IMD, triggering override status on active cyclone and high-wave watches.",
                },
              ].map((agent, i) => (
                <div key={i} className="p-3.5 rounded-lg bg-surface border border-border flex items-start gap-3">
                  <div className="p-2 rounded-md bg-surface-raised text-primary shrink-0">
                    <agent.icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="text-xs">
                    <h3 className="font-semibold text-ink">{agent.name}</h3>
                    <p className="text-ink-muted mt-0.5 leading-relaxed">{agent.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Decision Rules Box */}
            <div className="lg:col-span-5 bg-surface-raised border border-border rounded-xl p-5 flex flex-col gap-3.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                <h3 className="font-heading font-bold text-sm text-ink">Who decides safety?</h3>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Large language models are inherently probabilistic and cannot be trusted with seaworthiness gates. In ORCA, language models only translate pre-evaluated JSON into clear language.
              </p>
              <div className="p-3 rounded-md bg-surface border border-border text-xs space-y-1 font-mono">
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Wave &lt; 1.5 m & Wind &lt; 30 km/h &rarr; SAFE</p>
                <p className="text-amber-600 dark:text-amber-400 font-semibold">⚠ Wave 1.5–2.5 m or Wind 30–45 km/h &rarr; CAUTION</p>
                <p className="text-rose-600 dark:text-rose-400 font-semibold">✕ Wave &gt; 2.5 m or Wind &gt; 45 km/h &rarr; UNSAFE</p>
                <p className="text-ink-muted font-semibold">? Missing or stale data &rarr; UNKNOWN</p>
              </div>
              <p className="text-[11px] text-ink-muted">
                * Calibrated against DG Shipping & INCOIS Small Craft seaworthiness standards.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: THE FOUR SAFETY LEVELS */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 text-left flex flex-col gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-ink">
              Four deterministic safety levels
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-xl leading-relaxed">
              Every port or coordinate is assigned exactly one level based on current observations and forecast models:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-lg bg-surface border border-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-ink">Safe</span>
                <RiskBadge level="safe" size="sm" />
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Conditions are well within standard seaworthiness limits. Wind &lt; 30 km/h, wave height &lt; 1.5 m, and no active gale alerts.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface border border-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-ink">Caution</span>
                <RiskBadge level="caution" size="sm" />
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Elevated chop, gusty winds, or long-period swell. Small canoes and artisanal craft should exercise extreme care or stay inshore.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface border border-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-ink">Unsafe</span>
                <RiskBadge level="unsafe" size="sm" />
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Dangerous sea state, high waves (&gt; 2.5 m), squalls (&gt; 45 km/h), or active statutory storm warnings. Operations not advised.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface border border-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-ink">Unknown</span>
                <RiskBadge level="unknown" size="sm" />
              </div>
              <p className="text-xs text-ink font-medium leading-relaxed">
                ORCA says unknown when data is missing or stale. It never assumes calm seas without verified feeds.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: COASTAL COVERAGE */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 text-left">
          <div className="border border-border rounded-xl p-6 sm:p-8 bg-surface flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-ink">
                  Coastal station directory
                </h2>
                <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-xl leading-relaxed">
                  Active monitoring across commercial ports, minor fishing harbours, and coastal fish landing centres.
                </p>
              </div>

              {/* Station Count Metrics */}
              <div className="flex items-center gap-6 bg-surface-raised p-3.5 rounded-lg border border-border">
                <div>
                  <p className="text-2xl font-bold font-mono text-primary">
                    {coverage?.total_ports || 3875}
                  </p>
                  <p className="text-[10px] text-ink-muted uppercase font-semibold">Total Stations</p>
                </div>
                <div className="h-6 w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold font-mono text-ink">
                    {coverage?.total_coastal_ports || 3874}
                  </p>
                  <p className="text-[10px] text-ink-muted uppercase font-semibold">Coastal Harbours</p>
                </div>
              </div>
            </div>

            {/* State Filter Pills */}
            <div>
              <p className="text-xs font-semibold text-ink mb-2">Browse Indian Coastal States:</p>
              <div className="flex flex-wrap gap-1.5">
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
                    className="px-2.5 py-1 rounded-md bg-surface-raised border border-border hover:border-border-strong text-xs font-medium text-ink flex items-center gap-1.5 transition-colors"
                  >
                    <span>{st.name}</span>
                    <span className="text-[10px] font-mono text-ink-muted">
                      {st.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <Link
                to="/ports"
                className="btn-ocean-secondary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium"
              >
                <span>Browse port directory</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 6: LOW SIGNAL & MARITIME MODE */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 text-left">
          <div className="border border-border rounded-xl p-6 sm:p-8 bg-surface grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-primary font-semibold">
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" /> Low Connectivity Maritime Mode
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-ink">
                Works when mobile reception drops at sea.
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                ORCA functions as an installable Progressive Web App (PWA). When heading beyond cell tower range (5–12 nautical miles), recent port forecasts and safety advisories remain accessible in offline storage.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                <Link
                  to="/game"
                  className="btn-ocean-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold"
                >
                  <Fish className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Marine Fish Game</span>
                </Link>
                <Link
                  to="/offline-preview"
                  className="btn-ocean-secondary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium"
                >
                  <span>Preview Offline Mode</span>
                </Link>
              </div>
            </div>

            <div className="bg-surface-raised border border-border rounded-lg p-5 flex flex-col gap-2.5 text-xs">
              <h3 className="font-semibold text-xs text-ink">Built for offshore realities:</h3>
              <ul className="space-y-2 text-ink-muted">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span><strong>Cached Forecasts:</strong> The last evaluated 48h outlook remains interactive with 0 bars offshore.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span><strong>Compact Payload:</strong> Compressed JSON payloads ensure fast loads over 2G/3G coastal connections.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span><strong>Zero Bloat:</strong> No heavy external analytics or video assets consuming maritime data quotas.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 7: DATA SOURCES & OPERATIONAL BOUNDARIES */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 text-left flex flex-col gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-ink">
              Data sources and operational boundaries
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-xl leading-relaxed">
              ORCA relies on public scientific telemetry and adheres to strict operational boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Data Sources Table */}
            <div className="lg:col-span-7 border border-border rounded-xl bg-surface overflow-hidden">
              <div className="p-3.5 border-b border-border bg-surface-raised flex items-center justify-between">
                <h3 className="text-xs font-mono font-semibold text-ink flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  Live Feed Status & Freshness
                </h3>
                <Link to="/status" className="text-xs text-primary font-medium hover:underline">
                  Full status &rarr;
                </Link>
              </div>
              <div className="divide-y divide-border text-xs">
                {dataStatus?.sources ? (
                  dataStatus.sources.slice(0, 5).map((src) => (
                    <div key={src.slug} className="p-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink">{src.name}</p>
                        <p className="text-ink-muted text-[11px] truncate max-w-sm">{src.attribution}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {src.status}
                        </span>
                        <p className="text-[10px] text-ink-muted font-mono mt-0.5">
                          {formatDataAge(src.age_minutes)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 text-xs text-ink-muted">Loading live telemetry status...</div>
                )}
              </div>
            </div>

            {/* IMD Override & SOLAS boundaries */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-ink space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Statutory Warning Precedence
                </div>
                <p className="text-xs font-semibold text-ink">
                  Official IMD and INCOIS warnings override ORCA.
                </p>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Statutory maritime broadcasts, gale alerts, and swell surge warnings issued by statutory authorities strictly supersede any output or safety rating produced by ORCA.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-surface space-y-1.5 text-xs">
                <h4 className="font-semibold text-ink">What ORCA does not do:</h4>
                <ul className="space-y-1 text-ink-muted list-disc list-inside">
                  <li>Does not replace certified ECDIS navigation charts or radar.</li>
                  <li>Does not steer or connect to vessel autopilot mechanisms.</li>
                  <li>Does not guess or invent safety values when sensor telemetry is down.</li>
                  <li>Does not replace captain/skipper responsibility under SOLAS regulations.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: SDG 14 TARGETS */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 text-left">
          <div className="border border-border rounded-xl p-6 sm:p-8 bg-surface flex flex-col gap-6">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 px-2 rounded-md bg-primary/10 text-primary font-mono text-xs font-bold">
                SDG 14
              </span>
              <div>
                <h2 className="text-xl font-heading font-bold tracking-tight text-ink">
                  Supporting UN Sustainable Development Goal 14
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">Conserve and sustainably use the oceans, seas and marine resources.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
              <div className="p-4 rounded-lg bg-surface-raised border border-border flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-primary font-bold text-[11px]">Target 14.b</span>
                  <Anchor className="h-4 w-4 text-ink-muted" />
                </div>
                <h3 className="font-bold text-ink">Support Artisanal Fisheries</h3>
                <p className="text-ink-muted leading-relaxed">
                  Provide small-scale artisanal fishers with free, accurate coastal safety intelligence to minimize loss of life and gear at sea.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-surface-raised border border-border flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-primary font-bold text-[11px]">Target 14.1</span>
                  <Compass className="h-4 w-4 text-ink-muted" />
                </div>
                <h3 className="font-bold text-ink">Prevent Coastal Marine Hazards</h3>
                <p className="text-ink-muted leading-relaxed">
                  Reduce accidental vessel wreckage and fuel contamination by warning small crafts against operating in hazardous swell surges.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-surface-raised border border-border flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-primary font-bold text-[11px]">Target 14.2</span>
                  <Fish className="h-4 w-4 text-ink-muted" />
                </div>
                <h3 className="font-bold text-ink">Sustainable Ecosystem Management</h3>
                <p className="text-ink-muted leading-relaxed">
                  Protect vulnerable marine ecosystems by enforcing exclusion zones across Marine Protected Areas (MPAs) in all fishing zone recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9: ACCESSIBLE FAQ */}
        <section className="max-w-3xl mx-auto w-full px-4 sm:px-6 text-left flex flex-col gap-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-ink">Frequently Answered Questions</h2>
            <p className="text-xs text-ink-muted mt-1">Operational details and methodology.</p>
          </div>

          <div className="space-y-2">
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
              <details key={i} className="group border border-border rounded-lg bg-surface p-3.5 sm:p-4 cursor-pointer">
                <summary className="font-semibold text-xs sm:text-sm text-ink flex items-center justify-between list-none">
                  <span>{faq.q}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-ink-muted group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-xs text-ink-muted mt-2 leading-relaxed">
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
