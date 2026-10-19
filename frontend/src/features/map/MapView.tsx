import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Crosshair, ZoomIn, ZoomOut } from "lucide-react";
import type { MapPayload } from "@/features/chat/useChatStream";

interface MapViewProps {
  mapData?: MapPayload | null;
  selectedLocation?: { lat: number; lon: number };
  onSelectLocation?: (loc: { lat: number; lon: number }) => void;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  mapData,
  selectedLocation = { lat: 18.93, lon: 72.84 },
  onSelectLocation,
  className = "",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [currentZoom, setCurrentZoom] = useState(9);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Admiralty chart style: high-contrast paper and water styling
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-layer",
            type: "raster",
            source: "osm",
            paint: {
              "raster-saturation": -0.2,
              "raster-contrast": 0.1,
            },
          },
        ],
      },
      center: [selectedLocation.lon, selectedLocation.lat],
      zoom: 9,
      attributionControl: false,
    });

    // Add navigation and custom controls
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("zoom", () => {
      setCurrentZoom(Math.round(map.getZoom()));
    });

    // Allow user to click to drop coordinate and pass to chat
    map.on("click", (e) => {
      const lat = parseFloat(e.lngLat.lat.toFixed(4));
      const lon = parseFloat(e.lngLat.lng.toFixed(4));
      if (onSelectLocation) {
        onSelectLocation({ lat, lon });
      }
    });

    // Custom marker
    const el = document.createElement("div");
    el.className = "w-6 h-6 rounded-full bg-primary border-2 border-white shadow-md cursor-pointer";
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([selectedLocation.lon, selectedLocation.lat])
      .addTo(map);

    markerRef.current = marker;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync selected location marker
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLngLat([selectedLocation.lon, selectedLocation.lat]);
    mapRef.current.easeTo({
      center: [selectedLocation.lon, selectedLocation.lat],
      duration: 800,
    });
  }, [selectedLocation.lat, selectedLocation.lon]);

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
                "circle-color": "#0F5C6E",
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
        },
        () => {
          // Fallback or permission denied
        },
      );
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[300px] flex flex-col ${className}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="h-10 w-10 bg-surface-raised border border-border-strong rounded shadow-card flex items-center justify-center text-ink hover:bg-surface active:bg-border/20"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="h-10 w-10 bg-surface-raised border border-border-strong rounded shadow-card flex items-center justify-center text-ink hover:bg-surface active:bg-border/20"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          onClick={handleLocateMe}
          className="h-10 w-10 bg-surface-raised border border-border-strong rounded shadow-card flex items-center justify-center text-ink hover:bg-surface active:bg-border/20"
          aria-label="Locate my coastal position"
        >
          <Crosshair className="h-5 w-5" />
        </button>
      </div>

      {/* "Use this point" Overlay Control */}
      <div className="absolute bottom-6 left-4 z-10 flex items-center gap-2 bg-surface-raised/95 backdrop-blur-sm border border-border px-3 py-2 rounded shadow-card text-xs">
        <span className="font-mono text-ink">
          {selectedLocation.lat.toFixed(2)}°N, {selectedLocation.lon.toFixed(2)}°E
        </span>
        <button
          onClick={() => onSelectLocation && onSelectLocation(selectedLocation)}
          className="text-primary font-semibold hover:underline px-1 py-0.5"
        >
          Use this point
        </button>
      </div>

      {/* Accessible Text Alternative for Screen Readers */}
      <div className="sr-only" aria-live="polite">
        Interactive nautical map focused on latitude {selectedLocation.lat.toFixed(2)}, longitude{" "}
        {selectedLocation.lon.toFixed(2)} at zoom level {currentZoom}.
      </div>
    </div>
  );
};
