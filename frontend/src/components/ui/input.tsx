import React from "react";
import { AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, error, helperText, className = "", ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        <label htmlFor={inputId} className="text-sm font-medium text-ink select-none">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId || helperId}
          className={`w-full h-11 px-3 py-2 text-sm bg-surface-raised border rounded-sm text-ink placeholder:text-ink-muted/60 transition-colors focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 ${
            error
              ? "border-risk-unsafe focus-visible:border-risk-unsafe"
              : "border-border-strong focus-visible:border-primary"
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="flex items-center gap-1.5 text-xs text-risk-unsafe mt-0.5" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-ink-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
