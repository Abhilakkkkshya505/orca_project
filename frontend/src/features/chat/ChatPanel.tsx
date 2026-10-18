import React, { useState, useRef, useEffect } from "react";
import { Send, MapPin, RefreshCw, AlertCircle, Ship } from "lucide-react";
import { useChatStream } from "./useChatStream";
import { RiskCard } from "./RiskCard";
import { Button } from "@/components/ui/button";

interface ChatPanelProps {
  threadId: string | null;
  selectedLocation: { lat: number; lon: number };
  vesselClass: "small_craft" | "mechanised";
  onVesselClassChange?: (cls: "small_craft" | "mechanised") => void;
  className?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  threadId,
  selectedLocation,
  vesselClass,
  onVesselClassChange,
  className = "",
}) => {
  const { messages, sendMessage, isStreaming, currentStatus } = useChatStream(threadId);
  const [inputContent, setInputContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || isStreaming) return;
    const query = inputContent.trim();
    setInputContent("");
    sendMessage(query, selectedLocation, vesselClass);
  };

  return (
    <div className={`flex flex-col h-full bg-surface border-r border-border text-left ${className}`}>
      {/* Vessel Class Selector Sub-header */}
      <div className="px-4 py-2 border-b border-border bg-surface-raised flex items-center justify-between text-xs">
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

        <div className="flex items-center gap-1 text-ink-muted font-mono">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            {selectedLocation.lat.toFixed(2)}°N, {selectedLocation.lon.toFixed(2)}°E
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {messages.length === 0 ? (
          <div className="my-auto text-center p-6 text-ink-muted flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-water text-primary flex items-center justify-center">
              <Ship className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-sm text-ink">Coastal Safety & Marine Assistant</p>
              <p className="text-xs mt-1 max-w-sm">
                Ask about conditions off Kochi, wave forecasts, or likely fishing zones. The reasoning engine evaluates deterministic safety limits.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-md bg-surface-raised border border-border p-3 text-sm shadow-card text-ink">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex flex-col gap-3 w-full">
                {/* Structured Risk Card appears first if available */}
                {msg.riskAssessment && <RiskCard assessment={msg.riskAssessment} />}

                {/* Assistant Explanation Prose */}
                {msg.content && (
                  <div className="rounded-md bg-surface border border-border p-4 text-sm leading-relaxed text-ink shadow-card">
                    {msg.content}
                  </div>
                )}

                {/* Error handling with retry button */}
                {msg.error && (
                  <div className="p-3 rounded-sm bg-risk-unsafe-bg text-risk-unsafe border border-risk-unsafe/20 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{msg.error}</span>
                    </div>
                    <button
                      onClick={() => sendMessage("Retry previous inquiry", selectedLocation, vesselClass)}
                      className="inline-flex items-center gap-1 font-semibold underline text-primary ml-2 hover:opacity-80"
                    >
                      <RefreshCw className="h-3 w-3" /> Retry
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Live Step-by-Step Reasoning Status Bar */}
        {isStreaming && currentStatus && (
          <div className="flex items-center gap-2.5 p-3 rounded bg-water/60 border border-border text-xs text-primary font-medium animate-pulse">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>{currentStatus}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-surface flex gap-2">
        <input
          type="text"
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          placeholder="Ask: 'Is it safe to go out tomorrow morning?'"
          disabled={isStreaming}
          className="flex-1 px-3 py-2 text-sm bg-surface-raised border border-border-strong rounded text-ink placeholder:text-ink-muted focus-visible:outline-focus"
        />
        <Button type="submit" size="md" disabled={!inputContent.trim() || isStreaming}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
