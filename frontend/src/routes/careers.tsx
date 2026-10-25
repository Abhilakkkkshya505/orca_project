import React from "react";
import {
  Briefcase,
  Globe2,
  Compass,
  Cpu,
  MapPin,
  ArrowRight,
} from "lucide-react";

interface JobRole {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  tags: string[];
}

const OPEN_ROLES: JobRole[] = [
  {
    id: "ocean-data-scientist",
    title: "Senior Oceanographic Data Scientist",
    department: "Marine AI & Modeling",
    location: "Kochi, Kerala / Remote",
    type: "Full-Time",
    description:
      "Design and validate physical wave steepness, Kallakkadal surge prediction algorithms, and satellite chlorophyll thermal front detectors using Open-Meteo CMEMS and Indian Ocean buoy feeds.",
    tags: ["Python", "Ocean Physics", "CMEMS", "Statistical Modeling"],
  },
  {
    id: "lead-frontend-engineer",
    title: "Staff Frontend Engineer (WebGL & MapLibre)",
    department: "Product Engineering",
    location: "Remote (India)",
    type: "Full-Time",
    description:
      "Architect ultra-responsive MapLibre GL visualization layers, offline PWAs, and real-time SSE streaming chat interfaces for maritime vessels operating in 2G edge conditions.",
    tags: ["TypeScript", "React", "MapLibre GL", "TailwindCSS", "PWA"],
  },
  {
    id: "marine-systems-architect",
    title: "Distributed Systems & Telemetry Architect",
    department: "Core Infrastructure",
    location: "Greater Noida / Hybrid",
    type: "Full-Time",
    description:
      "Scale our high-throughput sensor ingestion pipeline, low-latency Groq AI orchestrator, and Redis caching grid ensuring sub-second response times across 7,500km of coastline.",
    tags: ["Python", "Django", "Groq AI", "PostgreSQL/GIS", "Redis"],
  },
  {
    id: "coastal-safety-evangelist",
    title: "Artisanal Fisheries Community Lead",
    department: "Field Operations",
    location: "Kozhikode & Mangaluru Field Stations",
    type: "Field Operations",
    description:
      "Work directly on fishing jetties with artisanal cooperatives, catamaran associations, and harbour masters to conduct usability testing and safety advisory drills.",
    tags: ["Field Testing", "Maritime Safety", "Malayalam/Tamil", "SDG 14"],
  },
];

export const CareersPage: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 text-left space-y-16">
      {/* Hero Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono uppercase tracking-wider">
          <Briefcase className="h-4 w-4" />
          <span>Careers at ORCA • We&apos;re Hiring</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-ink leading-tight">
          Build Technology That Protects Lives at Sea
        </h1>
        <p className="text-sm sm:text-base text-ink-muted leading-relaxed font-sans">
          Join an interdisciplinary team of oceanographers, software engineers, and sustainability researchers engineering mission-critical AI systems for coastal maritime safety (SDG 14).
        </p>
      </div>

      {/* Perks & Values Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Globe2 className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-sm text-ink">Mission-Driven (SDG 14)</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Your code directly safeguards 4 million small-craft fishers from capsize hazards and extreme swell surges every morning.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Compass className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-sm text-ink">Field Testing on Coastal Cutters</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Validate technology in the real world on coastal research vessels, fishing jetties, and marine telemetry buoys across India.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-2.5">
          <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 flex items-center justify-center">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-sm text-ink">Cutting-Edge Edge AI & WebGL</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Work with ultra-fast Groq LPU inference, MapLibre GL 3D bathymetry shaders, and real-time Copernicus satellite feeds.
          </p>
        </div>
      </div>

      {/* Open Positions */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink">Open Engineering & Research Positions</h2>
            <p className="text-xs text-ink-muted mt-0.5">Explore full-time and research fellowship roles.</p>
          </div>
          <span className="text-xs font-mono font-bold text-primary px-3 py-1 rounded-full bg-primary/10 self-start">
            {OPEN_ROLES.length} Roles Active
          </span>
        </div>

        <div className="space-y-4">
          {OPEN_ROLES.map((role) => (
            <div
              key={role.id}
              className="p-6 rounded-2xl bg-surface border border-border shadow-card card-hover space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
                    {role.department}
                  </span>
                  <h3 className="text-lg font-heading font-bold text-ink">{role.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted font-medium pt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {role.location}
                    </span>
                    <span>•</span>
                    <span>{role.type}</span>
                  </div>
                </div>

                <a
                  href={`mailto:orca.marine.sdg14@gmail.com?subject=Application: ${encodeURIComponent(role.title)}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover self-start transition-all"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <p className="text-xs text-ink-muted leading-relaxed">
                {role.description}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {role.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-surface-raised border border-border text-[10px] font-mono text-ink-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* General Application Callout */}
      <div className="p-8 rounded-2xl bg-surface border border-border shadow-card text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-base font-heading font-bold text-ink">Don&apos;t see your specific specialty?</h3>
          <p className="text-xs text-ink-muted max-w-md">
            We are always eager to meet oceanographers, satellite imagery specialists, and marine safety researchers passionate about SDG 14.
          </p>
        </div>
        <a
          href="mailto:orca.marine.sdg14@gmail.com?subject=General Application / Ocean Research"
          className="px-5 py-2.5 rounded-xl border border-border bg-surface-raised hover:bg-surface text-xs font-bold text-ink shadow-xs transition-colors shrink-0"
        >
          Send General Application &rarr;
        </a>
      </div>
    </div>
  );
};
