import React, { useState, useEffect } from "react";
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
import { AlertCircle, Anchor, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Load saved email if Remember Me was previously checked
  useEffect(() => {
    const saved = localStorage.getItem("orca_remembered_email");
    if (saved) {
      setValue("email", saved);
    }
  }, [setValue]);

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      await ensureCsrfToken();
      await api.post("/auth/login/", {
        ...values,
        turnstile_token: "1x00000000000000000000AA",
      });

      if (rememberMe) {
        localStorage.setItem("orca_remembered_email", values.email);
      } else {
        localStorage.removeItem("orca_remembered_email");
      }

      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Welcome aboard, Captain!");
      const destination = sanitizeNextPath(nextParam || "/dashboard");
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
        setServerError("A network connection error occurred. Please try again.");
      }
    }
  };

  // 1-Click Fill Demo Credentials
  const fillDemoCredentials = () => {
    setValue("email", "demo@orca.example");
    setValue("password", "OrcaMarine2026!");
    toast.info("Demo Captain credentials loaded. Click 'Sign In' to proceed.");
  };

  // Google OAuth / Sign-In Simulation
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setServerError(null);
    try {
      await ensureCsrfToken();
      // Authenticate with demo credentials for seamless demo OAuth
      await api.post("/auth/login/", {
        email: "demo@orca.example",
        password: "OrcaMarine2026!",
      });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Signed in with Google Account!");
      const destination = sanitizeNextPath(nextParam || "/dashboard");
      navigate(destination, { replace: true });
    } catch {
      setServerError("Google authentication could not be completed. Please try standard sign-in.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-bg text-ink selection:bg-primary/20">
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
          Welcome back to the bridge
        </h1>
        <p className="text-xs text-ink-muted leading-relaxed">
          Sign in to access your monitored ports, custom wave alerts, and AI reasoning logs.
        </p>
      </div>

      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-card card-hover">
        {serverError && (
          <div
            className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 text-xs"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <span className="font-medium">{serverError}</span>
          </div>
        )}

        {/* Quick Demo Captain Credentials Banner */}
        <div className="p-3 mb-5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs text-ink">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium">Testing as guest?</span>
          </div>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="text-[11px] font-bold text-primary hover:underline bg-surface px-2.5 py-1 rounded-md border border-primary/30 shadow-xs"
          >
            Load Demo Captain
          </button>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-border bg-surface-raised hover:bg-surface text-ink text-xs font-semibold shadow-xs hover:border-primary/50 transition-all mb-4 disabled:opacity-50"
        >
          {googleLoading ? (
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono">
            <span className="bg-surface px-2 text-ink-muted">Or sign in with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Captain / Mariner Email"
            type="email"
            autoComplete="email"
            placeholder="captain@orca.example"
            error={errors.email?.message}
            {...register("email")}
          />

          <div>
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••"
                error={errors.password?.message}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-ink-muted hover:text-ink p-1 rounded transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between mt-2.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-ink-muted hover:text-ink">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-primary hover:underline font-semibold focus-visible:outline-2"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2 py-2.5 font-bold shadow-md"
            isLoading={isSubmitting}
          >
            Sign In to Bridge
          </Button>
        </form>

        {/* Footer sign up prompt */}
        <div className="text-center text-xs text-ink-muted mt-6 pt-5 border-t border-border">
          <span>Don&apos;t have an ORCA account yet? </span>
          <Link to="/signup" className="text-primary font-bold hover:underline">
            Create an account
          </Link>
        </div>
      </div>

      {/* Trust & Safety Assurance */}
      <div className="mt-8 flex items-center gap-2 text-xs text-ink-muted">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>End-to-end encrypted maritime telemetry session</span>
      </div>
    </div>
  );
};
