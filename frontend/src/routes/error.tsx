import React, { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertOctagon,
  WifiOff,
  Clock,
  Lock,
  ServerCrash,
  RefreshCw,
  Home,
  Copy,
  Check,
  Anchor,
} from "lucide-react";

interface ErrorPageProps {
  status?: number;
  message?: string;
  requestId?: string;
  retryAfter?: number;
}

export const ErrorPage: React.FC<ErrorPageProps> = (props) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  // Derive parameters from props or query strings
  const code = props.status || parseInt(searchParams.get("code") || "500", 10);
  const message = props.message || searchParams.get("message") || "An unexpected system anomaly occurred.";
  const requestId = props.requestId || searchParams.get("request_id") || "req_marine_err_9182";
  const retryAfter = props.retryAfter || parseInt(searchParams.get("retry_after") || "30", 10);

  const handleCopyId = () => {
    navigator.clipboard.writeText(requestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Distinct error states
  let title = "System Error";
  let description = message;
  let icon = <ServerCrash className="h-10 w-10 text-risk-unsafe" />;

  if (code === 0 || !navigator.onLine || message.toLowerCase().includes("network")) {
    title = "Network Telemetry Severed";
    description = "Unable to connect to ORCA servers. Check your cellular data or satellite uplink.";
    icon = <WifiOff className="h-10 w-10 text-risk-caution" />;
  } else if (code === 401) {
    title = "Session Expired";
    description = "Your authenticated session has lapsed. Please sign in to resume operations.";
    icon = <Lock className="h-10 w-10 text-primary" />;
  } else if (code === 403) {
    title = "Access Restricted";
    description = "You do not have administrative clearance to access this navigational record.";
    icon = <Lock className="h-10 w-10 text-risk-unsafe" />;
  } else if (code === 429) {
    title = "Rate Limit Reached";
    description = `Telemetry query limit exceeded. Upstream servers require a cooldown. Please retry in ${retryAfter} seconds.`;
    icon = <Clock className="h-10 w-10 text-risk-caution" />;
  } else if (code >= 500) {
    title = "Upstream Server Outage";
    description = "The oceanographic analysis service encountered an internal exception. Engineering teams have been notified.";
    icon = <AlertOctagon className="h-10 w-10 text-risk-unsafe" />;
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Anchor className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">ORCA Incident Response</span>
        </div>
        <span className="text-xs font-mono text-ink-muted">STATUS {code}</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 py-16 flex flex-col items-center text-center gap-6">
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-card">
          {icon}
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-ink-muted bg-surface-raised px-2.5 py-1 rounded border border-border">
            HTTP Status {code}
          </span>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-ink-muted leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        </div>

        {/* Copy-able Error ID */}
        <div className="w-full p-3 rounded bg-surface-raised border border-border flex items-center justify-between text-xs font-mono">
          <div className="text-left truncate mr-2">
            <span className="text-ink-muted block text-[10px]">INCIDENT REQUEST ID:</span>
            <span className="text-ink font-semibold truncate">{requestId}</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyId}
            className="h-8 px-2.5 gap-1.5 shrink-0 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-risk-safe" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy ID
              </>
            )}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {code === 401 ? (
            <Link to={`/login?next=${encodeURIComponent(location.pathname)}`}>
              <Button size="md" variant="primary">
                Sign In to Resume
              </Button>
            </Link>
          ) : (
            <Button
              size="md"
              variant="primary"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Retry Request
            </Button>
          )}

          <Link to="/">
            <Button size="md" variant="secondary" className="gap-2">
              <Home className="h-4 w-4" /> Return to Safe Port (Home)
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-6 text-xs text-ink-muted text-center">
        <p>© 2026 Project ORCA • Marine Ecosystem Reasoning for SDG 14</p>
      </footer>
    </div>
  );
};
