import React from "react";
import { ShieldAlert, ExternalLink } from "lucide-react";

export const Attribution: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <section className={`border-t border-border bg-surface-raised/50 py-6 px-6 text-xs text-ink-muted ${className}`}>
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-ink font-semibold uppercase tracking-wider text-[11px]">
          <ShieldAlert className="h-4 w-4 text-risk-caution" />
          <span>Data Sources, Attribution & Licensing Compliance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1 p-2.5 rounded bg-surface border border-border">
            <span className="font-medium text-ink">Marine & Weather Telemetry:</span>
            <p className="leading-relaxed">
              Marine wave, swell, and wind forecasts provided by{" "}
              <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Open-Meteo
              </a>{" "}
              under CC-BY 4.0, integrating models from Deutscher Wetterdienst (DWD) and NOAA.
            </p>
          </div>

          <div className="space-y-1 p-2.5 rounded bg-surface border border-border">
            <span className="font-medium text-ink">Satellite Oceanography:</span>
            <p className="leading-relaxed">
              Sea Surface Temperature (SST) and Chlorophyll-a concentration datasets courtesy of{" "}
              <a href="https://coastwatch.pfeg.noaa.gov" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                NOAA CoastWatch / OceanWatch
              </a>{" "}
              and E.U. Copernicus Marine Service.
            </p>
          </div>

          <div className="space-y-1 p-2.5 rounded bg-surface border border-border">
            <span className="font-medium text-ink">Nautical Chart Basemap:</span>
            <p className="leading-relaxed">
              Coastlines and bathymetry data ©{" "}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                OpenStreetMap contributors
              </a>
              , with depth contours from GEBCO and Natural Earth.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-border text-[11px]">
          <p>
            <strong>Official Safety Notice:</strong> Official storm warnings and high wave bulletins issued by INCOIS
            and IMD legally supersede all ORCA advisory calculations.
          </p>
          <a
            href="https://github.com/Abhilakkkkshya505/orca_project"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <span>Verified Source Registry</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </section>
  );
};
