import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ConsentBanner } from "./ConsentBanner";

/** Root layout — delivers unified sticky SaaS navbar, footer, and consent banner */
export const RootLayout: React.FC = () => {
  const location = useLocation();

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
    <div className="min-h-screen flex flex-col bg-bg text-ink selection:bg-primary/20 selection:text-primary">
      {!isDedicatedAppShell && !isExplore && <Navbar />}
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
      {!isDedicatedAppShell && !isExplore && !isAuth && <Footer />}
      <ConsentBanner />
    </div>
  );
};
