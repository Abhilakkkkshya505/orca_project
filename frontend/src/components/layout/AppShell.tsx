import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Anchor,
  LayoutDashboard,
  MapPin,
  Bell,
  AlertTriangle,
  Compass,
  Settings,
  LogOut,
  Search,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  Radio,
} from "lucide-react";
import { useMe, useLogout } from "@/features/auth/useMe";
import { useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { useTranslation } from "react-i18next";
import LiquidFilm from "@/components/originkit/ui/liquid-film";
import { useTheme } from "@/lib/theme/ThemeContext";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { t } = useTranslation();
  const { data: user } = useMe();
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navItems = [
    { label: t("nav.dashboard", "Dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("nav.locations", "Saved Ports & Waypoints"), href: "/locations", icon: MapPin },
    { label: t("nav.alerts", "Threshold Alert Rules"), href: "/alerts", icon: Bell },
    { label: t("nav.advisories", "Official Advisories"), href: "/advisories", icon: AlertTriangle, badge: t("nav.live", "Live") },
    { label: t("nav.explore", "Interactive Live Map"), href: "/explore", icon: Compass, externalIcon: true },
    { label: t("nav.settings", "Account & Vessel Settings"), href: "/settings", icon: Settings },
  ];

  const notifications = [
    {
      id: "n1",
      title: "INCOIS High Swell Advisory Active",
      desc: "Southern Arabian Sea & Kerala coast Kallakkadal watch in effect.",
      time: "12m ago",
      level: "caution",
    },
    {
      id: "n2",
      title: "Kochi Telemetry Freshness Verified",
      desc: "Significant wave 1.38m, wind gusts 29.5 km/h recorded via Open-Meteo.",
      time: "48m ago",
      level: "safe",
    },
    {
      id: "n3",
      title: "Deterministic Rule Engine Upgraded",
      desc: "Engine 2026.10.0 deployed with WMO small-craft steepness protection.",
      time: "2h ago",
      level: "info",
    },
  ];

  const handleSignOut = async () => {
    try {
      await logout.mutateAsync();
      toast.success("Signed out of bridge. Fair winds, Captain!");
      navigate("/");
    } catch {
      toast.error("Sign out encountered a network issue.");
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex text-left font-sans selection:bg-primary/20 relative">
      {/* Originkit Liquid Film Ambient Fluid Background (desktop only for 60fps mobile scrolling) */}
      <div
        className="hidden md:block fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30 dark:opacity-40"
        aria-hidden="true"
      >
        <LiquidFilm
          speed={0.5}
          scale={2.0}
          intensity={0.75}
          filmThickness={1.1}
          colorCore={resolvedTheme === "dark" ? "#342D66" : "#5A6CB8"}
          colorFringe={resolvedTheme === "dark" ? "#BA7893" : "#FFD5A4"}
          background="transparent"
          interactive={true}
        />
      </div>

      {/* Desktop Sidebar (Linear / Vercel style) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-surface shrink-0 z-30 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-cyan-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <Anchor className="h-4 w-4" />
            </div>
            <div>
              <span className="font-heading font-bold text-base tracking-tight text-ink block leading-tight">
                ORCA Bridge
              </span>
              <span className="text-[10px] font-mono text-ink-muted leading-none uppercase font-semibold">
                Marine SaaS • v2026
              </span>
            </div>
          </Link>
        </div>

        {/* User Mini Capsule */}
        <div className="p-3 mx-3 my-3 rounded-xl bg-surface-raised border border-border flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {user?.display_name ? user.display_name.charAt(0) : "C"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-ink truncate leading-tight">
              {user?.display_name || "Captain's Bridge"}
            </p>
            <p className="text-[10px] font-mono text-ink-muted truncate">
              {user?.default_vessel_class === "mechanised" ? "Mechanised Hull" : "Small Craft (<12m)"}
            </p>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Telemetry Live" />
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 px-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-ink-muted font-bold tracking-wider">
            Maritime Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-white font-bold shadow-xs"
                    : "text-ink-muted hover:text-ink hover:bg-surface-raised"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-primary"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.externalIcon && (
                  <ExternalLink className={`h-3 w-3 ${isActive ? "text-white/80" : "text-ink-muted"}`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Emergency Distress Channel Pill */}
        <div className="p-3 mx-3 mb-3 rounded-xl bg-surface-raised border border-border space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <Radio className="h-3.5 w-3.5 text-rose-500" />
            <span>Emergency Distress</span>
          </div>
          <p className="text-[11px] text-ink-muted leading-tight">
            VHF Channel 16 • Indian Coast Guard Toll-Free: <strong>1554</strong>
          </p>
        </div>

        {/* Bottom User Actions */}
        <div className="p-3 border-t border-border bg-surface-raised/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelector variant="button" />
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="p-2 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* Top Floating App Bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-surface/85 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-3">
          {/* Mobile Menu Button + Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-border text-ink-muted hover:text-ink bg-surface-raised active:scale-95 transition-all shadow-xs"
              aria-label={mobileMenuOpen ? "Close bridge menu" : "Open bridge menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2 font-heading font-bold text-base text-ink">
              <Anchor className="h-4 w-4 text-primary" />
              <span>ORCA</span>
            </Link>
          </div>

          {/* Quick Search Bar */}
          <div className="hidden sm:flex items-center flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Search ports, coastal coordinates, or wave advisories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="w-full pl-10 pr-12 py-2 rounded-xl border border-border bg-surface-raised text-xs text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
            <span className="absolute right-2.5 top-2 px-1.5 py-0.5 rounded text-[10px] font-mono text-ink-muted bg-surface border border-border">
              ↵ Enter
            </span>
          </div>

          {/* Top Header Actions (Right) */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Language Selector */}
            <LanguageSelector variant="button" />

            {/* Theme Switcher Toggle */}
            <ThemeToggle />

            {/* Live Map CTA Button */}
            <Link
              to="/explore"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Live Map</span>
            </Link>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="min-h-[44px] min-w-[44px] relative flex items-center justify-center rounded-xl border border-border bg-surface-raised hover:bg-surface text-ink-muted hover:text-ink transition-colors shadow-xs"
                aria-label="View notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-cyan-500" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-96 rounded-2xl bg-surface border border-border shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-border px-1">
                    <span className="font-heading font-bold text-xs text-ink">Coastal Safety Bulletins</span>
                    <span className="text-[10px] font-mono text-primary font-bold">3 Unread</span>
                  </div>
                  <div className="divide-y divide-border/60 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="py-2.5 px-1 space-y-1 hover:bg-surface-raised rounded-lg transition-colors text-left">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-ink leading-tight">{n.title}</p>
                          <span className="text-[10px] font-mono text-ink-muted">{n.time}</span>
                        </div>
                        <p className="text-xs text-ink-muted leading-relaxed">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-border text-center">
                    <Link
                      to="/advisories"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      View All Maritime Advisories &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="min-h-[44px] flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl border border-border bg-surface-raised hover:border-primary/50 transition-all text-left shadow-xs"
                aria-label="User account menu"
              >
                <div className="h-7 w-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user?.display_name ? user.display_name.charAt(0) : "C"}
                </div>
                <ChevronDown className="h-3 w-3 text-ink-muted" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface border border-border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-border/60 mb-1">
                    <p className="text-xs font-bold text-ink truncate">{user?.display_name || "Captain"}</p>
                    <p className="text-[11px] font-mono text-ink-muted truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-raised"
                  >
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                    <span>Dashboard Home</span>
                  </Link>
                  <Link
                    to="/locations"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-raised"
                  >
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Saved Ports</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-raised"
                  >
                    <Settings className="h-4 w-4 text-primary" />
                    <span>Vessel Preferences</span>
                  </Link>
                  <div className="border-t border-border/60 my-1" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Slide-in Navigation Drawer (< lg) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide Drawer */}
            <div className="fixed inset-y-0 left-0 w-full max-w-xs sm:max-w-sm bg-surface border-r border-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
              {/* Drawer Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-surface-raised/40">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-cyan-700 text-white flex items-center justify-center shadow-xs">
                    <Anchor className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-sm text-ink block leading-tight">
                      ORCA Bridge
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted uppercase">
                      Fleet Operations
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
                  aria-label="Close bridge menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User Mini Capsule */}
              <div className="p-3 mx-3 mt-3 rounded-xl bg-surface-raised border border-border flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {user?.display_name ? user.display_name.charAt(0) : "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-ink truncate leading-tight">
                    {user?.display_name || "Captain's Bridge"}
                  </p>
                  <p className="text-[10px] font-mono text-ink-muted truncate">
                    {user?.default_vessel_class === "mechanised" ? "Mechanised Hull" : "Small Craft (<12m)"}
                  </p>
                </div>
              </div>

              {/* Search Bar inside Drawer */}
              <div className="px-3 pt-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-muted" />
                  <input
                    type="text"
                    placeholder="Search ports or coordinates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        setMobileMenuOpen(false);
                        navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-surface-raised text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Navigation Items (minimum 48px touch targets) */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-ink-muted font-bold tracking-wider">
                  Bridge Navigation
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`min-h-[48px] flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-primary text-white shadow-xs font-bold"
                          : "text-ink hover:text-ink hover:bg-surface-raised"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-primary"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isActive ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                <div className="px-3 pt-3 pb-1 text-[10px] font-mono uppercase text-ink-muted font-bold tracking-wider">
                  Public Directory
                </div>
                <Link
                  to="/ports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[48px] flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-ink hover:bg-surface-raised"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Port Directory</span>
                </Link>
                <Link
                  to="/how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[48px] flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-ink hover:bg-surface-raised"
                >
                  <Anchor className="h-4 w-4 text-primary" />
                  <span>Methodology & Physics</span>
                </Link>
              </nav>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-border bg-surface-raised/40 space-y-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out of Bridge</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
