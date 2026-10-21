import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import { SeaState } from "@/components/ui/SeaState";
import { formatWaveHeight, formatWindSpeed, formatDataAge } from "@/lib/format";
import type { RiskLevel } from "@/components/ui/risk-icons";
import {
  Anchor,
  Compass,
  ShieldCheck,
  Search,
  ArrowRight,
  WifiOff,
  Database,
  ExternalLink,
  ChevronDown,
  CloudSun,
  Waves,
  Satellite,
  Fish,
  AlertTriangle,
  Radio,
} from "lucide-react";

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
  const [heroSearch, setHeroSearch] = useState("");
  const [activePortIndex, setActivePortIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);

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
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between selection:bg-primary/20">
      {/* Skip Link for a11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded-sm focus:shadow-md"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight hover:opacity-90">
            <Anchor className="h-6 w-6 text-primary" aria-hidden="true" />
            <span>ORCA</span>
          </Link>
          <span className="text-[11px] px-2 py-0.5 rounded bg-water text-primary font-mono font-medium">
            SDG 14
          </span>
        </div>
        <nav className="flex items-center gap-3 sm:gap-6 text-sm" aria-label="Main Navigation">
          <Link to="/explore" className="font-medium hover:text-primary transition-colors">
            Explore
          </Link>
          <Link to="/ports" className="font-medium hover:text-primary transition-colors">
            Ports
          </Link>
          <Link to="/how-it-works" className="hidden sm:inline font-medium hover:text-primary transition-colors">
            How it works
          </Link>
          <Link to="/login" className="font-medium hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link to="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main id="main-content" className="flex-1 w-full flex flex-col gap-20 pb-20">
        {/* SECTION 1: HERO WITH SEASTATE */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-12 sm:pt-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider bg-water px-2.5 py-1 rounded w-fit">
              <Compass className="h-3.5 w-3.5" aria-hidden="true" /> Marine Safety Intelligence
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Is it safe to go out? <br />
              <span className="text-primary">Ask about any port.</span>
            </h1>

            <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-2xl">
              ORCA turns scattered oceanographic, satellite, and meteorological data into deterministic safety ratings and productive fishing zones for Indian coastal waters.
            </p>

            {/* PlacePicker / Search Box */}
            <form onSubmit={handleHeroSubmit} className="flex flex-col sm:flex-row gap-3 pt-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" aria-hidden="true" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Enter port, harbour or coastal coordinates..."
                  className="w-full h-11 pl-10 pr-4 rounded-md bg-surface border border-border text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  aria-label="Search port or harbour"
                />
              </div>
              <Button type="submit" size="lg" className="gap-2 shrink-0">
                Check conditions
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5 font-medium text-ink">
                <ShieldCheck className="h-4 w-4 text-risk-safe" aria-hidden="true" /> Deterministic Rules
              </span>
              <span>• Official IMD & INCOIS Feeds</span>
              <span>• No AI Hallucinations</span>
            </div>
          </div>

          {/* Live Rotating Sample Port Card with SeaState */}
          <div className="lg:col-span-5 bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-card flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-ink-muted uppercase tracking-wider">
                    LIVE REGIONAL SAMPLE • {activePort.admin1}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-primary animate-ping" title="Live rotating station" />
                </div>
                <h2 className="text-xl font-bold tracking-tight mt-0.5">{activePort.name}</h2>
              </div>
              <RiskBadge level={activePort.level} size="md" />
            </div>

            {/* SeaState Live Animated Wave */}
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
                height={160}
              />
            </div>

            {/* Metric Capsules */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-surface-raised border border-border flex flex-col gap-0.5">
                <span className="text-ink-muted font-medium">Significant Wave</span>
                <span className="font-mono text-ink font-semibold text-sm">
                  {formatWaveHeight(activePort.waveHeightM)} ({activePort.wavePeriodS}s)
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface-raised border border-border flex flex-col gap-0.5">
                <span className="text-ink-muted font-medium">Sustained Wind</span>
                <span className="font-mono text-ink font-semibold text-sm">
                  {formatWindSpeed(activePort.windKmh)}
                </span>
              </div>
            </div>

            {/* Station Selector Chips */}
            <div className="pt-2 border-t border-border">
              <p className="text-[11px] text-ink-muted mb-2">Switch live sample harbour:</p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PORTS_FALLBACK.map((port, idx) => (
                  <button
                    key={port.slug}
                    onClick={() => {
                      setUserInteracted(true);
                      setActivePortIndex(idx);
                    }}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                      activePortIndex === idx
                        ? "bg-primary text-on-primary font-semibold"
                        : "bg-surface-raised hover:bg-border text-ink"
                    }`}
                  >
                    {port.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 text-right">
              <Link
                to={`/ports/${activePort.slug}`}
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                View full forecast & 48h charts for {activePort.name} &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 2: ASK IN PLAIN WORDS */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6">
          <div className="bg-surface border border-border rounded-xl p-6 sm:p-10 shadow-sm text-left flex flex-col gap-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-primary font-medium">
                Natural Interaction
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                Ask in plain words. Get verified decisions.
              </h2>
              <p className="text-sm text-ink-muted mt-2 max-w-2xl leading-relaxed">
                Click any real scenario below to open the interactive assistant with data verified from oceanographic models:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/explore?q=Is%20it%20safe%20for%20a%20small%20canoe%20out%20of%20Mumbai%20tomorrow%20morning%3F"
                className="p-4 rounded-lg bg-surface-raised border border-border hover:border-primary transition-all group flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-primary font-semibold">Small Craft Seaworthiness</span>
                  <p className="text-sm font-medium text-ink group-hover:text-primary transition-colors">
                    &ldquo;Is it safe for a small canoe out of Mumbai tomorrow morning?&rdquo;
                  </p>
                </div>
                <span className="text-xs text-ink-muted flex items-center gap-1 font-mono">
                  Launch Assistant <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>

              <Link
                to="/explore?q=Where%20are%20the%20productive%20fishing%20zones%20near%20Visakhapatnam%20today%3F"
                className="p-4 rounded-lg bg-surface-raised border border-border hover:border-primary transition-all group flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-primary font-semibold">Thermal Fronts & PFZ</span>
                  <p className="text-sm font-medium text-ink group-hover:text-primary transition-colors">
                    &ldquo;Where are the productive fishing zones near Visakhapatnam today?&rdquo;
                  </p>
                </div>
                <span className="text-xs text-ink-muted flex items-center gap-1 font-mono">
                  Launch Assistant <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>

              <Link
                to="/explore?q=What%20is%20the%20wave%20height%20and%20swell%20period%20off%20Chennai%20right%20now%3F"
                className="p-4 rounded-lg bg-surface-raised border border-border hover:border-primary transition-all group flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-primary font-semibold">Live Hydrodynamic Telemetry</span>
                  <p className="text-sm font-medium text-ink group-hover:text-primary transition-colors">
                    &ldquo;What is the wave height and swell period off Chennai right now?&rdquo;
                  </p>
                </div>
                <span className="text-xs text-ink-muted flex items-center gap-1 font-mono">
                  Launch Assistant <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 3: HOW IT WORKS & WHO DECIDES SAFETY */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 text-left flex flex-col gap-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-primary font-medium">Architecture</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
              Five specialized agents. One deterministic rules engine.
            </h2>
            <p className="text-sm text-ink-muted mt-2 max-w-3xl leading-relaxed">
              ORCA separates data collection and explanation synthesis from safety judgment. LLMs explain and summarize; hardcoded physical rules decide seaworthiness.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Flow of 5 Agents */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="p-4 rounded-lg bg-surface border border-border flex items-start gap-4">
                <div className="p-2.5 rounded bg-surface-raised text-primary shrink-0">
                  <CloudSun className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="text-sm">
                  <h3 className="font-semibold text-ink">1. Weather Agent</h3>
                  <p className="text-ink-muted text-xs mt-0.5 leading-relaxed">
                    Evaluates sustained atmospheric wind speeds, squall gusts, and convective precipitation from Open-Meteo models.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-surface border border-border flex items-start gap-4">
                <div className="p-2.5 rounded bg-surface-raised text-primary shrink-0">
                  <Waves className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="text-sm">
                  <h3 className="font-semibold text-ink">2. Ocean State Agent</h3>
                  <p className="text-ink-muted text-xs mt-0.5 leading-relaxed">
                    Computes significant wave height, primary swell period, and Douglas sea state classification at oceanic coordinates.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-surface border border-border flex items-start gap-4">
                <div className="p-2.5 rounded bg-surface-raised text-primary shrink-0">
                  <Satellite className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="text-sm">
                  <h3 className="font-semibold text-ink">3. Satellite Telemetry Agent</h3>
                  <p className="text-ink-muted text-xs mt-0.5 leading-relaxed">
                    Processes NOAA CoastWatch ERDDAP and Sentinel imagery for sea surface temperature (SST) gradients and chlorophyll concentration.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-surface border border-border flex items-start gap-4">
                <div className="p-2.5 rounded bg-surface-raised text-primary shrink-0">
                  <Fish className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="text-sm">
                  <h3 className="font-semibold text-ink">4. Fishing Zones Agent</h3>
                  <p className="text-ink-muted text-xs mt-0.5 leading-relaxed">
                    Identifies productive ocean fronts and thermal divergence lines using machine learning, excluding Marine Protected Areas.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-surface border border-border flex items-start gap-4">
                <div className="p-2.5 rounded bg-surface-raised text-primary shrink-0">
                  <Radio className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="text-sm">
                  <h3 className="font-semibold text-ink">5. Official Advisories Agent</h3>
                  <p className="text-ink-muted text-xs mt-0.5 leading-relaxed">
                    Ingests statutory bulletins from INCOIS, IMD, and GDACS, triggering override status on active cyclone and high-wave watches.
                  </p>
                </div>
              </div>
            </div>

            {/* Who Decides Safety Callout Box */}
            <div className="lg:col-span-5 bg-surface-raised border-2 border-primary/30 rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary shrink-0" aria-hidden="true" />
                <h3 className="text-lg font-bold">Who decides safety?</h3>
              </div>
              <p className="text-sm font-semibold text-ink">
                The rules engine, not the AI.
              </p>
              <p className="text-xs text-ink-muted leading-relaxed">
                Large language models are inherently probabilistic and can hallucinate numerical thresholds. In ORCA, the LLM is strictly confined to generating plain-text explanations from structured JSON.
              </p>
              <div className="p-3 rounded bg-surface border border-border text-xs text-ink space-y-1.5 font-mono">
                <p className="text-risk-safe font-semibold">✓ Wave &lt; 1.5 m & Wind &lt; 30 km/h &rarr; SAFE</p>
                <p className="text-risk-caution font-semibold">⚠ Wave 1.5–2.5 m or Wind 30–45 km/h &rarr; CAUTION</p>
                <p className="text-risk-unsafe font-semibold">✕ Wave &gt; 2.5 m or Wind &gt; 45 km/h &rarr; UNSAFE</p>
                <p className="text-ink-muted font-semibold">? Missing or stale data &rarr; UNKNOWN</p>
              </div>
              <p className="text-[11px] text-ink-muted italic">
                * Thresholds are configured for Small Craft (FRP / Canoe) seaworthiness baselines.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: THE FOUR LEVELS */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 text-left flex flex-col gap-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-primary font-medium">Ratings</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
              Four deterministic safety levels
            </h2>
            <p className="text-sm text-ink-muted mt-2 max-w-2xl leading-relaxed">
              Every port or coordinate is assigned exactly one level based on current observations and forecast models:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-lg bg-surface border border-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-ink">Safe</span>
                <RiskBadge level="safe" size="sm" />
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Conditions are well within standard seaworthiness limits. Wind speed &lt; 30 km/h, wave height &lt; 1.5 m, and no active gale alerts.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-surface border border-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-base">Caution</span>
                <RiskBadge level="caution" size="sm" />
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Elevated chop, gusty winds, or long-period swell. Small canoes and artisanal craft should exercise extreme care or stay inshore.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-surface border border-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-base">Unsafe</span>
                <RiskBadge level="unsafe" size="sm" />
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Dangerous sea state, high waves (&gt; 2.5 m), squalls (&gt; 45 km/h), or active statutory storm warnings. Operations not advised.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-surface border-2 border-primary/40 bg-surface-raised flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-base">Unknown</span>
                <RiskBadge level="unknown" size="sm" />
              </div>
              <p className="text-xs text-ink font-medium leading-relaxed">
                ORCA says unknown when data is missing or old. It never guesses safe.
              </p>
              <p className="text-[11px] text-ink-muted">
                If marine telemetry fails or is older than freshness thresholds, ORCA flags unknown rather than making assumptions.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: COVERAGE & INDIA STATES */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 text-left flex flex-col gap-8">
          <div className="bg-surface border border-border rounded-xl p-6 sm:p-10 shadow-sm flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-primary font-medium">Coverage</span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                  Comprehensive coastal station directory
                </h2>
                <p className="text-sm text-ink-muted mt-2 max-w-xl leading-relaxed">
                  Active monitoring across commercial ports, minor fishing harbours, and coastal fish landing centres.
                </p>
              </div>

              {/* Count Up Metrics */}
              <div className="flex items-center gap-6 bg-surface-raised p-4 rounded-lg border border-border">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-mono text-primary">
                    {coverage?.total_ports || 3875}
                  </p>
                  <p className="text-[11px] text-ink-muted uppercase font-medium">Total Stations</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-mono text-ink">
                    {coverage?.total_coastal_ports || 3874}
                  </p>
                  <p className="text-[11px] text-ink-muted uppercase font-medium">Coastal Harbours</p>
                </div>
              </div>
            </div>

            {/* State Filter Pills */}
            <div>
              <p className="text-xs font-semibold text-ink mb-3">Browse Indian Coastal States:</p>
              <div className="flex flex-wrap gap-2">
                {coverage?.india_by_state && coverage.india_by_state.length > 0 ? (
                  coverage.india_by_state.map((st) => (
                    <Link
                      key={st.admin1_name}
                      to={`/ports?state=${encodeURIComponent(st.admin1_name)}`}
                      className="px-3 py-1.5 rounded bg-surface-raised border border-border hover:border-primary text-xs font-medium text-ink flex items-center gap-1.5 transition-colors"
                    >
                      <span>{st.admin1_name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-water text-primary rounded-full">
                        {st.port_count}
                      </span>
                    </Link>
                  ))
                ) : (
                  [
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
                      className="px-3 py-1.5 rounded bg-surface-raised border border-border hover:border-primary text-xs font-medium text-ink flex items-center gap-1.5 transition-colors"
                    >
                      <span>{st.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-water text-primary rounded-full">
                        {st.count}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2">
              <Link to="/ports">
                <Button variant="secondary" className="gap-2">
                  Explore complete port directory &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 6: WORKS WITH POOR SIGNAL & GAME */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 text-left">
          <div className="bg-surface border border-border rounded-xl p-6 sm:p-10 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-primary bg-water px-2.5 py-1 rounded w-fit">
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" /> Low Connectivity Maritime Mode
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Works when mobile reception drops at sea.
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                ORCA functions as an installable Progressive Web App (PWA). When heading beyond cell tower range (5–12 nautical miles), recent port forecasts and safety advisories remain accessible locally in offline cache.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link to="/game">
                  <Button variant="primary" className="gap-2">
                    <Fish className="h-4 w-4" aria-hidden="true" />
                    Play Marine Fish Game
                  </Button>
                </Link>
                <Link to="/offline-preview">
                  <Button variant="secondary">Preview Offline Mode</Button>
                </Link>
              </div>
            </div>

            <div className="bg-surface-raised border border-border rounded-lg p-5 flex flex-col gap-3 text-xs">
              <h3 className="font-semibold text-sm text-ink">Built for coastal realities:</h3>
              <ul className="space-y-2 text-ink-muted">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span><strong>Cached Forecasts:</strong> The last evaluated 48h outlook remains interactive even with 0 bars.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span><strong>Compact Payload:</strong> Strict bundle optimization and compressed JSON payloads ensure quick loads on 2G/3G connections.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span><strong>Zero Bloat:</strong> No heavy external analytics or video assets consuming scarce bandwidth.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 7: DATA AND HONESTY */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 text-left flex flex-col gap-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-primary font-medium">Transparency</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
              Data sources and operational boundaries
            </h2>
            <p className="text-sm text-ink-muted mt-2 max-w-2xl leading-relaxed">
              ORCA relies on public scientific telemetry and adheres to strict operational boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Live Data Sources Table */}
            <div className="lg:col-span-7 bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-surface-raised flex items-center justify-between">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-ink flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" aria-hidden="true" />
                  Live Feed Status & Freshness
                </h3>
                <Link to="/status" className="text-xs text-primary hover:underline">
                  Full status dashboard &rarr;
                </Link>
              </div>
              <div className="divide-y divide-border text-xs">
                {dataStatus?.sources ? (
                  dataStatus.sources.slice(0, 5).map((src) => (
                    <div key={src.slug} className="p-3.5 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink">{src.name}</p>
                        <p className="text-ink-muted text-[11px] truncate max-w-sm">{src.attribution}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            src.status === "ok"
                              ? "bg-risk-safe-bg text-risk-safe"
                              : "bg-surface-raised text-ink-muted"
                          }`}
                        >
                          {src.status}
                        </span>
                        <p className="text-[10px] text-ink-muted font-mono mt-0.5">
                          {formatDataAge(src.age_minutes)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-xs text-ink-muted">Loading live telemetry status...</div>
                )}
              </div>
            </div>

            {/* What ORCA Does NOT Do & IMD Override */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-risk-unsafe-bg/40 border border-risk-unsafe/30 text-ink space-y-2">
                <div className="flex items-center gap-2 text-risk-unsafe font-bold text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Statutory Warning Precedence
                </div>
                <p className="text-xs font-semibold text-ink leading-relaxed">
                  Official IMD and INCOIS warnings override ORCA.
                </p>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Statutory maritime broadcasts, gale alerts, and swell surge warnings issued by statutory authorities strictly supersede any output or safety rating produced by ORCA.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-surface border border-border space-y-2 text-xs">
                <h4 className="font-semibold text-sm text-ink">What ORCA does not do:</h4>
                <ul className="space-y-1.5 text-ink-muted list-disc list-inside">
                  <li>Does not replace certified ECDIS navigation charts or radar.</li>
                  <li>Does not steer or connect to vessel autopilot mechanisms.</li>
                  <li>Does not guess or invent safety values when sensor telemetry is down.</li>
                  <li>Does not replace captain/skipper responsibility under SOLAS regulations.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: SDG 14 LIFE BELOW WATER */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 text-left">
          <div className="bg-surface border border-border rounded-xl p-6 sm:p-10 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded bg-water text-primary font-bold font-mono text-sm">
                SDG 14
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Supporting UN Sustainable Development Goal 14</h2>
                <p className="text-xs text-ink-muted mt-0.5">Conserve and sustainably use the oceans, seas and marine resources.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-xs">
              <div className="p-4 rounded-lg bg-surface-raised border border-border space-y-2">
                <span className="font-mono text-primary font-bold">Target 14.b</span>
                <h3 className="font-semibold text-sm text-ink">Support Artisanal Fisheries</h3>
                <p className="text-ink-muted leading-relaxed">
                  Provide access for small-scale artisanal fishers to marine resources and markets by offering free, accurate coastal safety and sea state intelligence.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-surface-raised border border-border space-y-2">
                <span className="font-mono text-primary font-bold">Target 14.1</span>
                <h3 className="font-semibold text-sm text-ink">Prevent Marine Hazards</h3>
                <p className="text-ink-muted leading-relaxed">
                  Reduce accidental vessel wreckage and coastal environmental damage by preventing small-craft operations in hazardous swell surge conditions.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-surface-raised border border-border space-y-2">
                <span className="font-mono text-primary font-bold">Target 14.2</span>
                <h3 className="font-semibold text-sm text-ink">Sustainable Ecosystem Management</h3>
                <p className="text-ink-muted leading-relaxed">
                  Protect vulnerable marine ecosystems by enforcing exclusion zones across Marine Protected Areas (MPAs) in all fishing zone recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9: ACCESSIBLE FAQ */}
        <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 text-left flex flex-col gap-6">
          <div className="text-center sm:text-left">
            <span className="text-xs font-mono uppercase tracking-widest text-primary font-medium">Clarifications</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">Frequently Answered Questions</h2>
          </div>

          <div className="space-y-3">
            <details className="group border border-border bg-surface rounded-lg p-4 cursor-pointer">
              <summary className="font-semibold text-sm text-ink flex items-center justify-between list-none">
                <span>How is the seaworthiness rating computed?</span>
                <ChevronDown className="h-4 w-4 text-ink-muted group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-xs text-ink-muted mt-3 leading-relaxed">
                ORCA evaluates forecast significant wave height, primary swell period, sustained wind speed, wind gusts, and active weather advisories against calibrated marine thresholds. If any single parameter exceeds caution or unsafe boundaries for the selected vessel class (Small Craft or Mechanised), the overall rating escalates.
              </p>
            </details>

            <details className="group border border-border bg-surface rounded-lg p-4 cursor-pointer">
              <summary className="font-semibold text-sm text-ink flex items-center justify-between list-none">
                <span>What happens when mobile signal drops offshore?</span>
                <ChevronDown className="h-4 w-4 text-ink-muted group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-xs text-ink-muted mt-3 leading-relaxed">
                ORCA operates as an installable Progressive Web App (PWA). All forecast snapshots, sea state parameters, and active advisories fetched while in harbour are saved in persistent offline storage. You can also play the built-in marine fish game without internet connectivity.
              </p>
            </details>

            <details className="group border border-border bg-surface rounded-lg p-4 cursor-pointer">
              <summary className="font-semibold text-sm text-ink flex items-center justify-between list-none">
                <span>Why does ORCA show &quot;Unknown&quot; instead of guessing?</span>
                <ChevronDown className="h-4 w-4 text-ink-muted group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-xs text-ink-muted mt-3 leading-relaxed">
                In safety-critical maritime operations, false confidence can be fatal. If live satellite telemetry, atmospheric forecast feeds, or oceanographic observation stations are delayed or unavailable, ORCA marks conditions as Unknown rather than assuming calm seas.
              </p>
            </details>

            <details className="group border border-border bg-surface rounded-lg p-4 cursor-pointer">
              <summary className="font-semibold text-sm text-ink flex items-center justify-between list-none">
                <span>How are productive fishing zones identified?</span>
                <ChevronDown className="h-4 w-4 text-ink-muted group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-xs text-ink-muted mt-3 leading-relaxed">
                Machine learning models analyze Sea Surface Temperature (SST) gradients from NOAA CoastWatch and chlorophyll concentration fronts from satellite radiometry. Areas with thermal divergence lines indicate nutrient-rich upwelling. All suggestions exclude Marine Protected Areas (MPAs).
              </p>
            </details>

            <details className="group border border-border bg-surface rounded-lg p-4 cursor-pointer">
              <summary className="font-semibold text-sm text-ink flex items-center justify-between list-none">
                <span>Can I rely on ORCA instead of official IMD or INCOIS bulletins?</span>
                <ChevronDown className="h-4 w-4 text-ink-muted group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-xs text-ink-muted mt-3 leading-relaxed">
                No. Official statutory warnings from the India Meteorological Department (IMD) and the Indian National Centre for Ocean Information Services (INCOIS) always take precedence over ORCA. ORCA is an advisory decision-support tool.
              </p>
            </details>
          </div>
        </section>
      </main>

      {/* SECTION 10: FOOTER */}
      <footer className="border-t border-border bg-surface px-4 sm:px-6 py-12 text-xs text-ink-muted">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="flex flex-col gap-3 max-w-sm">
              <div className="flex items-center gap-2">
                <Anchor className="h-5 w-5 text-primary" aria-hidden="true" />
                <span className="font-bold text-base text-ink tracking-tight">Project ORCA</span>
              </div>
              <p className="text-xs leading-relaxed">
                Marine Ecosystem Reasoning with Collaborative AI Agents. Developed for United Nations SDG 14: Life Below Water.
              </p>
              <p className="text-[11px] font-mono text-ink-muted">
                Open sustainability research baseline • Bennett University
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-ink uppercase tracking-wider text-[11px] font-mono">Platform</span>
                <Link to="/explore" className="hover:text-primary transition-colors">Explore Map</Link>
                <Link to="/ports" className="hover:text-primary transition-colors">Port Directory</Link>
                <Link to="/how-it-works" className="hover:text-primary transition-colors">How it works</Link>
                <Link to="/methodology" className="hover:text-primary transition-colors">Methodology</Link>
                <Link to="/status" className="hover:text-primary transition-colors">Data Status</Link>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-ink uppercase tracking-wider text-[11px] font-mono">Information</span>
                <Link to="/about" className="hover:text-primary transition-colors">About Project</Link>
                <Link to="/game" className="hover:text-primary transition-colors">Marine Fish Game</Link>
                <Link to="/offline-preview" className="hover:text-primary transition-colors">Offline Preview</Link>
                <a
                  href="https://github.com/Abhilakkkkshya505/orca_project"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary inline-flex items-center gap-1 transition-colors"
                >
                  GitHub <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-ink uppercase tracking-wider text-[11px] font-mono">Legal & Trust</span>
                <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                <Link to="/accessibility" className="hover:text-primary transition-colors">Accessibility</Link>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>© 2026 Project ORCA. All rights reserved.</p>
            <p className="font-mono text-ink-muted">
              DEMO NOTICE: Thresholds and values are configured for development and demonstration purposes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
