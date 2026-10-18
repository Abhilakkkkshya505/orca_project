import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ensureCsrfToken } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { useMe } from "@/features/auth/useMe";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  changePasswordSchema,
  profileSettingsSchema,
  type ChangePasswordInput,
  type ProfileSettingsInput,
} from "@/lib/schemas/auth";
import { CheckCircle2, AlertCircle, Shield, User as UserIcon, Trash2 } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { data: user } = useMe();
  const queryClient = useQueryClient();

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 1. Profile Settings Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { isSubmitting: isProfileSubmitting },
  } = useForm<ProfileSettingsInput>({
    resolver: zodResolver(profileSettingsSchema),
    values: {
      display_name: user?.display_name || "",
      preferred_units: user?.preferred_units || "metric",
      default_vessel_class: user?.default_vessel_class || "small_craft",
    },
  });

  const onUpdateProfile = async (values: ProfileSettingsInput) => {
    setProfileSuccess(false);
    setProfileError(null);
    try {
      await ensureCsrfToken();
      await api.patch("/auth/me/", values);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setProfileSuccess(true);
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile settings.");
    }
  };

  // 2. Change Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onUpdatePassword = async (values: ChangePasswordInput) => {
    setPasswordSuccess(false);
    setPasswordError(null);
    try {
      await ensureCsrfToken();
      await api.post("/auth/password-change/", values);
      setPasswordSuccess(true);
      resetPasswordForm();
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    }
  };

  // 3. Delete Account Mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await ensureCsrfToken();
      await api.post("/auth/delete-account/", { confirm: true });
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (err: ApiError) => {
      setDeleteError(err.message || "Account deletion failed.");
    },
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-8 max-w-3xl text-left">
        {/* Header */}
        <div className="pb-4 border-b border-border">
          <h1 className="text-2xl font-semibold">Account & Operational Settings</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Configure default marine units, vessel categories, security, and data preferences.
          </p>
        </div>

        {/* 1. Profile & Vessel Preferences */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border font-semibold text-base text-ink">
            <UserIcon className="h-5 w-5 text-primary" />
            <span>Profile & Navigation Defaults</span>
          </div>

          {profileSuccess && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded bg-risk-safe-bg text-risk-safe border border-risk-safe/30 text-xs">
              <CheckCircle2 className="h-4 w-4" />
              <span>Preferences saved successfully.</span>
            </div>
          )}

          {profileError && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded bg-risk-unsafe-bg text-risk-unsafe border border-risk-unsafe/20 text-xs">
              <AlertCircle className="h-4 w-4" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="flex flex-col gap-4">
            <Input
              label="Display Name / Vessel Call Sign"
              {...registerProfile("display_name")}
            />

            <div>
              <label className="text-sm font-medium text-ink block mb-1.5">
                Preferred Marine Units
              </label>
              <select
                {...registerProfile("preferred_units")}
                className="w-full h-11 px-3 py-2 text-sm bg-surface-raised border border-border-strong rounded text-ink focus-visible:outline-focus"
              >
                <option value="metric">Metric (Meters, km/h, °C)</option>
                <option value="knots">Nautical (Knots, Meters, °C)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-ink block mb-1.5">
                Default Vessel Category
              </label>
              <select
                {...registerProfile("default_vessel_class")}
                className="w-full h-11 px-3 py-2 text-sm bg-surface-raised border border-border-strong rounded text-ink focus-visible:outline-focus"
              >
                <option value="small_craft">Small Craft (FRP boat, open canoe, artisanal craft)</option>
                <option value="mechanised">Mechanised (Inboard engine trawler, gillnetter)</option>
              </select>
              <p className="text-xs text-ink-muted mt-1">
                Thresholds for wave height and wind speed automatically adjust based on vessel size.
              </p>
            </div>

            <Button type="submit" variant="primary" className="self-start mt-2" isLoading={isProfileSubmitting}>
              Save Preferences
            </Button>
          </form>
        </div>

        {/* 2. Password & Security */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border font-semibold text-base text-ink">
            <Shield className="h-5 w-5 text-primary" />
            <span>Password & Security</span>
          </div>

          {passwordSuccess && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded bg-risk-safe-bg text-risk-safe border border-risk-safe/30 text-xs">
              <CheckCircle2 className="h-4 w-4" />
              <span>Password updated successfully.</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded bg-risk-unsafe-bg text-risk-unsafe border border-risk-unsafe/20 text-xs">
              <AlertCircle className="h-4 w-4" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit(onUpdatePassword)} className="flex flex-col gap-4">
            <Input
              label="Current Password"
              type="password"
              autoComplete="current-password"
              error={passwordErrors.old_password?.message}
              {...registerPassword("old_password")}
            />

            <Input
              label="New Password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 10 characters"
              error={passwordErrors.new_password?.message}
              {...registerPassword("new_password")}
            />

            <Button type="submit" variant="secondary" className="self-start mt-2" isLoading={isPasswordSubmitting}>
              Update Password
            </Button>
          </form>
        </div>

        {/* 3. Danger Zone (Account Deletion) */}
        <div className="bg-surface border border-risk-unsafe/30 rounded-lg p-6 shadow-card">
          <div className="flex items-center gap-2 mb-2 font-semibold text-base text-risk-unsafe">
            <Trash2 className="h-5 w-5" />
            <span>Danger Zone — Delete Account</span>
          </div>
          <p className="text-xs text-ink-muted mb-4">
            Permanently delete your user profile, saved coastal locations, alert subscriptions, and personal chat history under Indian DPDP & GDPR compliance.
          </p>

          {deleteError && (
            <div className="p-3 mb-3 rounded bg-risk-unsafe-bg text-risk-unsafe text-xs">
              {deleteError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Input
              label='Type "DELETE" to confirm permanent erasure'
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
            />
            <Button
              variant="danger"
              className="self-start"
              disabled={deleteConfirmation !== "DELETE"}
              isLoading={deleteAccountMutation.isPending}
              onClick={() => deleteAccountMutation.mutate()}
            >
              Permanently Delete Account
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
