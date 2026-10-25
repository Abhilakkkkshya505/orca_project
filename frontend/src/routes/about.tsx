import React from "react";
import { Link } from "react-router-dom";
import {
  Anchor,
  ShieldCheck,
  Cpu,
  Globe2,
  Award,
  ArrowRight,
  Database,
  Radio,
} from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 text-left space-y-16">
      {/* Hero Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono uppercase tracking-wider">
          <Globe2 className="h-4 w-4" />
          <span>United Nations SDG 14: Life Below Water</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-ink leading-tight">
          Democratizing Ocean Intelligence & Coastal Safety
        </h1>
        <p className="text-base sm:text-lg text-ink-muted leading-relaxed font-sans">
          ORCA (Ocean Reasoning & Coastal Advisory) is an autonomous multi-agent maritime safety platform that synthesizes satellite earth observation, meteorological physics, and official weather warnings into verified safety ratings for coastal mariners.
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-surface border border-border shadow-card">
        <div className="space-y-1">
          <p className="font-heading font-bold text-3xl sm:text-4xl text-primary">7,516<span className="text-xl">km</span></p>
          <p className="text-xs text-ink-muted font-medium">Indian Coastal Perimeter</p>
        </div>
        <div className="space-y-1">
          <p className="font-heading font-bold text-3xl sm:text-4xl text-emerald-600">4.0M+</p>
          <p className="text-xs text-ink-muted font-medium">Artisanal Fishers Protected</p>
        </div>
        <div className="space-y-1">
          <p className="font-heading font-bold text-3xl sm:text-4xl text-cyan-600">100%</p>
          <p className="text-xs text-ink-muted font-medium">Deterministic Rule Gate</p>
        </div>
        <div className="space-y-1">
          <p className="font-heading font-bold text-3xl sm:text-4xl text-amber-600">&lt;1.0s</p>
          <p className="text-xs text-ink-muted font-medium">Groq Inference Latency</p>
        </div>
      </div>

      {/* The Problem & Our Mission */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Anchor className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-ink">The Maritime Safety Divide</h2>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Over 4 million traditional fishers in the Indian Ocean and Arabian Sea navigate in non-mechanized wooden canoes, FRP skiffs, and catamarans. Sudden Kallakkadal swell surges, cross-sea wave intersections, and monsoon squalls claim hundreds of lives annually.
          </p>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Existing commercial electronic chart display and information systems (ECDIS) cost tens of thousands of dollars and demand continuous high-bandwidth satellite uplinks. Small-craft operators are left with generic regional weather reports that fail to warn of hyper-local wave steepness hazards.
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 flex items-center justify-center">
            <Cpu className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-ink">Our Multi-Agent Solution</h2>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            ORCA bridges this divide by deploying specialized AI agents that ingest live Open-Meteo European CMEMS ocean wave datasets, atmospheric GFS/ECMWF forecasts, thermal satellite imagery, and official bulletins from the India Meteorological Department (IMD) and INCOIS.
          </p>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Rather than relying on raw probabilistic LLMs that hallucinate dangerous safety metrics, ORCA passes all inputs through a hardcoded deterministic safety gate. High-speed Groq AI (Qwen 3.8-27B) then synthesizes plain-language nautical explanations verified against numerical ground truth.
          </p>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="space-y-6">
        <h2 className="text-2xl font-heading font-bold text-ink">Core Design Principles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-card card-hover space-y-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-ink">Deterministic Fail-Safe</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Safety ratings (Safe, Caution, Unsafe) are evaluated by deterministic WMO algorithms based on vessel hull displacement and wave steepness. The LLM can never override safety rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border shadow-card card-hover space-y-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-ink">Zero Hallucination Numbers</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Every numerical figure produced by our natural language explainer is cross-referenced against official sensor data. If any figure deviates by more than 5%, the system fails closed to verified templates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border shadow-card card-hover space-y-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 flex items-center justify-center">
              <Radio className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-ink">Offline-First PWA</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Designed for coastal edge conditions. Cache marine telemetry before leaving harbor and view 7-day wave timeseries and offline navigational charts even when cellular uplink drops.
            </p>
          </div>
        </div>
      </section>

      {/* Academic Origin & SDG 14 */}
      <section className="p-8 rounded-2xl bg-surface border border-border shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
              Bennett University Engineering Initiative
            </span>
            <h3 className="text-xl font-heading font-bold text-ink mt-1">
              Sustainability Engineering Project • Semester 1
            </h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-raised border border-border text-xs font-semibold">
            <Award className="h-4 w-4 text-amber-500" />
            <span>UN SDG 14 Global Champion</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Developed as part of the core B.Tech sustainability engineering curriculum under the Times of India Group at Bennett University. The project addresses Target 14.b of the 2030 Agenda: <em>&quot;Provide access for small-scale artisanal fishers to marine resources and markets&quot;</em> through resilient safety technology.
        </p>
      </section>

      {/* Call to Action */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-surface to-cyan-500/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center sm:text-left">
          <h3 className="text-lg font-heading font-bold text-ink">Ready to explore coastal conditions?</h3>
          <p className="text-xs text-ink-muted">Access our interactive map explorer and live Open-Meteo telemetry.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/how-it-works"
            className="px-4 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-ink hover:bg-surface-raised transition-colors"
          >
            Read Methodology
          </Link>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-hover transition-all"
          >
            <span>Launch Live Map</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
