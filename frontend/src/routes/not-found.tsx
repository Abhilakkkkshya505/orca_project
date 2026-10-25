import React from "react";
import { Link } from "react-router-dom";
import { Compass, Anchor, MapPin, AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center space-y-8 flex-1 flex flex-col justify-center">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-md">
        <Compass className="h-10 w-10 text-primary animate-pulse" />
      </div>

      <div className="space-y-3">
        <span className="text-xs font-mono uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full font-bold">
          Beacon ID: ERR_404_OFF_CHART
        </span>
        <h1 className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-ink">
          Off-Chart Waters
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed max-w-md mx-auto">
          The maritime coordinate, depth contour, or URL you requested does not exist on this navigational grid or has drifted outside surveyed bounds.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-surface border border-border shadow-card text-left space-y-4">
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-primary" />
          <span>Recommended Navigational Waypoints</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <Link
            to="/explore"
            className="p-3 rounded-xl bg-surface-raised border border-border hover:border-primary/50 transition-all flex items-center gap-2.5 text-ink font-semibold card-hover"
          >
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span>Interactive Live Map</span>
          </Link>
          <Link
            to="/ports"
            className="p-3 rounded-xl bg-surface-raised border border-border hover:border-primary/50 transition-all flex items-center gap-2.5 text-ink font-semibold card-hover"
          >
            <Anchor className="h-4 w-4 text-primary shrink-0" />
            <span>Indian Port Directory</span>
          </Link>
          <Link
            to="/compare"
            className="p-3 rounded-xl bg-surface-raised border border-border hover:border-primary/50 transition-all flex items-center gap-2.5 text-ink font-semibold card-hover"
          >
            <Compass className="h-4 w-4 text-primary shrink-0" />
            <span>Vessel Comparison</span>
          </Link>
          <Link
            to="/"
            className="p-3 rounded-xl bg-surface-raised border border-border hover:border-primary/50 transition-all flex items-center gap-2.5 text-ink font-semibold card-hover"
          >
            <Home className="h-4 w-4 text-primary shrink-0" />
            <span>ORCA Home Landing</span>
          </Link>
        </div>
      </div>

      <div>
        <Link to="/">
          <Button variant="primary" className="px-6 py-2.5 font-bold shadow-md gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Safe Harbor</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
