import React from "react";
import { Link } from "react-router-dom";
import { AlertOctagon } from "lucide-react";

export const TermsPage: React.FC = () => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-left space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <Link to="/" className="hover:text-ink transition-colors">Home</Link>
        <span>/</span>
        <span className="text-ink font-medium">Terms & Conditions</span>
      </div>
        {/* Lawyer Review Alert */}
        <div className="p-4 rounded-sm border border-risk-unsafe/40 bg-risk-unsafe-bg text-ink flex items-start gap-3">
          <AlertOctagon className="h-5 w-5 text-risk-unsafe shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-ink">
              DRAFT TERMS OF SERVICE — MARITIME LEGAL NOTICE
            </p>
            <p className="text-ink-muted leading-relaxed">
              This document contains critical maritime liability disclaimers and navigation safety boundaries. It is an operational draft that must be reviewed by qualified admiralty/maritime counsel before commercial or public deployment.
            </p>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Terms and Conditions of Use</h1>
          <p className="text-xs font-mono text-ink-muted mt-2">
            Effective Date: October 18, 2026 • Document Version: 1.0.0-dev
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">1. Acceptance of Terms</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            By accessing or using the Project ORCA web application, API, progressive web app, or data feeds (collectively, the &quot;Service&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree, do not access or use the Service.
          </p>
        </section>

        <section className="space-y-3 bg-surface-raised p-4 rounded-sm border border-border">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <span className="text-risk-unsafe font-bold">2. CRITICAL SAFETY NOTICE: NOT AN AID TO NAVIGATION</span>
          </h2>
          <div className="text-sm text-ink-muted space-y-2 leading-relaxed">
            <p className="font-medium text-ink">
              ORCA IS AN EXPERIMENTAL DECISION-SUPPORT TOOL FOR RESEARCH AND EDUCATIONAL AWARENESS. IT IS NOT A CERTIFIED ELECTRONIC CHART DISPLAY AND INFORMATION SYSTEM (ECDIS) OR AN AID TO NAVIGATION (AtoN).
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-1 text-xs">
              <li>
                <strong className="text-ink">Official Warnings Take Absolute Precedence:</strong> All official maritime broadcasts, weather warnings, gale alerts, cyclone advisories, and swell surge warnings issued by statutory authorities—including the India Meteorological Department (IMD), Indian National Centre for Ocean Information Services (INCOIS), Directorate General of Shipping, and the Indian Coast Guard—strictly supersede any output, safety rating, or zone suggestion produced by ORCA.
              </li>
              <li>
                <strong className="text-ink">Threshold Values Are Development Placeholders:</strong> Thresholds configured in the risk evaluation engine are development and demonstration baselines. They must not be relied upon as absolute safety thresholds for seaworthiness or navigation decisions.
              </li>
              <li>
                <strong className="text-ink">Master&apos;s Discretion:</strong> The master or skipper of any vessel retains sole legal and operational responsibility for the safety of the vessel, crew, cargo, and navigation decisions at all times under maritime law (SOLAS regulations).
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">3. Nature of Oceanographic and Algorithmic Telemetry</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Marine conditions are subject to localized micro-climates, unexpected bathymetric shoaling, sudden squalls, and sensor telemetry latency. Forecast snapshots provided by Open-Meteo, Copernicus Marine Service, and NASA Ocean Color represent numerical model approximations and satellite passes, which may be delayed, degraded, or temporarily unavailable. Missing data defaults strictly to an &quot;unknown&quot; state and must never be interpreted as an endorsement of safe passage.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">4. Permitted Use and Restrictions</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            ORCA is made available under a non-commercial, open sustainability research licence supporting SDG 14. You agree not to:
          </p>
          <ul className="text-sm text-ink-muted list-disc list-inside space-y-1.5 pl-2">
            <li>Reverse engineer, bypass, or tamper with the deterministic risk validation safeguards.</li>
            <li>Submit abusive, automated, or scripted requests that exceed published API rate limits.</li>
            <li>Misrepresent ORCA assessments as official government maritime clearances.</li>
            <li>Use the platform to coordinate illegal, unregulated, or unreported (IUU) fishing activities in prohibited maritime zones or Marine Protected Areas (MPAs).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">5. Disclaimer of Warranties and Limitation of Liability</h2>
          <p className="text-sm text-ink-muted leading-relaxed uppercase text-xs font-mono">
            TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. UNDER NO CIRCUMSTANCES SHALL PROJECT ORCA, ITS CONTRIBUTORS, RESEARCHERS, OR HOST INSTITUTIONS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO VESSEL CASUALTY, LOSS OF LIFE, EQUIPMENT DAMAGE, LOSS OF HARVEST, OR REGULATORY PENALTIES ARISING FROM THE USE OF OR INABILITY TO USE THE SERVICE.
          </p>
        </section>

        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-lg font-semibold text-ink">6. Governing Law and Jurisdiction</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            These terms shall be governed and construed in accordance with the laws of India. Any disputes arising in connection with the platform shall be subject to the exclusive jurisdiction of the competent courts in Uttar Pradesh, India.
          </p>
        </section>
    </div>
  );
};
