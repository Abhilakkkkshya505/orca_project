import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  Anchor,
  ShieldCheck,
  Cpu,
  BookOpen,
  Layers,
} from "lucide-react";

interface ModelItem {
  id: string;
  name: string;
  version: string;
  framework: string;
  task: string;
  metrics: Record<string, number | string>;
  limits: string[];
}

export const HowItWorksPage: React.FC = () => {
  const { data: modelsData } = useQuery<{ models: ModelItem[] }>({
    queryKey: ["models", "list"],
    queryFn: () => api.get<{ models: ModelItem[] }>("/models/"),
  });

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-base hover:opacity-90">
            <Anchor className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>ORCA</span>
          </Link>
          <span className="text-xs text-ink-muted">/ System Methodology</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <Link to="/ports" className="hover:text-primary">Port Directory</Link>
          <Link to="/status" className="hover:text-primary">Data Status</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 flex flex-col gap-12 text-left">
        {/* Title & Philosophy */}
        <div className="space-y-3 pb-6 border-b border-border">
          <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
            Scientific & Regulatory Architecture
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            How ORCA Computes Marine Safety
          </h1>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-3xl">
            In maritime operations, lives depend on predictable boundaries. ORCA separates automated data gathering and plain-language explanation from safety validation. Machine learning detects productive fishing zones; pure deterministic rules decide safety.
          </p>
        </div>

        {/* SECTION 1: DETERMINISTIC RULES ENGINE */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">1. Pure Deterministic Rules Engine</h2>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Safety classifications (<span className="text-risk-safe font-semibold">Safe</span>,{" "}
            <span className="text-risk-caution font-semibold">Caution</span>,{" "}
            <span className="text-risk-unsafe font-semibold">Unsafe</span>,{" "}
            <span className="text-ink font-semibold">Unknown</span>) are derived strictly through hard mathematical comparisons. No neural network or LLM has the authority to alter a threshold or downgrade a hazard.
          </p>

          <div className="bg-surface-raised border border-border rounded-lg p-5 space-y-3 text-xs font-mono">
            <p className="font-semibold text-ink uppercase tracking-wider text-[11px]">
              Rule Priority Order (Strict Precedence):
            </p>
            <ol className="list-decimal list-inside space-y-2 text-ink-muted leading-relaxed">
              <li>
                <strong className="text-risk-unsafe">Statutory Override:</strong> If IMD, INCOIS, or Coast Guard has an active cyclone, gale, or high-wave surge alert &rarr; <span className="text-risk-unsafe font-bold">UNSAFE</span> (Always overrides models).
              </li>
              <li>
                <strong className="text-ink">Missing Data Trap:</strong> If mandatory ocean wave or atmospheric wind telemetry is absent or older than freshness limits &rarr; <span className="font-bold text-ink">UNKNOWN</span> (Never guesses safe).
              </li>
              <li>
                <strong className="text-risk-unsafe">Physical Threshold Breach:</strong> If any single physical metric (wave height, wave steepness, sustained wind, gust) exceeds unsafe bounds &rarr; <span className="text-risk-unsafe font-bold">UNSAFE</span>.
              </li>
              <li>
                <strong className="text-risk-caution">Caution Threshold Breach:</strong> If any metric exceeds caution limits &rarr; <span className="text-risk-caution font-bold">CAUTION</span>.
              </li>
              <li>
                <strong className="text-risk-safe">Default Baseline:</strong> If all evaluated parameters remain strictly beneath caution limits &rarr; <span className="text-risk-safe font-bold">SAFE</span>.
              </li>
            </ol>
          </div>
        </section>

        {/* SECTION 2: CITED THRESHOLD MATRIX (DEVELOPMENT VALUES) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">2. Safety Thresholds & Official Citations</h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-risk-caution-bg text-risk-caution font-semibold">
              DEVELOPMENT VALUES
            </span>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed">
            The thresholds below are calibrated for coastal India based on published guidance from INCOIS, IMD, US Coast Guard, and WMO. They are development baselines and must not be used as the sole basis for seaworthiness decisions.
          </p>

          <div className="border border-border rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left divide-y divide-border">
              <thead className="bg-surface-raised font-mono font-semibold uppercase tracking-wider text-ink">
                <tr>
                  <th className="p-3">Physical Factor</th>
                  <th className="p-3">Small Craft (&lt;12m FRP)</th>
                  <th className="p-3">Mechanised (&gt;15m)</th>
                  <th className="p-3">Regulatory & Scientific Citation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-ink-muted">
                <tr>
                  <td className="p-3 font-semibold text-ink">Significant Wave (Hm0)</td>
                  <td className="p-3 font-mono">
                    <span className="text-risk-caution font-bold">&gt;1.5 m</span> /{" "}
                    <span className="text-risk-unsafe font-bold">&gt;2.2 m</span>
                  </td>
                  <td className="p-3 font-mono">
                    <span className="text-risk-caution font-bold">&gt;2.5 m</span> /{" "}
                    <span className="text-risk-unsafe font-bold">&gt;3.8 m</span>
                  </td>
                  <td className="p-3">
                    INCOIS Small Vessel Advisory and Warning Services (SVAS) operational criteria.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-ink">Wave Steepness (H / T²)</td>
                  <td className="p-3 font-mono">
                    <span className="text-risk-caution font-bold">&gt;0.040</span> /{" "}
                    <span className="text-risk-unsafe font-bold">&gt;0.060</span>
                  </td>
                  <td className="p-3 font-mono">
                    <span className="text-risk-caution font-bold">&gt;0.050</span> /{" "}
                    <span className="text-risk-unsafe font-bold">&gt;0.075</span>
                  </td>
                  <td className="p-3">
                    US Coast Guard Boat Crew Seamanship Manual (COMDTINST M16114.5C), Ch. 9.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-ink">Swell Surge Height (H_swell)</td>
                  <td className="p-3 font-mono">
                    <span className="text-risk-caution font-bold">&gt;1.2 m</span> /{" "}
                    <span className="text-risk-unsafe font-bold">&gt;2.0 m</span>
                  </td>
                  <td className="p-3 font-mono">
                    <span className="text-risk-caution font-bold">&gt;2.0 m</span> /{" "}
                    <span className="text-risk-unsafe font-bold">&gt;3.2 m</span>
                  </td>
                  <td className="p-3">
                    INCOIS Kallakkadal / Swell Surge Early Warning System guidelines.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-ink">Sustained Wind ($U_{10}$)</td>
                  <td className="p-3 font-mono">
                    <span className="text-risk-caution font-bold">&gt;30 km/h</span> /{" "}
                    <span className="text-risk-unsafe font-bold">&gt;45 km/h</span>
                  </td>
                  <td className="p-3 font-mono">
                    <span className="text-risk-caution font-bold">&gt;45 km/h</span> /{" "}
                    <span className="text-risk-unsafe font-bold">&gt;65 km/h</span>
                  </td>
                  <td className="p-3">
                    IMD Marine Weather Bulletins: Fishermen Warning Thresholds.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-ink">Peak Wind Gusts</td>
                  <td className="p-3 font-mono">
                    <span className="text-risk-caution font-bold">&gt;40 km/h</span> /{" "}
                    <span className="text-risk-unsafe font-bold">&gt;55 km/h</span>
                  </td>
                  <td className="p-3 font-mono">
                    <span className="text-risk-caution font-bold">&gt;60 km/h</span> /{" "}
                    <span className="text-risk-unsafe font-bold">&gt;80 km/h</span>
                  </td>
                  <td className="p-3">
                    IMD Squally Weather Warning Standards & Beaufort Scale 7–8 limits.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-ink">Precipitation Rate</td>
                  <td className="p-3 font-mono">
                    <span className="text-risk-caution font-bold">&gt;10 mm/h</span> /{" "}
                    <span className="text-risk-unsafe font-bold">&gt;30 mm/h</span>
                  </td>
                  <td className="p-3 font-mono">
                    <span className="text-risk-caution font-bold">&gt;20 mm/h</span> /{" "}
                    <span className="text-risk-unsafe font-bold">&gt;50 mm/h</span>
                  </td>
                  <td className="p-3">
                    IMD Heavy Rainfall Classification (risk of cockpit swamping).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 3: ML MODELS & LIMITS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">3. Machine Learning Models & Model Cards</h2>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Machine learning models in ORCA are evaluated for specific tasks like thermal front detection and bathymetric anomaly recognition. Each registered model has documented limits and metrics:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelsData?.models ? (
              modelsData.models.map((mod) => (
                <div key={mod.id} className="p-4 rounded-lg bg-surface border border-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-ink">{mod.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-raised">
                      v{mod.version}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    <strong>Task:</strong> {mod.task} ({mod.framework})
                  </p>
                  <div className="p-2.5 rounded bg-surface-raised text-[11px] font-mono space-y-1">
                    <p className="text-primary font-semibold">Validation Metrics:</p>
                    {Object.entries(mod.metrics || {}).map(([k, v]) => (
                      <p key={k} className="text-ink-muted">
                        • {k.replace(/_/g, " ")}: <strong>{String(v)}</strong>
                      </p>
                    ))}
                  </div>
                  <div className="text-[11px] text-ink-muted space-y-1">
                    <p className="font-semibold text-ink">Known Operational Limits:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {(mod.limits || []).map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded bg-surface border border-border text-xs text-ink-muted">
                Connecting to model registry...
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: MARITIME GLOSSARY */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">4. Oceanographic Glossary</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-surface border border-border space-y-1">
              <h4 className="font-semibold text-ink">Significant Wave Height (Hm0)</h4>
              <p className="text-ink-muted leading-relaxed">
                The mean wave height (trough to crest) of the highest one-third of waves in a measured record. Individual rogue waves can reach nearly twice this figure.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface border border-border space-y-1">
              <h4 className="font-semibold text-ink">Primary Swell Period (Tp)</h4>
              <p className="text-ink-muted leading-relaxed">
                The time in seconds between crests of long-period swells generated by distant storm systems. Long periods (&gt;10s) carry immense kinetic energy into shallow surf zones.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface border border-border space-y-1">
              <h4 className="font-semibold text-ink">Kallakkadal / Swell Surge</h4>
              <p className="text-ink-muted leading-relaxed">
                Sudden coastal flooding caused by swell waves generated in the Southern Ocean (40°–60°S) traveling thousands of miles without local wind signals, common along Kerala and Tamil Nadu.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface border border-border space-y-1">
              <h4 className="font-semibold text-ink">Douglas Sea State Scale (WMO Code 3700)</h4>
              <p className="text-ink-muted leading-relaxed">
                International 10-point scale (0=Glassy 0m, 1=Rippled 0-0.1m, 2=Smooth 0.1-0.5m, 3=Slight 0.5-1.25m, 4=Moderate 1.25-2.5m, 5=Rough 2.5-4m, 6=Very Rough 4-6m, 7=High 6-9m, 8=Very High 9-14m, 9=Phenomenal &gt;14m).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-6 text-xs text-ink-muted text-center">
        <p>© 2026 Project ORCA • Marine Ecosystem Reasoning for SDG 14</p>
      </footer>
    </div>
  );
};
