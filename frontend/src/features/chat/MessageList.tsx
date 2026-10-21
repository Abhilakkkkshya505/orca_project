import React, { useRef, useEffect } from "react";
import type { ChatMessage, ClarificationOptionData } from "./useChatStream";
import { RiskCard } from "./RiskCard";
import { ComparisonCard } from "./ComparisonCard";
import { ClarificationOptions } from "./ClarificationOptions";
import { AlertCircle, RefreshCw, Ship } from "lucide-react";

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

  return (
    <div
      role="log"
      aria-live="polite"
      className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 text-left"
    >
      {messages.length === 0 ? (
        <div className="my-auto text-center p-6 text-ink-muted flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-water text-primary flex items-center justify-center">
            <Ship className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-sm text-ink">Coastal Safety & Marine Assistant</p>
            <p className="text-xs mt-1 max-w-sm">
              Ask about conditions off any coastal port, wave forecasts, or likely fishing zones. The reasoning engine evaluates deterministic safety limits.
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
