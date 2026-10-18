import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, ensureCsrfToken } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { resetPasswordConfirmSchema, type ResetPasswordConfirmInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordConfirmInput>({
    resolver: zodResolver(resetPasswordConfirmSchema),
    defaultValues: {
      token: tokenFromUrl,
    },
  });

  const onSubmit = async (values: ResetPasswordConfirmInput) => {
    setServerError(null);
    try {
      await ensureCsrfToken();
      await api.post("/auth/password-reset/confirm/", values);
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2500);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message || "Invalid, expired, or previously used reset token.");
      } else {
        setServerError("A network error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-ink">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg p-6 sm:p-8 shadow-card text-left">
        <div className="mb-6">
          <div className="h-10 w-10 rounded-full bg-water text-primary flex items-center justify-center mb-3">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Set new password</h1>
          <p className="text-sm text-ink-muted mt-1">
            Choose a strong password with at least 10 characters to secure your account.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-4 rounded-sm bg-risk-safe-bg text-risk-safe border border-risk-safe/30 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Password Updated Successfully</p>
              <p className="text-xs mt-0.5">Redirecting to sign in...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {serverError && (
              <div
                className="flex items-center gap-2 p-3 rounded-sm bg-risk-unsafe-bg text-risk-unsafe border border-risk-unsafe/20 text-sm"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <Input
              label="Reset Token"
              type="text"
              placeholder="Paste token from reset link"
              error={errors.token?.message}
              {...register("token")}
            />

            <Input
              label="New Password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 10 characters"
              error={errors.new_password?.message}
              {...register("new_password")}
            />

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
              Update Password
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
