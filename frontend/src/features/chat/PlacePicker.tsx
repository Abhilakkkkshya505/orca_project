import React, { useState, useEffect } from "react";
import { Search, MapPin, Navigation, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api/client";

interface PortSummary {
  name: string;
  slug: string;
  state?: string;
  lat: number;
  lon: number;
}

interface PlacePickerProps {
  onLocationSelect: (loc: { name: string; lat: number; lon: number; slug?: string }) => void;
  className?: string;
}

export const PlacePicker: React.FC<PlacePickerProps> = ({ onLocationSelect, className = "" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<PortSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const resp = await apiRequest<{ results: PortSummary[] }>(
          `/ports/?search=${encodeURIComponent(searchTerm.trim())}`
        );
        setResults(resp.results.slice(0, 5));
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        onLocationSelect({
          name: "My Location",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setIsOpen(false);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-1.5 bg-surface-raised border border-border rounded px-2 py-1 text-xs text-ink focus-within:border-primary">
        <Search className="h-3.5 w-3.5 text-ink-muted shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search port or coast..."
          className="bg-transparent border-0 text-xs text-ink placeholder:text-ink-muted focus:outline-none w-36"
        />
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          title="Use my current GPS location"
          className="text-primary hover:opacity-80 p-0.5 rounded focus-visible:outline-focus"
        >
          {isLocating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isOpen && (results.length > 0 || isLoading) && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-border rounded-lg shadow-elevation z-50 overflow-hidden py-1">
          {isLoading && (
            <div className="p-2 text-xs text-ink-muted flex items-center justify-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Searching ports...
            </div>
          )}
          {results.map((port) => (
            <button
              key={port.slug}
              onClick={() => {
                onLocationSelect({
                  name: port.name,
                  lat: port.lat,
                  lon: port.lon,
                  slug: port.slug,
                });
                setSearchTerm(port.name);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-surface-raised flex items-center justify-between text-xs text-ink transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-medium truncate">{port.name}</span>
              </div>
              {port.state && <span className="text-[10px] text-ink-muted">{port.state}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
