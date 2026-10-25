import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Crosshair,
  ZoomIn,
  ZoomOut,
  Layers,
  Globe,
  Mountain,
  Compass,
  Moon,
  Waves,
  Check,
  Tag,
} from "lucide-react";
import type { MapPayload } from "@/features/chat/useChatStream";

export type MapMode = "satellite" | "terrestrial" | "nautical" | "dark" | "coastal";

export interface MapViewProps {
  mapData?: MapPayload | null;
  selectedLocation?: { lat: number; lon: number } | null;
  onSelectLocation?: (loc: { lat: number; lon: number }) => void;
  cooperativeGestures?: boolean;
  className?: string;
  defaultMode?: MapMode;
}

interface MapModeOption {
  id: MapMode;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MAP_MODES: MapModeOption[] = [
  {
    id: "satellite",
    name: "Satellite View",
    category: "Earth Observation",
    description: "High-resolution satellite imagery & coastline boundaries",
    icon: Globe,
  },
  {
    id: "terrestrial",
    name: "Terrestrial / Topo",
    category: "Terrain & Relief",
    description: "Elevation contours, coastal terrain relief, and river deltas",
    icon: Mountain,
  },
  {
    id: "nautical",
    name: "Nautical Chart",
    category: "Admiralty",
    description: "Standard hydrographic navigation and coastal chart",
    icon: Compass,
  },
  {
    id: "coastal",
    name: "Oceanic Voyager",
    category: "Marine Survey",
    description: "High-contrast coastal waters, bays, and shoals",
    icon: Waves,
  },
  {
    id: "dark",
    name: "Night Radar / ECDIS",
    category: "Tactical Dark",
    description: "Low-glare dark palette for nighttime bridge operations",
    icon: Moon,
  },
];

export const MapView: React.FC<MapViewProps> = ({
  mapData,
  selectedLocation = null,
  onSelectLocation,
  cooperativeGestures = false,
  className = "",
  defaultMode = "satellite",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [activeMode, setActiveMode] = useState<MapMode>(defaultMode);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState(selectedLocation ? 10 : 5);

  const layerMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (layerMenuRef.current && !layerMenuRef.current.contains(e.target as Node)) {
        setIsLayerMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = selectedLocation
      ? [selectedLocation.lon, selectedLocation.lat]
      : [78.96, 20.59]; // Regional India / Indian Ocean overview
    const initialZoom = selectedLocation ? 10 : 5;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      cooperativeGestures: cooperativeGestures,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
          satellite: {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, GIS Community",
          },
          terrestrial: {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "Tiles © Esri — Sources: Esri, HERE, Garmin, Intermap, USGS, METI, OpenStreetMap contributors",
          },
          dark: {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© CARTO, © OpenStreetMap contributors",
          },
          coastal: {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© CARTO, © OpenStreetMap contributors",
          },
          "satellite-labels": {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "© Esri Boundaries",
          },
        },
        layers: [
          {
            id: "layer-nautical",
            type: "raster",
            source: "osm",
            layout: { visibility: defaultMode === "nautical" ? "visible" : "none" },
            paint: { "raster-saturation": -0.15, "raster-contrast": 0.05 },
          },
          {
            id: "layer-satellite",
            type: "raster",
            source: "satellite",
            layout: { visibility: defaultMode === "satellite" ? "visible" : "none" },
          },
          {
            id: "layer-terrestrial",
            type: "raster",
            source: "terrestrial",
            layout: { visibility: defaultMode === "terrestrial" ? "visible" : "none" },
          },
          {
            id: "layer-dark",
            type: "raster",
            source: "dark",
            layout: { visibility: defaultMode === "dark" ? "visible" : "none" },
          },
          {
            id: "layer-coastal",
            type: "raster",
            source: "coastal",
            layout: { visibility: defaultMode === "coastal" ? "visible" : "none" },
          },
          {
            id: "layer-satellite-labels",
            type: "raster",
            source: "satellite-labels",
            layout: { visibility: (defaultMode === "satellite" && showLabels) ? "visible" : "none" },
          },
        ],
      },
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
    });

    // Add navigation and custom controls
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("zoom", () => {
      setCurrentZoom(Math.round(map.getZoom()));
    });

    // Allow user to click to drop coordinate and pass to chat/parent
    map.on("click", (e) => {
      const lat = parseFloat(e.lngLat.lat.toFixed(4));
      const lon = parseFloat(e.lngLat.lng.toFixed(4));
      if (onSelectLocation) {
        onSelectLocation({ lat, lon });
      }
    });

    // Custom marker with animated radar ring
    if (selectedLocation) {
      const el = document.createElement("div");
      el.className = "orca-map-pin flex items-center justify-center relative cursor-pointer";
      el.innerHTML = `
        <div class="absolute w-7 h-7 rounded-full bg-cyan-400/40 animate-ping"></div>
        <div class="w-5 h-5 rounded-full bg-primary border-2 border-white shadow-xl flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
        </div>
      `;
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([selectedLocation.lon, selectedLocation.lat])
        .addTo(map);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update base layer visibility smoothly
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyLayers = () => {
      const allModes: MapMode[] = ["satellite", "terrestrial", "nautical", "dark", "coastal"];
      for (const m of allModes) {
        const layerId = `layer-${m}`;
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", m === activeMode ? "visible" : "none");
        }
      }

      if (map.getLayer("layer-satellite-labels")) {
        const labelsVisible = (activeMode === "satellite" || activeMode === "terrestrial") && showLabels;
        map.setLayoutProperty(
          "layer-satellite-labels",
          "visibility",
          labelsVisible ? "visible" : "none",
        );
      }
    };

    if (map.isStyleLoaded()) {
      applyLayers();
    } else {
      map.once("load", applyLayers);
    }
  }, [activeMode, showLabels]);

  // Sync selected location marker
  useEffect(() => {
    if (!mapRef.current || !selectedLocation) return;
    if (markerRef.current) {
      markerRef.current.setLngLat([selectedLocation.lon, selectedLocation.lat]);
    } else {
      const el = document.createElement("div");
      el.className = "orca-map-pin flex items-center justify-center relative cursor-pointer";
      el.innerHTML = `
        <div class="absolute w-7 h-7 rounded-full bg-cyan-400/40 animate-ping"></div>
        <div class="w-5 h-5 rounded-full bg-primary border-2 border-white shadow-xl flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
        </div>
      `;
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([selectedLocation.lon, selectedLocation.lat])
        .addTo(mapRef.current);
    }

    mapRef.current.easeTo({
      center: [selectedLocation.lon, selectedLocation.lat],
      duration: 800,
    });
  }, [selectedLocation?.lat, selectedLocation?.lon]);

  // Sync GeoJSON layers when mapData updates from chat events
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapData) return;

    if (mapData.focus) {
      map.flyTo({
        center: [mapData.focus.lon, mapData.focus.lat],
        zoom: mapData.focus.zoom || 9,
      });
    }

    if (mapData.layers) {
      for (const layer of mapData.layers) {
        const sourceId = `source-${layer.id}`;
        const layerId = `layer-${layer.id}`;

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: "geojson",
            data: layer.data as any,
          });

          if (layer.id === "fishing-zones") {
            map.addLayer({
              id: layerId,
              type: "circle",
              source: sourceId,
              paint: {
                "circle-radius": 8,
                "circle-color": "#0ea5e9",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#FFFFFF",
              },
            });
          }
        } else {
          (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(layer.data as any);
        }
      }
    }
  }, [mapData]);

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lon = parseFloat(pos.coords.longitude.toFixed(4));
          if (onSelectLocation) {
            onSelectLocation({ lat, lon });
          }
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [lon, lat],
              zoom: 11,
              duration: 1200,
            });
          }
        },
        () => {
          // Fallback or permission denied
        },
      );
    }
  };

  const currentModeOption = MAP_MODES.find((m) => m.id === activeMode) || MAP_MODES[0];
  const CurrentIcon = currentModeOption.icon;

  return (
    <div className={`relative w-full h-full min-h-[300px] flex flex-col ${className}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Mode Switcher Pill & Popover (Top Left) */}
      <div ref={layerMenuRef} className="absolute top-4 left-4 z-20">
        <button
          onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-lg hover:bg-surface text-ink text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Switch Map Mode"
        >
          <Layers className="h-4 w-4 text-primary" />
          <span className="flex items-center gap-1.5 font-medium">
            <CurrentIcon className="h-3.5 w-3.5 text-primary" />
            <span>{currentModeOption.name}</span>
          </span>
        </button>

        {/* Dropdown Menu */}
        {isLayerMenuOpen && (
          <div className="absolute top-12 left-0 w-72 bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-2.5 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1 text-[11px] font-mono uppercase text-ink-muted flex items-center justify-between border-b border-border/60 pb-1.5 mb-1">
              <span>Basemap Modes</span>
              <span className="text-[10px] text-primary font-semibold">5 Available</span>
            </div>

            {MAP_MODES.map((option) => {
              const Icon = option.icon;
              const isSelected = activeMode === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    setActiveMode(option.id);
                    setIsLayerMenuOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-primary/10 border border-primary/30 text-ink"
                      : "hover:bg-surface-raised border border-transparent text-ink-muted hover:text-ink"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isSelected ? "bg-primary text-white" : "bg-surface border border-border text-ink"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-ink">{option.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </div>
                    <span className="text-[10px] text-ink-muted block line-clamp-1">{option.description}</span>
                  </div>
                </button>
              );
            })}

            {/* Labels & Boundaries Toggle (for Satellite / Terrestrial) */}
            {(activeMode === "satellite" || activeMode === "terrestrial") && (
              <div className="border-t border-border/60 pt-2 px-1">
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-surface-raised text-xs text-ink transition-colors"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    Coastline & Port Labels
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                      showLabels ? "bg-primary/20 text-primary" : "bg-surface text-ink-muted border border-border"
                    }`}
                  >
                    {showLabels ? "ON" : "OFF"}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Zoom & Location Controls (Top Right) */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="h-10 w-10 bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-card flex items-center justify-center text-ink hover:bg-surface active:bg-border/20 transition-all hover:scale-105"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="h-10 w-10 bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-card flex items-center justify-center text-ink hover:bg-surface active:bg-border/20 transition-all hover:scale-105"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          onClick={handleLocateMe}
          className="h-10 w-10 bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-card flex items-center justify-center text-ink hover:bg-surface active:bg-border/20 transition-all hover:scale-105"
          aria-label="Locate my coastal position"
          title="Locate coastal position"
        >
          <Crosshair className="h-5 w-5" />
        </button>
      </div>

      {/* "Use this point" / Coordinate Indicator (Bottom Left) */}
      {selectedLocation && (
        <div className="absolute bottom-6 left-4 z-10 flex items-center gap-2 bg-surface/95 backdrop-blur-md border border-border px-3.5 py-2 rounded-xl shadow-card text-xs">
          <span className="font-mono text-ink">
            {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lon.toFixed(4)}°E
          </span>
          {onSelectLocation && (
            <button
              onClick={() => onSelectLocation(selectedLocation)}
              className="text-primary font-semibold hover:underline px-1 py-0.5 ml-1"
            >
              Target this waypoint
            </button>
          )}
        </div>
      )}

      {/* Accessible Text Alternative for Screen Readers */}
      <div className="sr-only" aria-live="polite">
        {selectedLocation
          ? `Interactive nautical map in ${activeMode} mode focused on latitude ${selectedLocation.lat.toFixed(2)}, longitude ${selectedLocation.lon.toFixed(2)} at zoom level ${currentZoom}.`
          : `Interactive nautical map in ${activeMode} mode showing regional coastal overview at zoom level ${currentZoom}. No waypoint currently selected.`}
      </div>
    </div>
  );
};
