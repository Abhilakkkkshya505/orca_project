import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Anchor,
  Compass,
  Ship,
  MapPin,
  HelpCircle,
  Activity,
  Menu,
  X,
  User,
  LayoutDashboard,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useMe, useLogout } from "@/features/auth/useMe";
import { useToast } from "@/components/ui/toast";

export const Navbar: React.FC = () => {
  const { data: user } = useMe();
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: "Explore Map", href: "/explore", icon: Compass },
    { label: "Ports Directory", href: "/ports", icon: MapPin },
    { label: "Vessel Compare", href: "/compare", icon: Ship },
    { label: "Methodology", href: "/how-it-works", icon: HelpCircle },
    { label: "About", href: "/about" },
    {
      label: "System Status",
      href: "/status",
      icon: Activity,
      badge: "Live",
    },
  ];

  const handleSignOut = async () => {
    try {
      await logout.mutateAsync();
      toast.success("Signed out successfully. Fair winds!");
      navigate("/");
    } catch {
      toast.error("Sign out failed. Please try again.");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-surface/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1 -ml-1"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-cyan-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <Anchor className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading font-bold text-lg leading-tight tracking-tight text-ink group-hover:text-primary transition-colors">
              ORCA
            </span>
            <span className="text-[10px] font-mono text-ink-muted leading-none tracking-wider uppercase font-semibold">
              Marine AI • SDG 14
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
                  isActive
                    ? "text-primary bg-primary/10 font-bold"
                    : "text-ink-muted hover:text-ink hover:bg-surface-raised"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {item.label}
                  {item.badge && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {item.badge}
                    </span>
                  )}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / Auth Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            /* Authenticated User Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-surface-raised border border-border hover:border-primary/50 shadow-sm transition-all text-left"
                aria-label="User navigation menu"
              >
                <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user.display_name ? user.display_name.charAt(0) : <User className="h-4 w-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-ink leading-tight truncate max-w-[120px]">
                    {user.display_name || "Captain"}
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted leading-tight">
                    {user.default_vessel_class === "mechanised" ? "Mechanised" : "Small Craft"}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface/95 backdrop-blur-md border border-border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-border/60 mb-1">
                    <p className="text-xs font-bold text-ink truncate">{user.display_name}</p>
                    <p className="text-[11px] font-mono text-ink-muted truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Verified Mariner</span>
                    </div>
                  </div>

                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-raised transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                    <span>Command Dashboard</span>
                  </Link>
                  <Link
                    to="/locations"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-raised transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Saved Locations</span>
                  </Link>
                  <Link
                    to="/alerts"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-raised transition-colors"
                  >
                    <Bell className="h-4 w-4 text-primary" />
                    <span>Alert Rules</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-raised transition-colors"
                  >
                    <Settings className="h-4 w-4 text-primary" />
                    <span>Account Settings</span>
                  </Link>

                  <div className="border-t border-border/60 my-1" />

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 w-full text-left transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated CTA Buttons */
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Launch App</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-surface px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-1">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-ink-muted hover:text-ink hover:bg-surface-raised"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border pt-3">
            {user ? (
              <div className="space-y-2">
                <div className="px-3.5 py-2 bg-surface-raised rounded-xl border border-border">
                  <p className="text-xs font-bold text-ink">{user.display_name}</p>
                  <p className="text-[11px] font-mono text-ink-muted">{user.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/dashboard"
                    className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-center text-xs font-bold text-primary"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/settings"
                    className="p-2.5 rounded-xl bg-surface-raised border border-border text-center text-xs font-semibold text-ink"
                  >
                    Settings
                  </Link>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-center text-xs font-semibold text-red-600 dark:text-red-400"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  className="w-full py-2.5 rounded-xl border border-border bg-surface-raised text-center text-xs font-semibold text-ink"
                >
                  Sign In
                </Link>
                <Link
                  to="/explore"
                  className="w-full py-2.5 rounded-xl bg-primary text-white text-center text-xs font-bold shadow-md"
                >
                  Launch App
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
