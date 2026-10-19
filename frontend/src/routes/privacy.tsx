import React from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowLeft, AlertTriangle } from "lucide-react";

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Home
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm tracking-tight">ORCA Legal</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-12 text-left space-y-8">
        {/* Lawyer Review Alert */}
        <div className="p-4 rounded-sm border border-risk-caution/40 bg-risk-caution-bg text-ink flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-risk-caution shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-ink">
              DRAFT PRIVACY POLICY — PENDING FORMAL LEGAL REVIEW
            </p>
            <p className="text-ink-muted leading-relaxed">
              This document is a technical and operational draft reflecting ORCA&apos;s actual system architecture, data flows, and storage mechanisms. It must be reviewed and adapted by a licensed attorney before deployment in production jurisdictions.
            </p>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="text-xs font-mono text-ink-muted mt-2">
            Effective Date: October 18, 2026 • Document Version: 1.0.0-dev
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">1. Overview and Scope</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Project ORCA (&quot;ORCA&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;the platform&quot;) is a marine safety intelligence application built to support United Nations Sustainable Development Goal 14 (Life Below Water). ORCA processes oceanographic, satellite, and meteorological data to provide deterministic coastal safety ratings and fishing zone intelligence for small-craft and artisanal maritime operators.
          </p>
          <p className="text-sm text-ink-muted leading-relaxed">
            This Privacy Policy explains how personal data is collected, stored, processed, and safeguarded when using the web application, PWA, or API endpoints.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">2. Categories of Data Collected</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            We operate on a strict data minimisation principle. We collect only what is necessary to evaluate maritime safety thresholds and deliver coastal advisories:
          </p>
          <ul className="text-sm text-ink-muted list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-ink">Account Credentials:</strong> Email address, optional display name, and cryptographic password hashes (Argon2id). Passwords are never stored in plaintext.
            </li>
            <li>
              <strong className="text-ink">Saved Maritime Waypoints:</strong> Coordinates (latitude and longitude), custom station names, and notification alert thresholds configured by authenticated users.
            </li>
            <li>
              <strong className="text-ink">Chat and Assistant Telemetry:</strong> Natural language queries submitted to the coastal assistant, coordinates selected on the nautical map, vessel class selection, and user feedback ratings.
            </li>
            <li>
              <strong className="text-ink">Network & Security Telemetry:</strong> Connecting IP addresses (validated via Cloudflare trusted reverse proxy headers), user-agent strings, and request timestamps to enforce rate limits and defend against bot traffic.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">3. Essential Cookies and Local Storage</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            ORCA uses strictly essential, first-party cookies for security and authentication:
          </p>
          <div className="border border-border rounded-sm overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-surface-raised border-b border-border font-mono text-ink">
                <tr>
                  <th className="p-2.5">Cookie Name</th>
                  <th className="p-2.5">Domain</th>
                  <th className="p-2.5">Security Attributes</th>
                  <th className="p-2.5">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-ink-muted">
                <tr>
                  <td className="p-2.5 font-mono text-ink">orca_sessionid</td>
                  <td className="p-2.5 font-mono">.localtest.me</td>
                  <td className="p-2.5">HttpOnly, Secure, SameSite=Lax</td>
                  <td className="p-2.5">Maintains authenticated user session</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono text-ink">orca_csrftoken</td>
                  <td className="p-2.5 font-mono">.localtest.me</td>
                  <td className="p-2.5">SameSite=Lax</td>
                  <td className="p-2.5">Cross-Site Request Forgery prevention</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-muted">
            We do not use advertising trackers, marketing cookies, or cross-site tracking pixels.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">4. Third-Party Data Subprocessors</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Personal or telemetry data may be processed through trusted infrastructure providers:
          </p>
          <ul className="text-sm text-ink-muted list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong className="text-ink">Cloudflare, Inc.:</strong> Edge DNS, DDoS mitigation, Web Application Firewall, Cloudflare Turnstile bot verification, and Zero Trust Access for administrative endpoints.
            </li>
            <li>
              <strong className="text-ink">LLM Model Providers (Anthropic / Google Cloud):</strong> Natural language queries are forwarded without identifying user metadata solely for explanation synthesis. The deterministic risk engine executes entirely on our backend servers prior to any LLM invocation. When the offline template engine is active, no LLM provider is queried.
            </li>
            <li>
              <strong className="text-ink">Transactional Email Provider:</strong> Delivery of cryptographic email verification tokens and password reset links.
            </li>
            <li>
              <strong className="text-ink">Public Oceanographic Feeds (Open-Meteo, Copernicus, NASA):</strong> Marine data is ingested server-side via scheduled Celery background tasks. User requests never query external marine APIs directly.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">5. Data Retention Schedule</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            In compliance with our security governance policy:
          </p>
          <ul className="text-sm text-ink-muted list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong className="text-ink">User Account Data:</strong> Retained until the user requests account deletion, followed by a 30-day encrypted backup purge cycle.
            </li>
            <li>
              <strong className="text-ink">Chat Threads & Interactions:</strong> Automatically pruned after 90 days.
            </li>
            <li>
              <strong className="text-ink">Risk Assessment Records:</strong> Retained in immutable audit storage for 12 months for maritime safety validation and auditability.
            </li>
            <li>
              <strong className="text-ink">Security Audit Logs:</strong> Retained for 12 months in compliance with security audit mandates.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">6. Your Rights</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Depending on your jurisdiction, you possess statutory rights regarding your personal information:
          </p>
          <ul className="text-sm text-ink-muted list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong className="text-ink">Digital Personal Data Protection Act 2023 (India):</strong> Right to access summary of processed personal data, right to correction and erasure, right of grievance redressal, and right to nominate a representative.
            </li>
            <li>
              <strong className="text-ink">General Data Protection Regulation (GDPR / UK GDPR):</strong> Right of access (Art. 15), right to rectification (Art. 16), right to erasure (Art. 17), right to restriction of processing (Art. 18), and right to data portability (Art. 20).
            </li>
            <li>
              <strong className="text-ink">California Consumer Privacy Act (CCPA / CPRA):</strong> Right to know categories and specific pieces of data collected, right to delete, and right to non-discrimination. We do not sell or share personal information.
            </li>
          </ul>
          <p className="text-sm text-ink-muted pt-1">
            Users may export their personal data directly in JSON format via their Account Settings or request permanent deletion via the self-service account deletion control.
          </p>
        </section>

        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-lg font-semibold text-ink">7. Contact and Grievance Officer</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            For inquiries regarding this policy or to exercise statutory privacy rights:
          </p>
          <div className="text-xs font-mono text-ink-muted bg-surface-raised p-3 rounded-sm border border-border">
            <p>Data Protection & Grievance Officer: ORCA Project Team</p>
            <p>Email: privacy@orca-marine.org (Development Placeholder)</p>
            <p>Bennett University, Greater Noida, UP, India</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface px-6 py-6 text-xs text-ink-muted text-center">
        <p>© 2026 Project ORCA • Marine Ecosystem Reasoning for SDG 14</p>
      </footer>
    </div>
  );
};
