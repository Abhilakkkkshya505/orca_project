import React, { useState } from "react";
import { Ship, MapPin } from "lucide-react";
import { useChatStream, type ClarificationOptionData } from "./useChatStream";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { PlacePicker } from "./PlacePicker";

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
  const { messages, sendMessage, isStreaming, isStalled, currentStatus } = useChatStream(threadId);
  const [activePortName, setActivePortName] = useState<string>(selectedLocation.name || "Mumbai");

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
          <div className="flex items-center gap-1 text-ink-muted font-mono hidden sm:flex">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              {selectedLocation.lat.toFixed(2)}°N, {selectedLocation.lon.toFixed(2)}°E
            </span>
          </div>
        </div>
      </div>

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
