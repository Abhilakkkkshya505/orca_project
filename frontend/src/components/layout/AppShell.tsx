import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Anchor,
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  Compass,
  Settings,
  LogOut,
} from "lucide-react";
import { useMe, useLogout } from "@/features/auth/useMe";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { data: user } = useMe();
  const logout = useLogout();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Saved Locations", href: "/locations", icon: MapPin },
    { label: "Official Advisories", href: "/advisories", icon: AlertTriangle },
    { label: "Explore Map & Chat", href: "/explore", icon: Compass },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col md:flex-row text-left">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface shrink-0">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <Anchor className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-semibold text-base leading-tight">ORCA</h1>
            <p className="text-[11px] text-ink-muted">Marine Safety Intelligence</p>
          </div>
        </div>

        {/* User Info Capsule */}
        {user && (
          <div className="p-4 border-b border-border bg-surface-raised/50">
            <p className="text-xs font-semibold text-ink truncate">{user.display_name}</p>
            <p className="text-[11px] text-ink-muted truncate font-mono">{user.email}</p>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "text-ink-muted hover:bg-surface-raised hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => logout.mutate()}
            className="flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-risk-unsafe transition-colors w-full px-2 py-1.5 rounded hover:bg-surface-raised"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="md:hidden h-14 border-b border-border bg-surface px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-primary" />
            <span className="font-semibold text-base">ORCA</span>
          </div>
          <button
            onClick={() => logout.mutate()}
            className="text-xs text-ink-muted hover:text-risk-unsafe p-1.5"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden border-t border-border bg-surface px-2 py-1 flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center gap-0.5 p-2 rounded text-[10px] font-medium ${
                  isActive ? "text-primary" : "text-ink-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
