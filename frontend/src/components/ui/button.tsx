import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
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
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2";

    const variantStyles = {
      primary:
        "bg-primary text-on-primary hover:bg-primary-hover font-semibold shadow-xs",
      secondary:
        "bg-surface border border-border text-ink hover:bg-surface-raised hover:border-border-strong",
      ghost:
        "text-ink-secondary hover:text-ink hover:bg-surface-raised",
      danger:
        "bg-rose-600 text-white hover:bg-rose-700 font-semibold shadow-xs",
      success:
        "bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-xs",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 h-8 rounded-md",
      md: "text-xs sm:text-sm px-4 py-2 h-10 rounded-lg",
      lg: "text-sm px-5 py-2.5 h-11 rounded-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
