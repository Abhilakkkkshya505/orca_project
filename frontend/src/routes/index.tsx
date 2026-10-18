import React from "react";

export const DashboardPage: React.FC = () => (
  <div className="p-8 max-w-5xl mx-auto text-left">
    <h1 className="text-2xl font-bold mb-4">Marine Safety Dashboard</h1>
    <p className="text-ink-muted">Saved coastal locations, alert status, and data freshness metrics.</p>
  </div>
);

export const LocationsPage: React.FC = () => (
  <div className="p-8 max-w-5xl mx-auto text-left">
    <h1 className="text-2xl font-bold mb-4">Saved Locations & Waypoints</h1>
    <p className="text-ink-muted">Manage your coastal fishing grounds and harbour alerts.</p>
  </div>
);

export const AdvisoriesPage: React.FC = () => (
  <div className="p-8 max-w-5xl mx-auto text-left">
    <h1 className="text-2xl font-bold mb-4">Official Marine Advisories</h1>
    <p className="text-ink-muted">High swell alerts, squall bulletins, and INCOIS PFZ broadcasts.</p>
  </div>
);

export const SettingsPage: React.FC = () => (
  <div className="p-8 max-w-5xl mx-auto text-left">
    <h1 className="text-2xl font-bold mb-4">Account & Profile Settings</h1>
    <p className="text-ink-muted">Vessel category, measurement units, and account management.</p>
  </div>
);

export const PrivacyPage: React.FC = () => (
  <div className="p-8 max-w-4xl mx-auto text-left">
    <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
    <p className="text-ink-muted">Data retention and user privacy rights under DPDP & GDPR.</p>
  </div>
);

export const TermsPage: React.FC = () => (
  <div className="p-8 max-w-4xl mx-auto text-left">
    <h1 className="text-2xl font-bold mb-4">Terms and Conditions</h1>
    <p className="text-ink-muted">Marine advisory limitations and service terms.</p>
  </div>
);

export const AccessibilityPage: React.FC = () => (
  <div className="p-8 max-w-4xl mx-auto text-left">
    <h1 className="text-2xl font-bold mb-4">Accessibility Statement</h1>
    <p className="text-ink-muted">WCAG 2.1 AA conformance and outdoor glare contrast standards.</p>
  </div>
);

export const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-bg text-ink">
    <h1 className="text-5xl font-mono font-bold text-primary mb-2">404</h1>
    <h2 className="text-xl font-semibold mb-2">Waypoint Not Found</h2>
    <p className="text-ink-muted mb-6 max-w-md text-sm">
      The nautical chart coordinate or page you requested does not exist or has drifted off course.
    </p>
    <a href="/" className="text-sm font-medium text-primary hover:underline">
      Return to Safe Waters (Home)
    </a>
  </div>
);
