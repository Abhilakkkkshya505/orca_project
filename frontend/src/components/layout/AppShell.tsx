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
  LifeBuoy,
  Menu,
  X,
} from "lucide-react";
import { useMe, useLogout } from "@/features/auth/useMe";
import { useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import LiquidFilm from "@/components/originkit/ui/liquid-film";
import { useTheme } from "@/lib/theme/ThemeContext";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
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

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Saved Ports & Waypoints", href: "/locations", icon: MapPin },
    { label: "Threshold Alert Rules", href: "/alerts", icon: Bell },
    { label: "Official Advisories", href: "/advisories", icon: AlertTriangle, badge: "Live" },
    { label: "Interactive Live Map", href: "/explore", icon: Compass, externalIcon: true },
    { label: "Account & Vessel Settings", href: "/settings", icon: Settings },
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
      {/* Originkit Liquid Film Ambient Fluid Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30 dark:opacity-40"
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

        {/* Sidebar Footer Links */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            to="/help"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
          >
            <LifeBuoy className="h-4 w-4 text-primary" />
            <span>Help Center & FAQ</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 w-full text-left transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        {/* Top Operational Header */}
        <header className="sticky top-0 z-20 h-16 border-b border-border bg-surface/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Mobile Brand & Hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-border bg-surface-raised text-ink"
              aria-label="Open sidebar"
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
          <div className="flex items-center gap-3 ml-auto">
            {/* Theme Switcher Toggle */}
            <ThemeToggle />

            {/* Live Map CTA Button */}
            <Link
              to="/explore"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Live Map Explorer</span>
            </Link>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl border border-border bg-surface-raised hover:bg-surface text-ink-muted hover:text-ink transition-colors shadow-xs"
                aria-label="View notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-cyan-500" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface border border-border shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-border px-1">
                    <span className="font-heading font-bold text-xs text-ink">Coastal Safety Bulletins</span>
                    <span className="text-[10px] font-mono text-primary font-bold">3 Unread</span>
                  </div>
                  <div className="divide-y divide-border/60 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="py-2.5 px-1 space-y-1 hover:bg-surface-raised rounded-lg transition-colors">
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
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-border bg-surface-raised hover:border-primary/50 transition-all text-left shadow-xs"
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

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-border bg-surface px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                    isActive ? "bg-primary text-white" : "text-ink-muted hover:text-ink hover:bg-surface-raised"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && <span className="text-[10px]">{item.badge}</span>}
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
