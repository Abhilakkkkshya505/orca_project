import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Anchor, ArrowLeft, Sun, Moon, Waves, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { ChatPanel } from "@/features/chat/ChatPanel";
import { MapView } from "@/features/map/MapView";
import { LiveMarineTelemetry } from "@/features/marine/LiveMarineTelemetry";

export const ExplorePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number; name?: string }>(() => {
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }
    return { lat: 18.93, lon: 72.84, name: "Mumbai Harbour" };
  });
  const [vesselClass, setVesselClass] = useState<"small_craft" | "mechanised">("small_craft");
  const [isDark, setIsDark] = useState(false);

  // Load port metadata from URL if ?port=<slug> is present
  useEffect(() => {
    const portSlug = searchParams.get("port");
    if (portSlug) {
      api
        .get<{ lat: number; lon: number; name: string }>(`/ports/${portSlug}/`)
        .then((port) => {
          setSelectedLocation({
            lat: port.lat,
            lon: port.lon,
            name: port.name,
          });
        })
        .catch(() => {
          // If port not found, keep current location
        });
    }
  }, [searchParams]);

  // Initialize or fetch conversation thread
  useEffect(() => {
    let mounted = true;
    const initThread = async () => {
      try {
        const res = await api.post<{ id: string }>("/chat/threads/", {
          title: "Coastal Inquiry",
        });
        if (mounted) setThreadId(res.id);
      } catch {
        // Fallback or retry
      }
    };
    initThread();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    if (nextTheme) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-bg text-ink overflow-hidden">
      {/* Navigation Bar */}
      <header className="h-14 border-b border-border bg-surface px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1.5 rounded hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors"
            aria-label="Back to landing page"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-primary" />
            <span className="font-semibold text-base tracking-tight">ORCA Explore</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Open-Meteo Waves Trigger */}
          <button
            onClick={() => setShowTelemetryDrawer(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="Open live Open-Meteo marine wave and swell telemetry"
          >
            <Waves className="h-4 w-4 animate-pulse" />
            <span className="hidden sm:inline">Open-Meteo Waves</span>
            <span className="sm:hidden">Waves</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded border border-border text-ink hover:bg-surface-raised transition-colors"
            aria-label="Toggle dark/light nautical theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/dashboard"
            className="text-xs font-semibold px-3 py-1.5 rounded bg-primary text-on-primary hover:bg-primary-hover transition-colors"
          >
            My Dashboard
          </Link>
        </div>
      </header>

      {/* Main Split Interface */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Chat Panel (Left on Desktop, Bottom on Mobile) */}
        <div className="w-full md:w-[460px] lg:w-[500px] h-1/2 md:h-full shrink-0 z-10 flex flex-col shadow-card">
          <ChatPanel
            threadId={threadId}
            selectedLocation={selectedLocation}
            vesselClass={vesselClass}
            onVesselClassChange={setVesselClass}
            className="h-full"
          />
        </div>

        {/* Map View (Right on Desktop, Top on Mobile) */}
        <div className="flex-1 h-1/2 md:h-full relative">
          <MapView
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            className="w-full h-full"
          />

          {/* Floating Pill on Map to open Telemetry for active waypoint */}
          <button
            onClick={() => setShowTelemetryDrawer(true)}
            className="absolute bottom-6 right-4 z-10 flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800 text-white backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-full shadow-2xl text-xs font-bold hover:scale-105 active:scale-95 transition-all"
          >
            <Waves className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span className="text-white">Live Marine Telemetry ({selectedLocation.lat.toFixed(2)}°, {selectedLocation.lon.toFixed(2)}°)</span>
          </button>
        </div>
      </div>

      {/* Slide-over Drawer for Live Open-Meteo Marine Telemetry */}
      {showTelemetryDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-4xl lg:max-w-5xl h-full bg-surface shadow-2xl flex flex-col border-l border-border overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-raised">
              <div className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-base text-ink">
                  Open-Meteo Oceanographic Observatory
                </h3>
              </div>
              <button
                onClick={() => setShowTelemetryDrawer(false)}
                className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-ink hover:bg-surface"
                aria-label="Close telemetry drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <LiveMarineTelemetry
                initialLat={selectedLocation.lat}
                initialLon={selectedLocation.lon}
                title={`Live Marine Telemetry for ${selectedLocation.name || `${selectedLocation.lat.toFixed(2)}°N, ${selectedLocation.lon.toFixed(2)}°E`}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

