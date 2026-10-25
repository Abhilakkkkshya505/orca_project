import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ConsentBanner } from "./ConsentBanner";
import LiquidFilm from "@/components/originkit/ui/liquid-film";
import { useTheme } from "@/lib/theme/ThemeContext";

/** Root layout — delivers unified sticky SaaS navbar, footer, consent banner, and ambient liquid film background */
export const RootLayout: React.FC = () => {
  const location = useLocation();
  const { resolvedTheme } = useTheme();

  // Landing page has bespoke editorial layout
  const isLanding = location.pathname === "/";

  // Pages with dedicated full-bleed app shells
  const isDedicatedAppShell =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/locations") ||
    location.pathname.startsWith("/alerts") ||
    location.pathname.startsWith("/advisories") ||
    location.pathname.startsWith("/settings");

  // Explore page has its own full-bleed split canvas with custom header
  const isExplore = location.pathname.startsWith("/explore");

  // Auth pages have focused single-card presentation
  const isAuth =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/signup") ||
    location.pathname.startsWith("/forgot-password") ||
    location.pathname.startsWith("/reset-password");

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink selection:bg-primary/20 selection:text-primary relative">
      {/* Originkit Liquid Film Ambient Fluid Background on all non-landing pages */}
      {!isLanding && !isExplore && (
        <div
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30 dark:opacity-40"
          aria-hidden="true"
        >
          <LiquidFilm
            speed={0.6}
            scale={2.2}
            intensity={0.8}
            filmThickness={1.2}
            colorCore={resolvedTheme === "dark" ? "#0284C7" : "#38BDF8"}
            colorFringe={resolvedTheme === "dark" ? "#2DD4BF" : "#0D9488"}
            background="transparent"
            interactive={true}
          />
        </div>
      )}

      {!isDedicatedAppShell && !isExplore && <Navbar />}
      <div className="flex-1 flex flex-col relative z-10">
        <Outlet />
      </div>
      {!isDedicatedAppShell && !isExplore && !isAuth && <Footer />}
      <ConsentBanner />
    </div>
  );
};

