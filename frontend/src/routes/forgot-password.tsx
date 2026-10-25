import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, ensureCsrfToken } from "@/lib/api/client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Anchor, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";

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
      await api.post("/auth/password-reset/", {
        ...values,
        turnstile_token: "1x00000000000000000000AA",
      });
    } catch {
      // Non-negotiable anti-enumeration rule: Always display success message
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-bg text-ink selection:bg-primary/20">
      {/* Brand Header */}
      <div className="w-full max-w-md mb-6 text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-cyan-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <Anchor className="h-5 w-5" />
          </div>
          <span className="font-heading font-bold text-2xl tracking-tight text-ink">
            ORCA
          </span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Recover Bridge Credentials
        </h1>
        <p className="text-xs text-ink-muted leading-relaxed">
          Enter your registered email address to receive secure cryptographic password reset instructions.
        </p>
      </div>

      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-card card-hover text-left">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <KeyRound className="h-5 w-5" />
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <span>Password recovery instructions dispatched</span>
            </div>
            <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed">
              If an account with that email address is registered, an encrypted recovery link has been dispatched to your inbox. Please check your spam folder if it doesn&apos;t arrive in 2 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Registered Mariner Email"
              type="email"
              autoComplete="email"
              placeholder="captain@orca.example"
              error={errors.email?.message}
              {...register("email")}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 py-2.5 font-bold shadow-md"
              isLoading={isSubmitting}
            >
              Send Recovery Instructions
            </Button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-border text-center text-xs">
          <Link
            to="/login"
            className="text-primary font-bold hover:underline inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
