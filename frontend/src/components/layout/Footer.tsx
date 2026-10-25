import React from "react";
import { Link } from "react-router-dom";
import {
  Anchor,
  Compass,
  Ship,
  MapPin,
  HelpCircle,
  Activity,
  Shield,
  FileText,
  Cookie,
  Mail,
  Radio,
  Waves,
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full relative text-left select-none">
      {/* Wave-shaped animated SVG divider separating content from footer */}
      <div className="w-full overflow-hidden leading-none select-none -mb-1">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-10 sm:h-16 lg:h-20 block"
        >
          {/* Back subtle wave in light seafoam/sky blue */}
          <path
            d="M0 60C320 20 640 90 960 40C1200 8 1360 45 1440 60V120H0V60Z"
            fill="#1E88E5"
            fillOpacity="0.3"
            className="animate-wave-float-reverse"
          />
          {/* Main front wave flowing into deep ocean blue */}
          <path
            d="M0 40C360 85 720 15 1080 65C1260 90 1380 45 1440 50V120H0V40Z"
            fill="#0F4C81"
          />
        </svg>
      </div>

      {/* Main Deep Ocean Blue Container */}
      <div className="bg-[#0F4C81] text-white pt-6 pb-12 lg:pb-16 px-4 sm:px-6 lg:px-8 border-t border-[#1E88E5]/30">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
            {/* Brand & Mission Column */}
            <div className="lg:col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-2.5 group w-fit">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#4DD0E1] via-[#1E88E5] to-white/90 text-[#0F4C81] flex items-center justify-center shadow-lg shadow-sky-950/40 group-hover:scale-105 transition-transform">
                  <Anchor className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-2xl leading-tight tracking-tight text-white flex items-center gap-2">
                    ORCA
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#4DD0E1]/20 text-[#B2EBF2] border border-[#4DD0E1]/40">
                      SDG 14
                    </span>
                  </span>
                  <span className="text-[10px] font-mono text-[#B2EBF2] uppercase tracking-wider font-semibold">
                    Ocean Reasoning & Coastal Safety
                  </span>
                </div>
              </Link>

              <p className="text-xs text-[#E5EEF5]/85 leading-relaxed max-w-sm">
                Autonomous multi-agent oceanographic intelligence advancing United Nations SDG 14 (Life Below Water).
                Delivering verified deterministic safety ratings, live wave telemetry, and productive fishing zones for small-craft mariners.
              </p>

              {/* Emergency Maritime Advisory Alert Pill */}
              <div className="p-3.5 rounded-2xl bg-[#09355B] border border-[#4DD0E1]/30 flex items-start gap-3 shadow-inner">
                <Radio className="h-4 w-4 text-[#FF8A65] shrink-0 mt-0.5 animate-pulse" />
                <div className="text-[11px] leading-relaxed text-[#E5EEF5]/90 space-y-0.5">
                  <span className="font-bold text-[#B2EBF2] block">VHF Emergency Distress Channel 16</span>
                  <span>Indian Coast Guard 24x7 Maritime Assistance Toll-Free: <strong className="text-white font-mono">1554</strong></span>
                </div>
              </div>
            </div>

            {/* Column 1: Core Platform */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#B2EBF2] flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-[#4DD0E1]" />
                Platform
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/explore" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                    <Waves className="h-3.5 w-3.5 text-[#64B5F6]" /> Ocean Map Explorer
                  </Link>
                </li>
                <li>
                  <Link to="/ports" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#64B5F6]" /> Indian Port Directory
                  </Link>
                </li>
                <li>
                  <Link to="/compare" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                    <Ship className="h-3.5 w-3.5 text-[#64B5F6]" /> Vessel Risk Matrix
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-[#64B5F6]" /> Safety Gate Rules
                  </Link>
                </li>
                <li>
                  <Link to="/status" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-[#2ECC71]" /> Telemetry Health
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Ocean Resources */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#B2EBF2] flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-[#4DD0E1]" />
                Resources
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/about" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all">
                    About Project & SDG 14
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all">
                    Help Center & FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all">
                    Ocean Research Blog
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all">
                    Careers & Fellowships
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#64B5F6]" /> Contact Ocean Team
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/Abhilakkkkshya505/orca_project"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5"
                  >
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span>Open Source Code</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal & Governance */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#B2EBF2] flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#4DD0E1]" />
                Legal & Trust
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/privacy" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-[#64B5F6]" /> Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-[#64B5F6]" /> Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                    <Cookie className="h-3.5 w-3.5 text-[#64B5F6]" /> Cookie Preferences
                  </Link>
                </li>
                <li>
                  <Link to="/accessibility" className="text-[#E5EEF5]/80 hover:text-white hover:translate-x-0.5 transition-all">
                    Accessibility (WCAG 2.1)
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider & Sub-Footer */}
          <div className="pt-8 border-t border-[#1E88E5]/25 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B2EBF2]/80">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span>&copy; {new Date().getFullYear()} ORCA Marine Technologies. All rights reserved.</span>
              <div className="flex items-center gap-4 text-[11px]">
                <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                <Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link>
                <Link to="/contact" className="hover:text-white transition-colors">Support</Link>
              </div>
            </div>

            {/* Social Icons with subtle glow */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/Abhilakkkkshya505/orca_project"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#09355B] border border-[#1E88E5]/40 text-[#B2EBF2] hover:text-white hover:border-[#4DD0E1] transition-all hover:scale-105"
                aria-label="GitHub Repository"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#09355B] border border-[#1E88E5]/40 text-[#B2EBF2] hover:text-white hover:border-[#4DD0E1] transition-all hover:scale-105"
                aria-label="X (formerly Twitter)"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#09355B] border border-[#1E88E5]/40 text-[#B2EBF2] hover:text-white hover:border-[#4DD0E1] transition-all hover:scale-105"
                aria-label="LinkedIn"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.77v8.37H6.46v-8.37M7.85 6.25a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
