import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, ensureCsrfToken } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { signupSchema, type SignupInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: SignupInput) => {
    setServerError(null);
    try {
      await ensureCsrfToken();
      await api.post("/auth/signup/", values);
      navigate("/verify-email", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details && Object.keys(err.details).length > 0) {
          for (const [field, msgs] of Object.entries(err.details)) {
            setError(field as keyof SignupInput, { message: msgs[0] });
          }
        } else {
          setServerError(err.message || "Signup failed. Please try again.");
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
          <h1 className="text-2xl font-semibold mt-1">Create an account</h1>
          <p className="text-sm text-ink-muted mt-1">
            Sign up to save coastal waypoints, monitor conditions, and receive automated alerts.
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

          <Input
            label="Display name / Vessel Name"
            type="text"
            autoComplete="name"
            placeholder="Kochi Trawler 4"
            error={errors.display_name?.message}
            {...register("display_name")}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 10 characters"
            helperText="Minimum 10 characters for marine security compliance."
            error={errors.password?.message}
            {...register("password")}
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center text-xs text-ink-muted">
          Already registered?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
