import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { api, ensureCsrfToken } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { sanitizeNextPath } from "@/features/auth/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      await ensureCsrfToken();
      await api.post("/auth/login/", values);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      const destination = sanitizeNextPath(nextParam);
      navigate(destination, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details && Object.keys(err.details).length > 0) {
          for (const [field, msgs] of Object.entries(err.details)) {
            setError(field as keyof LoginInput, { message: msgs[0] });
          }
        } else {
          setServerError(err.message || "Invalid email or password.");
        }
      } else {
        setServerError("A network error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-ink">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg p-6 sm:p-8 shadow-card">
        <div className="text-left mb-6">
          <Link to="/" className="text-xs uppercase tracking-widest text-primary font-mono font-medium">
            ORCA Marine Safety
          </Link>
          <h1 className="text-2xl font-semibold mt-1">Sign in to your account</h1>
          <p className="text-sm text-ink-muted mt-1">
            Access your saved coastal locations, vessel safety alerts, and risk assessments.
          </p>
        </div>

        {serverError && (
          <div
            className="flex items-center gap-2 p-3 mb-4 rounded-sm bg-risk-unsafe-bg text-risk-unsafe border border-risk-unsafe/20 text-sm"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="captain@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <div>
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <div className="text-right mt-1.5">
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline font-medium focus-visible:outline-2"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
            Sign In
          </Button>

          <p className="text-center text-xs text-ink-muted mt-2">
            By signing in you agree to the{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center text-xs text-ink-muted">
          Don't have an account yet?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
