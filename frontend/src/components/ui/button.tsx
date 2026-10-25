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
    // 44px minimum touch target
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none min-h-[44px] min-w-[44px] px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-[#1E88E5] to-[#0F4C81] text-white shadow-md shadow-[#0F4C81]/15 hover:shadow-lg hover:shadow-[#1E88E5]/25 hover:-translate-y-0.5 active:translate-y-0",
      secondary:
        "bg-white border border-[#1E88E5]/40 text-[#1E88E5] hover:bg-[#F2F8FC] hover:border-[#1E88E5] shadow-xs hover:-translate-y-0.5 active:translate-y-0",
      ghost: "text-[#0F2742] hover:bg-[#F2F8FC] hover:text-[#1E88E5] active:bg-[#E5EEF5]",
      danger:
        "bg-[#FF8A65] text-white shadow-md shadow-[#FF8A65]/20 hover:bg-[#F4511E] hover:-translate-y-0.5 active:translate-y-0",
      success:
        "bg-[#2ECC71] text-white shadow-md shadow-[#2ECC71]/20 hover:bg-[#27AE60] hover:-translate-y-0.5 active:translate-y-0",
    };

    const sizeStyles = {
      sm: "text-xs px-3.5 py-1.5 min-h-[38px] rounded-lg",
      md: "text-sm px-4 py-2.5 min-h-[44px] rounded-xl",
      lg: "text-base px-6 py-3 min-h-[48px] rounded-2xl",
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
