import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    // 44px minimum touch target
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-colors select-none min-h-[44px] min-w-[44px] px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2";

    const variantStyles = {
      primary: "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-hover/90",
      secondary:
        "border border-border-strong text-ink hover:bg-surface-raised active:bg-surface",
      ghost: "text-ink hover:bg-surface hover:text-ink active:bg-border/30",
      danger: "bg-risk-unsafe text-white hover:bg-risk-unsafe/90 active:bg-risk-unsafe/80",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 min-h-[38px]",
      md: "text-sm px-4 py-2.5 min-h-[44px]",
      lg: "text-base px-5 py-3 min-h-[48px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
