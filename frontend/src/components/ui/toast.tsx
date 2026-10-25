import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration: number = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastMessage = { id, type, message, title, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss],
  );

  const toast = {
    success: (msg: string, title?: string) => addToast("success", msg, title),
    error: (msg: string, title?: string) => addToast("error", msg, title),
    warning: (msg: string, title?: string) => addToast("warning", msg, title),
    info: (msg: string, title?: string) => addToast("info", msg, title),
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast Render Portal */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const config = {
            success: {
              icon: CheckCircle2,
              bg: "bg-emerald-50 dark:bg-emerald-950/80",
              border: "border-emerald-200 dark:border-emerald-800",
              text: "text-emerald-900 dark:text-emerald-100",
              iconColor: "text-emerald-600 dark:text-emerald-400",
            },
            error: {
              icon: AlertCircle,
              bg: "bg-red-50 dark:bg-red-950/80",
              border: "border-red-200 dark:border-red-800",
              text: "text-red-900 dark:text-red-100",
              iconColor: "text-red-600 dark:text-red-400",
            },
            warning: {
              icon: AlertTriangle,
              bg: "bg-amber-50 dark:bg-amber-950/80",
              border: "border-amber-200 dark:border-amber-800",
              text: "text-amber-900 dark:text-amber-100",
              iconColor: "text-amber-600 dark:text-amber-400",
            },
            info: {
              icon: Info,
              bg: "bg-sky-50 dark:bg-sky-950/80",
              border: "border-sky-200 dark:border-sky-800",
              text: "text-sky-900 dark:text-sky-100",
              iconColor: "text-sky-600 dark:text-sky-400",
            },
          }[t.type];

          const Icon = config.icon;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 fade-in duration-200 ${config.bg} ${config.border} ${config.text}`}
              role="status"
            >
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${config.iconColor}`} />
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-xs font-bold leading-tight mb-0.5">{t.title}</p>}
                <p className="text-xs leading-relaxed">{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-ink-muted hover:text-ink p-1 rounded-md transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      toast: {
        success: (m: string) => console.log("Toast Success:", m),
        error: (m: string) => console.error("Toast Error:", m),
        warning: (m: string) => console.warn("Toast Warning:", m),
        info: (m: string) => console.info("Toast Info:", m),
      },
      dismiss: () => {},
    };
  }
  return context;
}
