import React, { useRef, useEffect } from "react";
import type { ChatMessage, ClarificationOptionData } from "./useChatStream";
import { RiskCard } from "./RiskCard";
import { ComparisonCard } from "./ComparisonCard";
import { ClarificationOptions } from "./ClarificationOptions";
import { AlertCircle, RefreshCw, Compass } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeContext";
import GlobeStudy from "@/components/originkit/ui/globe-study";

interface MessageListProps {
  messages: ChatMessage[];
  currentStatus: string | null;
  isStreaming: boolean;
  isStalled?: boolean;
  onRetry: () => void;
  onClarificationSelect: (option: ClarificationOptionData) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentStatus,
  isStreaming,
  isStalled = false,
  onRetry,
  onClarificationSelect,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStatus]);

  const { resolvedTheme } = useTheme();

  return (
    <div
      role="log"
      aria-live="polite"
      className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 text-left"
    >
      {messages.length === 0 ? (
        <div className="my-auto text-center p-4 text-ink-muted flex flex-col items-center gap-4">
          {/* Originkit Interactive 3D Globe Study */}
          <div className="w-full max-w-[280px] h-[250px] relative rounded-2xl overflow-hidden border border-border bg-surface-raised/40 shadow-card flex items-center justify-center">
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
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none px-2.5 py-0.5 rounded-full bg-surface/85 backdrop-blur-xs border border-border text-[10px] font-mono text-ink-muted whitespace-nowrap shadow-xs">
              Drag to spin • Click to drop pin
            </div>
          </div>

          <div>
            <p className="font-semibold text-sm text-ink flex items-center justify-center gap-1.5">
              <Compass className="h-4 w-4 text-primary" />
              <span>ORCA Coastal Marine Assistant</span>
            </p>
            <p className="text-xs mt-1 max-w-sm text-ink-muted leading-relaxed">
              Ask about wave forecasts, safe sailing windows, or fishing zones. Select any port or drop coordinates directly on the globe and world map.
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
              {/* Single Risk Card */}
              {msg.riskAssessment && !msg.comparisonAssessments && (
                <RiskCard assessment={msg.riskAssessment} />
              )}

              {/* Comparison Cards if multi-port */}
              {msg.comparisonAssessments && msg.comparisonAssessments.length >= 2 && (
                <ComparisonCard assessments={msg.comparisonAssessments} />
              )}

              {/* Interactive Clarification Options if ambiguous place */}
              {msg.clarification && (
                <ClarificationOptions
                  options={msg.clarification.options}
                  onSelect={onClarificationSelect}
                />
              )}

              {/* Assistant Explanation Prose */}
              {msg.content && (
                <div className="rounded-md bg-surface border border-border p-4 text-sm leading-relaxed text-ink shadow-card whitespace-pre-line">
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
                    onClick={onRetry}
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

      {/* 20-second Stall Notice (Part G3) */}
      {isStalled && isStreaming && (
        <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
          <span>This is taking longer than usual due to fresh telemetry gathering...</span>
          <button
            onClick={onRetry}
            className="underline font-semibold text-primary ml-2 hover:opacity-80"
          >
            Restart inquiry
          </button>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
