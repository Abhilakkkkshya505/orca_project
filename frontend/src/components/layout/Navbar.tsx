import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Anchor,
  Compass,
  MapPin,
  Ship,
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
  ShieldCheck,
  Radio,
} from "lucide-react";
import { useMe, useLogout } from "@/features/auth/useMe";
import { useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { useTranslation } from "react-i18next";
import NeonGlowButton from "@/components/originkit/ui/neon-glow-button";

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { data: user } = useMe();
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Smooth scroll listener throttled with requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 16);
          ticking = false;
        });
        ticking = true;
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navLinks = [
    { label: t("nav.explore", "Explore Map"), href: "/explore", icon: Compass },
    { label: t("nav.ports", "Ports Directory"), href: "/ports", icon: MapPin },
    { label: t("nav.risk", "Vessel Risk"), href: "/compare", icon: Ship },
    { label: t("nav.methodology", "Methodology"), href: "/how-it-works", icon: HelpCircle },
    { label: t("nav.about", "About"), href: "/about" },
    {
      label: t("nav.status", "System Status"),
      href: "/status",
      icon: Activity,
      badge: t("nav.live", "Live"),
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
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-250 ease-out ${
        isScrolled
          ? "border-b border-border/80 bg-surface/90 backdrop-blur-md shadow-xs"
          : "border-b border-border/40 bg-surface/75 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Ocean Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-1 -ml-1 shrink-0"
          aria-label="ORCA Home"
        >
          <div className="h-8 w-8 rounded-lg bg-surface-raised text-ink border border-border group-hover:border-primary/50 group-hover:text-primary flex items-center justify-center shrink-0 transition-colors shadow-xs">
            <Anchor className="h-4 w-4" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-base tracking-tight text-ink leading-tight">
                ORCA
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                SDG 14
              </span>
            </div>
            <span className="text-[9px] font-mono text-ink-muted leading-tight tracking-wider uppercase font-medium whitespace-nowrap hidden xs:inline-block">
              Marine Intelligence & Safety
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (>= lg: 1024px) */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "text-ink font-semibold bg-surface-raised border border-border"
                    : "text-ink-muted hover:text-ink hover:bg-surface-raised"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {item.label}
                  {item.badge && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      {item.badge}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Controls (>= lg) */}
        <div className="hidden lg:flex items-center gap-2.5">
          {user ? (
            <NeonGlowButton
              to="/dashboard"
              variant="cyan"
              size="sm"
              icon={<LayoutDashboard className="h-3.5 w-3.5" />}
            >
              {t("nav.dashboard", "My Dashboard")}
            </NeonGlowButton>
          ) : (
            <NeonGlowButton
              to="/explore"
              variant="cyan"
              size="sm"
              icon={<Compass className="h-3.5 w-3.5" />}
            >
              {t("nav.explore", "Launch App")}
            </NeonGlowButton>
          )}

          {/* Language Selector */}
          <LanguageSelector variant="button" />

          {/* Theme Toggle (Sun / Moon) */}
          <ThemeToggle />

          {user ? (
            /* Authenticated User Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg bg-surface border border-border hover:border-border-strong transition-all text-left"
                aria-label="User navigation menu"
              >
                <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                  {user.display_name ? user.display_name.charAt(0) : <User className="h-3.5 w-3.5" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-ink leading-tight truncate max-w-[120px]">
                    {user.display_name || "Captain"}
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted leading-tight">
                    {user.default_vessel_class === "mechanised" ? "Mechanised" : "Small Craft"}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-ink-muted" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface border border-border shadow-overlay p-1.5 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-xs font-bold text-ink truncate">{user.display_name}</p>
                    <p className="text-[11px] font-mono text-ink-muted truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Verified Mariner</span>
                    </div>
                  </div>

                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-surface-raised transition-colors"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                    <span>{t("nav.dashboard", "Command Dashboard")}</span>
                  </Link>
                  <Link
                    to="/locations"
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-surface-raised transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{t("nav.locations", "Saved Locations")}</span>
                  </Link>
                  <Link
                    to="/alerts"
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-surface-raised transition-colors"
                  >
                    <Bell className="h-3.5 w-3.5 text-primary" />
                    <span>{t("nav.alerts", "Alert Rules")}</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-surface-raised transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-primary" />
                    <span>{t("nav.settings", "Account Settings")}</span>
                  </Link>

                  <div className="border-t border-border my-1" />

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 w-full text-left transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{t("nav.signOut", "Sign Out")}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
            >
              {t("nav.signIn", "Sign In")}
            </Link>
          )}
        </div>

        {/* Mobile / Tablet Header Controls (< lg) */}
        <div className="flex lg:hidden items-center gap-2">
          <LanguageSelector variant="button" />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-border text-ink hover:bg-surface-raised active:scale-95 transition-all shadow-xs"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-in Navigation Drawer (< lg) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Body */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm bg-surface border-l border-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-raised/40">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-surface text-ink border border-border flex items-center justify-center">
                  <Anchor className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="font-heading font-extrabold text-sm tracking-tight text-ink">
                  ORCA Navigation
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Quick Snapshot if logged in */}
            {user && (
              <div className="p-3 mx-3 mt-3 rounded-xl bg-surface-raised border border-border flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                  {user.display_name ? user.display_name.charAt(0) : "C"}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-ink truncate leading-tight">
                    {user.display_name || "Captain"}
                  </p>
                  <p className="text-[10px] font-mono text-ink-muted truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Links with large 48px touch targets */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-left">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-muted font-bold">
                Platform Sections
              </div>
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`min-h-[48px] px-3.5 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors ${
                      isActive
                        ? "bg-primary text-white shadow-xs"
                        : "text-ink hover:bg-surface-raised text-ink-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-primary"}`} />}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Dedicated App Shell links if logged in */}
              {user && (
                <>
                  <div className="px-3 pt-3 pb-1 text-[10px] font-mono uppercase tracking-wider text-ink-muted font-bold">
                    Captain Bridge
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[48px] px-3.5 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 text-ink hover:bg-surface-raised transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                    <span>{t("nav.dashboard", "Command Dashboard")}</span>
                  </Link>
                  <Link
                    to="/locations"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[48px] px-3.5 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 text-ink hover:bg-surface-raised transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{t("nav.locations", "Saved Waypoints")}</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[48px] px-3.5 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 text-ink hover:bg-surface-raised transition-colors"
                  >
                    <Settings className="h-4 w-4 text-primary" />
                    <span>{t("nav.settings", "Vessel Settings")}</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Emergency Advisory Pill */}
            <div className="p-3 mx-3 mb-2 rounded-xl bg-surface-raised border border-border flex items-start gap-2.5 text-left">
              <Radio className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight text-ink-secondary space-y-0.5">
                <span className="font-bold text-ink block">VHF Channel 16 Active</span>
                <span className="text-[10px]">Coast Guard Toll-Free: <strong>1554</strong></span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border bg-surface-raised/40 space-y-2">
              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t("nav.signOut", "Sign Out of Bridge")}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] flex items-center justify-center text-center py-2.5 px-3 text-xs font-bold rounded-xl bg-surface border border-border text-ink hover:bg-surface-raised transition-colors shadow-xs"
                  >
                    {t("nav.signIn", "Sign In")}
                  </Link>
                  <Link
                    to="/explore"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] flex items-center justify-center text-center py-2.5 px-3 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors shadow-xs"
                  >
                    {t("nav.explore", "Launch App")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
