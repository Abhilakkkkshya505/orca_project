import { useState, useRef, useCallback, useEffect } from "react";
import { ensureCsrfToken } from "@/lib/api/client";
import type { RiskAssessmentData } from "./RiskCard";

export interface ClarificationOptionData {
  name: string;
  slug?: string;
  state?: string;
  country: string;
  lat?: number;
  lon?: number;
  distance_hint?: string;
}

export interface ClarificationData {
  reason: string;
  options: ClarificationOptionData[];
  message?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  riskAssessment?: RiskAssessmentData;
  comparisonAssessments?: RiskAssessmentData[];
  clarification?: ClarificationData;
  isStreaming?: boolean;
  error?: string;
}

export interface MapFocus {
  lat: number;
  lon: number;
  zoom: number;
}

export interface MapLayer {
  id: string;
  type: string;
  data: GeoJSON.GeoJsonObject;
}

export interface MapPayload {
  focus?: MapFocus;
  layers?: MapLayer[];
}

export function useChatStream(threadId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStalled, setIsStalled] = useState(false);
  const [mapData, setMapData] = useState<MapPayload | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stallTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
    setIsStreaming(false);
    setIsStalled(false);
    setCurrentStatus(null);
  }, []);

  useEffect(() => {
    return () => {
      cancelStream();
    };
  }, [cancelStream]);

  const sendMessage = useCallback(
    async (
      content: string,
      location?: { lat: number; lon: number },
      vesselClass: "small_craft" | "mechanised" = "small_craft",
    ) => {
      if (!threadId || isStreaming) return;

      cancelStream();

      // Add user message and pending assistant message
      const userMsgId = `user-${Date.now()}`;
      const assistantMsgId = `assistant-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content },
        { id: assistantMsgId, role: "assistant", content: "", isStreaming: true },
      ]);

      setIsStreaming(true);
      setIsStalled(false);
      setCurrentStatus("Contacting coastal reasoning agents...");

      // 20-second stall timer (Part G3)
      stallTimerRef.current = setTimeout(() => {
        setIsStalled(true);
      }, 20000);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        await ensureCsrfToken();
        const csrfTokenMatch = document.cookie.match(/(^|;\s*)csrftoken=([^;]*)/);
        const csrfToken = csrfTokenMatch ? decodeURIComponent(csrfTokenMatch[2]) : "";

        const response = await fetch(`/api/v1/chat/threads/${threadId}/messages/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream, application/json, */*",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            content,
            location,
            vessel_class: vesselClass,
          }),
          credentials: "include",
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const block of parts) {
            if (!block.trim()) continue;

            const lines = block.split("\n");
            let eventName = "message";
            let dataStr = "";

            for (const line of lines) {
              // Ignore SSE comments like ': ping'
              if (line.startsWith(":")) continue;

              if (line.startsWith("event: ")) {
                eventName = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                dataStr = line.slice(6).trim();
              }
            }

            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              if (eventName === "status") {
                setCurrentStatus(data.label || "Evaluating marine conditions...");
              } else if (eventName === "clarification") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, clarification: data as ClarificationData }
                      : m,
                  ),
                );
              } else if (eventName === "risk") {
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantMsgId) return m;
                    // If multiple risk cards come in (compare mode)
                    if (m.riskAssessment && !m.comparisonAssessments) {
                      return {
                        ...m,
                        comparisonAssessments: [m.riskAssessment, data as RiskAssessmentData],
                      };
                    } else if (m.comparisonAssessments) {
                      return {
                        ...m,
                        comparisonAssessments: [...m.comparisonAssessments, data as RiskAssessmentData],
                      };
                    }
                    return { ...m, riskAssessment: data as RiskAssessmentData };
                  }),
                );
              } else if (eventName === "map") {
                setMapData(data as MapPayload);
              } else if (eventName === "token") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + (data.text || "") }
                      : m,
                  ),
                );
              } else if (eventName === "done") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, isStreaming: false } : m,
                  ),
                );
                setIsStreaming(false);
                setIsStalled(false);
                setCurrentStatus(null);
                if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
              } else if (eventName === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          isStreaming: false,
                          error: data.message || "An error occurred during evaluation.",
                        }
                      : m,
                  ),
                );
                setIsStreaming(false);
                setIsStalled(false);
                setCurrentStatus(null);
                if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
              }
            } catch {
              // Ignore partial JSON parse errors
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    isStreaming: false,
                    error: err.message || "Failed to stream marine response.",
                  }
                : m,
            ),
          );
        }
      } finally {
        setIsStreaming(false);
        setIsStalled(false);
        setCurrentStatus(null);
        if (stallTimerRef.current) {
          clearTimeout(stallTimerRef.current);
          stallTimerRef.current = null;
        }
        abortControllerRef.current = null;
      }
    },
    [threadId, isStreaming, cancelStream],
  );

  return {
    messages,
    setMessages,
    sendMessage,
    cancelStream,
    isStreaming,
    isStalled,
    currentStatus,
    mapData,
  };
}
