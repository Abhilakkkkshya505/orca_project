import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, ensureCsrfToken } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle, Mail } from "lucide-react";

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [token, setToken] = useState(tokenFromUrl);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const verifyToken = async (tokenToUse: string) => {
    if (!tokenToUse.trim()) return;
    setIsVerifying(true);
    setError(null);
    try {
      await ensureCsrfToken();
      await api.post("/auth/verify-email/", { token: tokenToUse.trim() });
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Invalid or expired verification token.");
      } else {
        setError("Network error while verifying email.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || cooldown > 0) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      await ensureCsrfToken();
      await api.post("/auth/resend-verification/", { email: resendEmail.trim() });
      setResendStatus("If an unverified account matches that address, a new verification link has been dispatched.");
      setCooldown(60); // 60s cooldown
    } catch {
      setResendStatus("If an unverified account matches that address, a new verification link has been dispatched.");
      setCooldown(60);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-ink">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg p-6 sm:p-8 shadow-card text-left">
        <div className="mb-6">
          <div className="h-10 w-10 rounded-full bg-water text-primary flex items-center justify-center mb-3">
            <Mail className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Verify your email address</h1>
          <p className="text-sm text-ink-muted mt-1">
            To ensure marine bulletin delivery and alert notifications, please confirm your email address.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-4 rounded-sm bg-risk-safe-bg text-risk-safe border border-risk-safe/30 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Email Verified Successfully</p>
              <p className="text-xs mt-0.5">Redirecting to your marine dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-sm bg-risk-unsafe-bg text-risk-unsafe border border-risk-unsafe/20 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyToken(token);
              }}
              className="flex flex-col gap-3"
            >
              <Input
                label="Verification Token"
                placeholder="Enter token from email"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <Button type="submit" variant="primary" isLoading={isVerifying} disabled={!token.trim()}>
                Verify Email
              </Button>
            </form>

            <div className="pt-6 border-t border-border">
              <h2 className="text-sm font-semibold mb-2">Need a new link?</h2>
              {resendStatus && (
                <p className="text-xs text-ink-muted mb-3 bg-surface-raised p-2 rounded-sm border border-border">
                  {resendStatus}
                </p>
              )}
              <form onSubmit={handleResend} className="flex flex-col gap-3">
                <Input
                  label="Email for resend"
                  type="email"
                  placeholder="captain@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  isLoading={isResending}
                  disabled={!resendEmail.trim() || cooldown > 0}
                >
                  {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend Verification Email"}
                </Button>
              </form>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-ink-muted">
          <Link to="/login" className="text-primary hover:underline">
            Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
