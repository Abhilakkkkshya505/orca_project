import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import { formatDateTime } from "@/lib/format";
import type { RiskLevel } from "@/components/ui/risk-icons";
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  MapPin,
} from "lucide-react";

interface AlertSubscription {
  id: string;
  location: {
    id: string;
    name: string;
    lat: number;
    lon: number;
  };
  min_level: RiskLevel;
  is_active: boolean;
  notify_email: boolean;
  last_notified_at: string | null;
  created_at: string;
}

interface SavedLocationItem {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind: string;
}

export const AlertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedMinLevel, setSelectedMinLevel] = useState<RiskLevel>("caution");

  // 1. Fetch Alert Subscriptions
  const { data: alertsData, isLoading: alertsLoading } = useQuery<{ results: AlertSubscription[] }>({
    queryKey: ["alerts", "subscriptions"],
    queryFn: () => api.get<{ results: AlertSubscription[] }>("/alerts/subscriptions/"),
  });

  // 2. Fetch Saved Locations
  const { data: locationsData } = useQuery<{ results: SavedLocationItem[] }>({
    queryKey: ["locations", "list"],
    queryFn: () => api.get<{ results: SavedLocationItem[] }>("/locations/"),
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/alerts/subscriptions/${id}/`, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", "subscriptions"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/subscriptions/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", "subscriptions"] });
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/alerts/subscriptions/", {
        location_id: selectedLocationId,
        min_level: selectedMinLevel,
        is_active: true,
        notify_email: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", "subscriptions"] });
      setShowCreateModal(false);
      setSelectedLocationId("");
    },
  });

  const subscriptions = alertsData?.results || [];

  return (
    <AppShell>
      <div className="flex flex-col gap-8 text-left max-w-5xl mx-auto">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Automated Safety Alerts
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              Subscribe to automated email and in-app notifications when wave or wind conditions exceed your risk threshold.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> New Alert Rule
          </Button>
        </div>

        {/* Modal for creating rule */}
        {showCreateModal && (
          <div className="p-5 rounded-xl bg-surface border border-primary/40 shadow-card space-y-4 animate-in fade-in duration-200">
            <h3 className="font-semibold text-base text-ink">Create Alert Subscription</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-medium text-ink block mb-1">Select Saved Location:</label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full h-9 px-3 rounded bg-surface-raised border border-border text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose Location --</option>
                  {(locationsData?.results || []).map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-ink block mb-1">Minimum Trigger Level:</label>
                <select
                  value={selectedMinLevel}
                  onChange={(e) => setSelectedMinLevel(e.target.value as RiskLevel)}
                  className="w-full h-9 px-3 rounded bg-surface-raised border border-border text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="caution">Caution (Triggers on Caution or Unsafe)</option>
                  <option value="unsafe">Unsafe Only (Severe Storms / Gale alerts)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button size="sm" variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={!selectedLocationId || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                isLoading={createMutation.isPending}
              >
                Create Alert
              </Button>
            </div>
          </div>
        )}

        {/* List of subscriptions */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-surface-raised border-b border-border flex items-center justify-between text-xs font-mono font-semibold uppercase text-ink">
            <span>Configured Subscriptions ({subscriptions.length})</span>
          </div>

          <div className="divide-y divide-border">
            {alertsLoading ? (
              <div className="p-8 text-center text-xs text-ink-muted">
                Loading alert rules...
              </div>
            ) : subscriptions.length > 0 ? (
              subscriptions.map((sub) => (
                <div key={sub.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm text-ink">{sub.location.name}</h4>
                      <RiskBadge level={sub.min_level} size="sm" />
                    </div>
                    <p className="text-xs text-ink-muted">
                      Trigger on <strong>{sub.min_level.toUpperCase()}</strong> or worse • Email notifications active
                    </p>
                    <p className="text-[11px] font-mono text-ink-muted">
                      Last notification: {sub.last_notified_at ? formatDateTime(sub.last_notified_at) : "Never triggered"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleMutation.mutate({ id: sub.id, is_active: !sub.is_active })}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        sub.is_active
                          ? "bg-risk-safe-bg text-risk-safe hover:bg-risk-safe-bg/80"
                          : "bg-surface-raised text-ink-muted hover:bg-border"
                      }`}
                    >
                      {sub.is_active ? "Enabled" : "Disabled"}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(sub.id)}
                      className="p-1.5 rounded text-ink-muted hover:text-risk-unsafe hover:bg-surface-raised"
                      aria-label="Delete alert rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-ink-muted space-y-2">
                <BellOff className="h-8 w-8 mx-auto text-ink-muted/50" />
                <p className="font-semibold text-ink">No automated alert rules yet.</p>
                <p>Add a rule above to monitor your favorite harbours for storm squalls and swell surges.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};
