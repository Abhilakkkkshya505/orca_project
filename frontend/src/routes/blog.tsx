import React, { useState } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  category: "research" | "engineering" | "sdg14" | "oceanography";
  categoryLabel: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: {
    name: string;
    role: string;
  };
  featured?: boolean;
}

const POSTS: BlogPost[] = [
  {
    id: "groq-ocean-inference",
    title: "Sub-Second Multi-Agent Reasoning at Sea: How We Integrated Groq LPUs into Marine Safety",
    category: "engineering",
    categoryLabel: "Engineering & AI",
    excerpt:
      "When navigating narrow bar entrances or sudden monsoon squalls, mariners cannot wait 15 seconds for cloud LLMs. Here is how we achieved 850ms end-to-end multi-agent orchestration with zero numerical hallucination.",
    date: "October 24, 2026",
    readTime: "6 min read",
    author: {
      name: "ORCA Engineering Team",
      role: "Distributed AI Architecture",
    },
    featured: true,
  },
  {
    id: "kallakkadal-swell-physics",
    title: "Deconstructing Kallakkadal: Predicting Swell Surges off the Kerala and Tamil Nadu Coasts",
    category: "oceanography",
    categoryLabel: "Physical Oceanography",
    excerpt:
      "Kallakkadal swells originate thousands of kilometers away in the Southern Ocean storms before silently devastating Indian coastal fishing villages. We break down the swell-to-wind-wave ratio models used in ORCA.",
    date: "October 19, 2026",
    readTime: "8 min read",
    author: {
      name: "Dr. K. Narayanan",
      role: "Physical Oceanographer",
    },
  },
  {
    id: "sdg-14-artisanal-fisheries",
    title: "Empowering 4 Million Coastal Fishers: The Technological Path to UN SDG Target 14.b",
    category: "sdg14",
    categoryLabel: "UN SDG 14",
    excerpt:
      "Artisanal marine operators generate over 60% of India's coastal fish landing yet have been historically excluded from commercial ECDIS navigation suites. How open satellite telemetry restores safety parity.",
    date: "October 12, 2026",
    readTime: "5 min read",
    author: {
      name: "S. Roy",
      role: "Sustainability Engineering Lead",
    },
  },
  {
    id: "copernicus-open-meteo-integration",
    title: "Fusing Open-Meteo CMEMS Waves with Localized Atmospheric Forecasts for Real-Time Telemetry",
    category: "research",
    categoryLabel: "Sensor Fusion",
    excerpt:
      "Combining 7-day hourly Significant Wave Height (Hs), secondary swell vectors, MSL tidal surge, and atmospheric pressure into unified offline-ready timeseries arrays.",
    date: "October 05, 2026",
    readTime: "7 min read",
    author: {
      name: "ORCA Geodata Lab",
      role: "Marine Telemetry Pipeline",
    },
  },
];

export const BlogPage: React.FC = () => {
  const [selectedTag, setSelectedTag] = useState<string>("all");

  const filteredPosts =
    selectedTag === "all" ? POSTS : POSTS.filter((p) => p.category === selectedTag);

  const featured = POSTS.find((p) => p.featured) || POSTS[0];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 text-left space-y-12">
      {/* Title Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono uppercase tracking-wider">
          <BookOpen className="h-4 w-4" />
          <span>Research Publications & Engineering Dispatch</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-ink leading-tight">
          Ocean Intelligence Research Log
        </h1>
        <p className="text-sm sm:text-base text-ink-muted leading-relaxed font-sans">
          Insights on computational oceanography, edge AI in extreme environments, marine safety physics, and United Nations SDG 14 milestones.
        </p>
      </div>

      {/* Featured Lead Story */}
      {featured && (
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-card card-hover space-y-4 relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary font-bold font-mono uppercase tracking-wider text-[10px]">
              Featured Publication
            </span>
            <span className="text-ink-muted flex items-center gap-1 font-mono text-[11px]">
              <Calendar className="h-3.5 w-3.5" /> {featured.date}
            </span>
            <span className="text-ink-muted font-mono text-[11px]">•</span>
            <span className="text-ink-muted flex items-center gap-1 font-mono text-[11px]">
              <Clock className="h-3.5 w-3.5" /> {featured.readTime}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-ink leading-tight">
            {featured.title}
          </h2>

          <p className="text-sm text-ink-muted leading-relaxed max-w-3xl">
            {featured.excerpt}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-ink block">{featured.author.name}</span>
              <span className="text-[11px] font-mono text-ink-muted">{featured.author.role}</span>
            </div>
            <button
              onClick={() => alert("Full research paper PDF will be released with the Bennett University Sustainability Symposium proceedings.")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover transition-all"
            >
              <span>Read Full Article</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {[
          { id: "all", label: "All Dispatches" },
          { id: "engineering", label: "Engineering & AI" },
          { id: "oceanography", label: "Physical Oceanography" },
          { id: "sdg14", label: "UN SDG 14 Impact" },
          { id: "research", label: "Sensor Fusion" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTag(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedTag === tab.id
                ? "bg-primary text-white font-bold shadow-xs"
                : "bg-surface border border-border text-ink-muted hover:text-ink hover:bg-surface-raised"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="p-6 rounded-2xl bg-surface border border-border shadow-card card-hover flex flex-col justify-between gap-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
                <span className="text-primary font-bold uppercase tracking-wider">{post.categoryLabel}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {post.readTime}
                </span>
              </div>
              <h3 className="font-heading font-bold text-lg text-ink leading-snug">
                {post.title}
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-ink text-xs block">{post.author.name}</span>
                <span className="text-[10px] font-mono text-ink-muted">{post.date}</span>
              </div>
              <button
                onClick={() => alert("Full article text will be accessible in the upcoming ORCA Technical Report (Q4 2026).")}
                className="text-primary font-bold text-xs hover:underline inline-flex items-center gap-1"
              >
                <span>Read</span> &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Newsletter Signup Banner */}
      <div className="p-8 rounded-2xl bg-surface border border-border shadow-card text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-lg font-heading font-bold text-ink">Subscribe to Marine Research Bulletins</h3>
          <p className="text-xs text-ink-muted max-w-md">
            Receive monthly updates on coastal safety algorithms, INCOIS integration milestones, and ocean AI releases.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="email"
            placeholder="captain@maritime.org"
            className="px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-60"
          />
          <button
            onClick={() => alert("Thank you! You have been subscribed to ORCA Research Dispatches.")}
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover shrink-0 transition-colors"
          >
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
};
