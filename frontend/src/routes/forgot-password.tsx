import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, ensureCsrfToken } from "@/lib/api/client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, CheckCircle2 } from "lucide-react";

export const ForgotPasswordPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      await ensureCsrfToken();
      await api.post("/auth/password-reset/", values);
    } catch {
      // Non-negotiable anti-enumeration rule: Always display success message
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-ink">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg p-6 sm:p-8 shadow-card text-left">
        <div className="mb-6">
          <div className="h-10 w-10 rounded-full bg-water text-primary flex items-center justify-center mb-3">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="text-sm text-ink-muted mt-1">
            Enter the email address registered with your account to receive password reset instructions.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-sm bg-surface-raised border border-border text-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-risk-safe font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Password reset instructions dispatched</span>
            </div>
            <p className="text-xs text-ink-muted">
              If an account with that email exists, an email has been sent with a secure password reset link. Please check your inbox and spam folder.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Account email"
              type="email"
              autoComplete="email"
              placeholder="captain@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
              Send Reset Instructions
            </Button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-border text-center text-xs text-ink-muted">
          <Link to="/login" className="text-primary font-medium hover:underline">
            Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
