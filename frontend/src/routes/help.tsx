import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  Search,
  ChevronDown,
  ShieldCheck,
  Compass,
  Ship,
  WifiOff,
  Bell,
  ArrowRight,
} from "lucide-react";

interface FAQItem {
  id: string;
  category: "safety" | "vessels" | "telemetry" | "offline" | "account";
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "safety-1",
    category: "safety",
    question: "How are ORCA's safety ratings (Safe, Caution, Unsafe) computed?",
    answer:
      "Ratings are computed deterministically using World Meteorological Organization (WMO) standards, steepness indices (H/T²), and vessel hydrodynamic limits. If significant wave height, wind gusts, or swell periods exceed established safety thresholds for your registered hull type, the rating automatically elevates to Caution or Unsafe. Official warnings from IMD and INCOIS strictly override algorithm output to ensure fail-safe operation.",
  },
  {
    id: "safety-2",
    category: "safety",
    question: "Can the AI language model hallucinate numbers or override safety ratings?",
    answer:
      "No. ORCA enforces a strict non-hallucination verification gate (S1–S10). Before any natural language explanation is displayed to the mariner, a validator extracts every numerical token from the prose and cross-checks it against the underlying sensor telemetry. If unsupported numbers or contradictory safety conclusions are detected, the system fails closed to pre-verified deterministic templates.",
  },
  {
    id: "safety-3",
    category: "safety",
    question: "What is a 'Cross-Sea' and why is it dangerous?",
    answer:
      "A cross-sea occurs when two perpendicular wave systems (often a wind-driven sea and an opposing long-period swell) intersect. This creates steep, pyramid-shaped waves with sudden crest collapse, which presents severe capsize risk for small craft under 12 meters. ORCA automatically detects cross-seas when secondary swell and wind-wave heights both exceed 1.0 meter.",
  },
  {
    id: "vessels-1",
    category: "vessels",
    question: "What is the difference between Small Craft and Mechanised Vessel settings?",
    answer:
      "Small Craft refers to non-mechanized canoes, fiberglass-reinforced plastic (FRP) skiffs, and motorized open boats under 12m length with low freeboard. They have stricter wave thresholds (Hs caution at 1.5m, unsafe at 2.2m). Mechanised Vessels refer to deep-sea trawlers, purse-seiners, and commercial tugs (Hs caution at 2.5m, unsafe at 4.0m). You can toggle vessel class on the map or in Account Settings.",
  },
  {
    id: "telemetry-1",
    category: "telemetry",
    question: "Where does the live wave and atmospheric weather data come from?",
    answer:
      "ORCA ingests live telemetry from Open-Meteo European Copernicus Marine Service (CMEMS) models, ECMWF ocean physics, and global high-resolution forecasts. Metrics include Significant Wave Height (Hs), Wave Direction, Wind Sea Wave Height & Period, Secondary Swell, Sea Level MSL Surge, Ambient Air Temperature, Relative Humidity, and Precipitation.",
  },
  {
    id: "telemetry-2",
    category: "telemetry",
    question: "How frequently is marine telemetry updated?",
    answer:
      "Ocean wave forecasts and sea level surge data are refreshed hourly. Our backend server caches requests with a 1-hour time-to-live (TTL) and resilient exponential backoff retry sessions to guarantee sub-second response times.",
  },
  {
    id: "offline-1",
    category: "offline",
    question: "How does ORCA work offline when sailing beyond cellular coverage?",
    answer:
      "ORCA is a Progressive Web App (PWA). When you view a port or regional forecast while in harbor, Service Workers cache the 7-day hourly telemetry, navigational charts, and vessel guidelines locally. If connection drops at sea, the offline simulator and telemetry observatory remain fully accessible.",
  },
  {
    id: "account-1",
    category: "account",
    question: "Do I need to pay or create an account to check marine safety?",
    answer:
      "No. Project ORCA is an open sustainability initiative advancing UN SDG 14. Real-time safety ratings, map exploration, and basic telemetry are free for all mariners without requiring sign-in. Creating a free captain account unlocks saved coastal waypoints, custom automated threshold alerts, and voyage telemetry logging.",
  },
];

export const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>("safety-1");

  const categories = [
    { id: "all", label: "All Questions", icon: HelpCircle },
    { id: "safety", label: "Safety & Risk Engine", icon: ShieldCheck },
    { id: "vessels", label: "Vessel Classes", icon: Ship },
    { id: "telemetry", label: "Wave Telemetry", icon: Compass },
    { id: "offline", label: "Offline PWA", icon: WifiOff },
    { id: "account", label: "Account & Access", icon: Bell },
  ];

  const filteredFaqs = FAQ_DATA.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 text-left space-y-12">
      {/* Title Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono uppercase tracking-wider">
          <HelpCircle className="h-4 w-4" />
          <span>Knowledge Base &amp; FAQ</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-bold tracking-tight text-ink">
          How can we assist your voyage?
        </h1>
        <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
          Comprehensive guides covering our deterministic ocean risk engine, wave telemetry sensors, vessel safety classifications, and offline operations.
        </p>

        {/* Search Input */}
        <div className="relative pt-2">
          <Search className="absolute left-4 top-5.5 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search questions (e.g. cross sea, small craft, open meteo, offline)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-primary text-white shadow-sm font-bold"
                  : "bg-surface border border-border text-ink-muted hover:text-ink hover:bg-surface-raised"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-dashed border-border rounded-2xl text-ink-muted space-y-2">
            <HelpCircle className="h-8 w-8 mx-auto text-primary opacity-50" />
            <p className="text-sm font-bold text-ink">No matching questions found</p>
            <p className="text-xs">Try searching for &quot;wave&quot;, &quot;vessel&quot;, or &quot;offline&quot;.</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : faq.id)}
                  className="w-full p-5 flex items-center justify-between text-left gap-4 hover:bg-surface-raised transition-colors"
                >
                  <span className="font-heading font-bold text-sm sm:text-base text-ink">
                    {faq.question}
                  </span>
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-primary/10 text-primary" : "bg-surface-raised text-ink-muted border border-border"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-ink-muted leading-relaxed border-t border-border/50 animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still Have Questions CTA */}
      <div className="p-8 rounded-2xl bg-surface border border-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-heading font-bold text-ink">Still have questions regarding coastal operations?</h3>
          <p className="text-xs text-ink-muted">Our oceanography dispatch team responds within 4 hours.</p>
        </div>
        <Link
          to="/contact"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-hover transition-all"
        >
          <span>Contact Ocean Team</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};
