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
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useMe, useLogout } from "@/features/auth/useMe";
import { useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import PlinthTally from "@/components/originkit/ui/plinth-tally";

export const Navbar: React.FC = () => {
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

  const navLinks = [
    { label: "My Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Explore Map", href: "/explore", icon: Compass },
    { label: "Ports Directory", href: "/ports", icon: MapPin },
    { label: "Vessel Risk", href: "/compare", icon: Ship },
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
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ease-out ${
        isScrolled
          ? "border-b border-border/80 bg-surface/90 backdrop-blur-md shadow-xs"
          : "border-b border-border/40 bg-surface/75 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Ocean Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-1 -ml-1"
          aria-label="ORCA Home"
        >
          <div className="h-7 w-7 rounded-md bg-surface-raised text-ink border border-border flex items-center justify-center shrink-0">
            <Anchor className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <PlinthTally
                text="ORCA"
                size="sm"
                depth={4}
                tiltIntensity={10}
                glow={false}
                interactive={true}
                staggerHover={false}
              />
              <span className="h-1.5 w-1.5 rounded-full bg-forest dark:bg-sage" />
            </div>
            <span className="text-[9px] font-mono text-ink-muted leading-none tracking-wider uppercase font-semibold">
              Ocean Intelligence • SDG 14
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

        {/* Right CTA / Auth Controls + Theme Toggle */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* My Dashboard Direct Action Button */}
          <Link
            to="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-surface-raised border border-border text-ink hover:border-ink transition-colors"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-forest dark:text-sage" />
            <span>My Dashboard</span>
          </Link>

          {/* Theme Toggle (Sun / Moon) */}
          <ThemeToggle />

          {user ? (
            /* Authenticated User Menu */
            <div className="relative" ref={dropdownRef}>
              <button
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
                    <span>Command Dashboard</span>
                  </Link>
                  <Link
                    to="/locations"
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-surface-raised transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>Saved Locations</span>
                  </Link>
                  <Link
                    to="/alerts"
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-surface-raised transition-colors"
                  >
                    <Bell className="h-3.5 w-3.5 text-primary" />
                    <span>Alert Rules</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-surface-raised transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-primary" />
                    <span>Account Settings</span>
                  </Link>

                  <div className="border-t border-border my-1" />

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 w-full text-left transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
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
                className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/explore"
                className="btn-editorial-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold"
              >
                <span>Launch App</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-ink bg-surface"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-border bg-surface px-4 py-4 flex flex-col gap-3">
          <nav className="flex flex-col gap-1">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                  location.pathname === item.href
                    ? "bg-surface-raised text-ink font-semibold"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-ink bg-surface-raised flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                  <span>Command Dashboard</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  className="btn-ocean-secondary text-center py-2 text-xs font-semibold rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/explore"
                  className="btn-ocean-primary text-center py-2 text-xs font-semibold rounded-lg"
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

export default Navbar;
