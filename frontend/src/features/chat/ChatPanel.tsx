import React, { useState } from "react";
import { Ship, MapPin, Globe, X } from "lucide-react";
import { useChatStream, type ClarificationOptionData } from "./useChatStream";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { PlacePicker } from "./PlacePicker";
import { useTheme } from "@/lib/theme/ThemeContext";
import GlobeStudy from "@/components/originkit/ui/globe-study";

interface ChatPanelProps {
  threadId: string | null;
  selectedLocation: { lat: number; lon: number; name?: string };
  vesselClass: "small_craft" | "mechanised";
  onLocationChange?: (loc: { lat: number; lon: number; name?: string; slug?: string }) => void;
  onVesselClassChange?: (cls: "small_craft" | "mechanised") => void;
  className?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  threadId,
  selectedLocation,
  vesselClass,
  onLocationChange,
  onVesselClassChange,
  className = "",
}) => {
  const { resolvedTheme } = useTheme();
  const { messages, sendMessage, isStreaming, isStalled, currentStatus } = useChatStream(threadId);
  const [activePortName, setActivePortName] = useState<string>(selectedLocation.name || "Mumbai");
  const [showGlobe, setShowGlobe] = useState(false);

  const handleSend = (text: string) => {
    sendMessage(text, selectedLocation, vesselClass);
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content, selectedLocation, vesselClass);
    }
  };

  const handleClarificationSelect = (opt: ClarificationOptionData) => {
    if (opt.lat && opt.lon) {
      onLocationChange?.({ lat: opt.lat, lon: opt.lon, name: opt.name, slug: opt.slug });
      setActivePortName(opt.name);
    }
    // Continue conversation with selected port
    sendMessage(`Conditions for ${opt.name}`, opt.lat && opt.lon ? { lat: opt.lat, lon: opt.lon } : selectedLocation, vesselClass);
  };

  const handleLocationSelect = (loc: { name: string; lat: number; lon: number; slug?: string }) => {
    setActivePortName(loc.name);
    onLocationChange?.(loc);
  };

  return (
    <div className={`flex flex-col h-full bg-surface border-r border-border text-left ${className}`}>
      {/* Sub-header with Vessel Selector and PlacePicker */}
      <div className="px-4 py-2 border-b border-border bg-surface-raised flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-ink-muted">
          <Ship className="h-3.5 w-3.5 text-primary" />
          <span>Vessel:</span>
          <select
            value={vesselClass}
            onChange={(e) =>
              onVesselClassChange &&
              onVesselClassChange(e.target.value as "small_craft" | "mechanised")
            }
            className="bg-surface border border-border rounded px-1.5 py-0.5 font-medium text-ink focus-visible:outline-focus"
          >
            <option value="small_craft">Small Craft (FRP / Canoe)</option>
            <option value="mechanised">Mechanised (Trawler / Inboard)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <PlacePicker onLocationSelect={handleLocationSelect} />
          <button
            type="button"
            onClick={() => setShowGlobe((prev) => !prev)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold transition-colors ${
              showGlobe
                ? "bg-primary text-white border-primary shadow-xs"
                : "bg-surface border-border text-ink-muted hover:text-ink hover:bg-surface-raised"
            }`}
            title="Toggle Originkit 3D Globe Study"
            aria-pressed={showGlobe}
          >
            <Globe className="h-3.5 w-3.5 text-secondary" />
            <span>Globe</span>
          </button>
          <div className="flex items-center gap-1 text-ink-muted font-mono hidden sm:flex">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              {selectedLocation.lat.toFixed(2)}°N, {selectedLocation.lon.toFixed(2)}°E
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Originkit Globe Study Preview */}
      {showGlobe && (
        <div className="mx-4 my-2 p-3 rounded-2xl border border-border bg-surface-raised shadow-card flex flex-col items-center gap-2 relative animate-in fade-in zoom-in-95 duration-150">
          <div className="w-full flex items-center justify-between text-xs font-semibold text-ink px-1">
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-primary" />
              <span>Originkit Globe Study</span>
            </span>
            <button
              onClick={() => setShowGlobe(false)}
              className="text-ink-muted hover:text-ink text-xs p-1 rounded hover:bg-surface"
              aria-label="Hide globe view"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="w-full h-[220px] relative rounded-xl overflow-hidden border border-border/60 bg-bg">
            <GlobeStudy
              background="transparent"
              baseColor={resolvedTheme === "dark" ? "#7CC8FF" : "#0F4C81"}
              phrase="orcamarineintelligenceglobalsafetycoastaltelemetry"
              density={48}
              glyphSize={85}
              speed={75}
              hover={100}
              globe={{ radius: 108, drift: 180, letters: 100 }}
              pointer={{ zoom: 100, light: 120, pins: 8 }}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
              }}
            />
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 pointer-events-none px-2 py-0.5 rounded-full bg-surface/85 backdrop-blur-xs border border-border text-[9px] font-mono text-ink-muted whitespace-nowrap shadow-xs">
              Drag to spin 3D globe • Click to pin
            </div>
          </div>
        </div>
      )}

      {/* Suggested Questions Bar (Dynamic popular ports) */}
      <SuggestedQuestions
        currentPortName={activePortName}
        onSelect={handleSend}
        disabled={isStreaming}
      />

      {/* Main Message History with Accessibility */}
      <MessageList
        messages={messages}
        currentStatus={currentStatus}
        isStreaming={isStreaming}
        isStalled={isStalled}
        onRetry={handleRetry}
        onClarificationSelect={handleClarificationSelect}
      />

      {/* Composer with 1000 char counter and keyboard shortcuts */}
      <Composer
        onSend={handleSend}
        disabled={isStreaming}
        placeholder={`Ask about ${activePortName} sea safety, wave forecasts, or fishing zones...`}
      />
    </div>
  );
};
