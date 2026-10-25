import React from "react";
import { Link } from "react-router-dom";
import {
  Anchor,
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
    <footer className="w-full bg-surface border-t border-border text-left select-none transition-colors">
      <div className="max-w-7xl mx-auto py-12 lg:py-16 px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <Anchor className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-xl leading-tight tracking-tight text-ink flex items-center gap-2">
                  ORCA
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    SDG 14
                  </span>
                </span>
                <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider font-semibold">
                  Ocean Reasoning & Coastal Analytics
                </span>
              </div>
            </Link>

            <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
              Autonomous multi-agent oceanographic intelligence advancing United Nations SDG 14 (Life Below Water).
              Delivering verified deterministic safety ratings, live wave telemetry, and productive fishing zones for mariners.
            </p>

            {/* Emergency Maritime Advisory Alert */}
            <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-start gap-3">
              <Radio className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-ink-secondary space-y-0.5">
                <span className="font-bold text-ink block">VHF Emergency Distress Channel 16</span>
                <span>Indian Coast Guard 24x7 Assistance Toll-Free: <strong className="text-ink font-mono font-bold">1554</strong></span>
              </div>
            </div>
          </div>

          {/* Column 1: Core Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink font-semibold">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/explore" className="text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1.5">
                  <Waves className="h-3.5 w-3.5 text-primary" /> Ocean Map Explorer
                </Link>
              </li>
              <li>
                <Link to="/ports" className="text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Indian Port Directory
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1.5">
                  <Ship className="h-3.5 w-3.5 text-primary" /> Vessel Risk Matrix
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-primary" /> Safety Gate Rules
                </Link>
              </li>
              <li>
                <Link to="/status" className="text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-500" /> Telemetry Health
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Ocean Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink font-semibold">
              Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="text-ink-muted hover:text-ink transition-colors">
                  About Project & SDG 14
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-ink-muted hover:text-ink transition-colors">
                  Help Center & FAQ
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-ink-muted hover:text-ink transition-colors">
                  Ocean Research Blog
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-ink-muted hover:text-ink transition-colors">
                  Careers & Fellowships
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" /> Contact Ocean Team
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Abhilakkkkshya505/orca_project"
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1.5"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>Open Source</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink font-semibold">
              Legal & Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" /> Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1.5">
                  <Cookie className="h-3.5 w-3.5 text-primary" /> Cookie Preferences
                </Link>
              </li>
              <li>
                <Link to="/accessibility" className="text-ink-muted hover:text-ink transition-colors">
                  Accessibility (WCAG 2.1)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider & Sub-Footer */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
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
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/Abhilakkkkshya505/orca_project"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-md border border-border text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
              aria-label="GitHub Repository"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
