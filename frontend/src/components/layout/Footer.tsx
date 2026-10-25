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
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border bg-surface text-ink text-left">
      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-cyan-700 text-white flex items-center justify-center shadow-md">
                <Anchor className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-xl leading-tight tracking-tight text-ink">
                  ORCA
                </span>
                <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider font-semibold">
                  Ocean Reasoning & Coastal Advisory
                </span>
              </div>
            </Link>

            <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
              Autonomous multi-agent oceanographic intelligence advancing United Nations SDG 14 (Life Below Water).
              Delivering verified deterministic safety ratings, live wave telemetry, and productive fishing zones for coastal mariners.
            </p>

            {/* SDG 14 Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              <span>UN Sustainable Development Goal 14 Verified</span>
            </div>

            {/* Emergency Maritime Advisory Alert */}
            <div className="p-3 rounded-xl bg-surface-raised border border-border text-[11px] text-ink-muted space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-risk-caution">
                <Radio className="h-3.5 w-3.5" />
                <span>Maritime Safety Notice</span>
              </div>
              <p>
                In case of active distress at sea, transmit immediately on VHF Channel 16 (156.800 MHz) or contact the Indian Coast Guard MRCC (1554).
              </p>
            </div>
          </div>

          {/* Column 1: Product Navigation */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-ink">
              Product & Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/explore" className="text-ink-muted hover:text-primary transition-colors flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5" /> Explore AI Map
                </Link>
              </li>
              <li>
                <Link to="/ports" className="text-ink-muted hover:text-primary transition-colors flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Port Directory
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-ink-muted hover:text-primary transition-colors flex items-center gap-1.5">
                  <Ship className="h-3.5 w-3.5" /> Vessel Safety Comparison
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-ink-muted hover:text-primary transition-colors flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5" /> Scientific Methodology
                </Link>
              </li>
              <li>
                <Link to="/status" className="text-ink-muted hover:text-primary transition-colors flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" /> Telemetry System Status
                </Link>
              </li>
              <li>
                <Link to="/game" className="text-ink-muted hover:text-primary transition-colors">
                  Offline Maritime Simulator
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Resources & Company */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-ink">
              Resources & Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="text-ink-muted hover:text-primary transition-colors">
                  About Us & Mission
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-ink-muted hover:text-primary transition-colors flex items-center justify-between">
                  <span>Careers</span>
                  <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[9px] font-bold">HIRING</span>
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-ink-muted hover:text-primary transition-colors">
                  Research Blog & News
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-ink-muted hover:text-primary transition-colors">
                  Help Center & FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-ink-muted hover:text-primary transition-colors flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Contact Ocean Team
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Abhilakkkkshya505/orca_project"
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-muted hover:text-primary transition-colors flex items-center gap-1.5"
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
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-ink">
              Legal & Compliance
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="text-ink-muted hover:text-primary transition-colors flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-ink-muted hover:text-primary transition-colors flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-ink-muted hover:text-primary transition-colors flex items-center gap-1.5">
                  <Cookie className="h-3.5 w-3.5" /> Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/accessibility" className="text-ink-muted hover:text-primary transition-colors">
                  Accessibility (WCAG 2.1 AA)
                </Link>
              </li>
              <li>
                <span className="text-[11px] text-ink-muted/70 block pt-1">
                  IMD & INCOIS Data Attribution
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider & Sub-Footer */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>&copy; {new Date().getFullYear()} ORCA Marine Technologies. All rights reserved.</span>
            <div className="flex items-center gap-4 text-[11px]">
              <Link to="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-ink transition-colors">Terms</Link>
              <Link to="/cookies" className="hover:text-ink transition-colors">Cookies</Link>
              <Link to="/contact" className="hover:text-ink transition-colors">Support</Link>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Abhilakkkkshya505/orca_project"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-surface-raised border border-border text-ink-muted hover:text-ink hover:border-primary transition-colors"
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
              className="p-2 rounded-lg bg-surface-raised border border-border text-ink-muted hover:text-ink hover:border-primary transition-colors"
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
              className="p-2 rounded-lg bg-surface-raised border border-border text-ink-muted hover:text-ink hover:border-primary transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.77v8.37H6.46v-8.37M7.85 6.25a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
