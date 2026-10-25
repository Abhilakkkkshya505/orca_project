import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { LandingPage } from "@/routes/landing";
import { LoginPage } from "@/routes/login";
import { SignupPage } from "@/routes/signup";
import { VerifyEmailPage } from "@/routes/verify-email";
import { ForgotPasswordPage } from "@/routes/forgot-password";
import { ResetPasswordPage } from "@/routes/reset-password";
import { ExplorePage } from "@/routes/explore";
import { PortsPage } from "@/routes/ports";
import { PortDetailPage } from "@/routes/port-detail";
import { ComparePage } from "@/routes/compare";
import { HowItWorksPage } from "@/routes/how-it-works";
import { AboutPage } from "@/routes/about";
import { StatusPage } from "@/routes/status";
import { GamePage } from "@/routes/game";
import { OfflinePreviewPage } from "@/routes/offline-preview";
import { ErrorPage } from "@/routes/error";
import { DashboardPage } from "@/routes/dashboard";
import { LocationsPage } from "@/routes/locations";
import { AlertsPage } from "@/routes/alerts";
import { AdvisoriesPage } from "@/routes/advisories";
import { SettingsPage } from "@/routes/settings";
import { PrivacyPage } from "@/routes/privacy";
import { TermsPage } from "@/routes/terms";
import { CookiePolicyPage } from "@/routes/cookies";
import { ContactPage } from "@/routes/contact";
import { HelpPage } from "@/routes/help";
import { CareersPage } from "@/routes/careers";
import { BlogPage } from "@/routes/blog";
import { AccessibilityPage } from "@/routes/accessibility";
import { NotFoundPage } from "@/routes/not-found";
import { RequireAuth } from "@/features/auth/RequireAuth";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      // Public Routes
      { path: "/", element: <LandingPage /> },
      { path: "/explore", element: <ExplorePage /> },
      { path: "/ports", element: <PortsPage /> },
      { path: "/ports/:slug", element: <PortDetailPage /> },
      { path: "/compare", element: <ComparePage /> },
      { path: "/how-it-works", element: <HowItWorksPage /> },
      { path: "/methodology", element: <HowItWorksPage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/status", element: <StatusPage /> },
      { path: "/privacy", element: <PrivacyPage /> },
      { path: "/terms", element: <TermsPage /> },
      { path: "/cookies", element: <CookiePolicyPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/faq", element: <HelpPage /> },
      { path: "/help", element: <HelpPage /> },
      { path: "/careers", element: <CareersPage /> },
      { path: "/blog", element: <BlogPage /> },
      { path: "/accessibility", element: <AccessibilityPage /> },
      { path: "/game", element: <GamePage /> },
      { path: "/offline-preview", element: <OfflinePreviewPage /> },
      { path: "/error", element: <ErrorPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },

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
        path: "/alerts",
        element: (
          <RequireAuth>
            <AlertsPage />
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
    ],
  },
]);
