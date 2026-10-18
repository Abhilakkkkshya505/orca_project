import { createBrowserRouter } from "react-router-dom";
import { LandingPage } from "@/routes/landing";
import { LoginPage } from "@/routes/login";
import { SignupPage } from "@/routes/signup";
import { VerifyEmailPage } from "@/routes/verify-email";
import { ForgotPasswordPage } from "@/routes/forgot-password";
import { ResetPasswordPage } from "@/routes/reset-password";
import { ExplorePage } from "@/routes/explore";
import {
  DashboardPage,
  LocationsPage,
  AdvisoriesPage,
  SettingsPage,
  PrivacyPage,
  TermsPage,
  AccessibilityPage,
  NotFoundPage,
} from "@/routes/index";
import { RequireAuth } from "@/features/auth/RequireAuth";

export const router = createBrowserRouter([
  // Public Routes
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/explore", element: <ExplorePage /> },
  { path: "/privacy", element: <PrivacyPage /> },
  { path: "/terms", element: <TermsPage /> },
  { path: "/accessibility", element: <AccessibilityPage /> },

  // Protected Routes
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <DashboardPage />
      </RequireAuth>
    ),
  },
  {
    path: "/locations",
    element: (
      <RequireAuth>
        <LocationsPage />
      </RequireAuth>
    ),
  },
  {
    path: "/advisories",
    element: (
      <RequireAuth>
        <AdvisoriesPage />
      </RequireAuth>
    ),
  },
  {
    path: "/settings",
    element: (
      <RequireAuth>
        <SettingsPage />
      </RequireAuth>
    ),
  },

  // 404 Catch-All
  { path: "*", element: <NotFoundPage /> },
]);
