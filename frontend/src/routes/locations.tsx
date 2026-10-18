import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Plus, Trash2, AlertCircle } from "lucide-react";

interface SavedLocationItem {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind: string;
  created_at: string;
}

interface NewLocationForm {
  name: string;
  lat: number;
  lon: number;
  kind: string;
}

export const LocationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 1. Fetch saved locations
  const { data, isLoading } = useQuery<{ results: SavedLocationItem[]; count: number }>({
    queryKey: ["locations", "list"],
    queryFn: () => api.get<{ results: SavedLocationItem[]; count: number }>("/locations/"),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NewLocationForm>({
    defaultValues: { kind: "harbour", lat: 9.97, lon: 76.24 },
  });

  // 2. Create mutation
  const createMutation = useMutation({
    mutationFn: (newLoc: NewLocationForm) => api.post("/locations/", newLoc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", "list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      setShowAddForm(false);
      reset();
      setFormError(null);
    },
    onError: (err: ApiError) => {
      setFormError(err.message || "Failed to create location.");
    },
  });

  // 3. Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/locations/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", "list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
    },
  });

  const onSubmit = (formData: NewLocationForm) => {
    createMutation.mutate({
      ...formData,
      lat: Number(formData.lat),
      lon: Number(formData.lon),
    });
  };

  const locations = data?.results || [];

  return (
    <AppShell>
      <div className="flex flex-col gap-6 text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Saved Coastal Locations</h1>
            <p className="text-sm text-ink-muted mt-0.5">
              Manage your harbours and regular fishing coordinates (Up to 20 locations).
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            className="gap-2 self-start"
            disabled={locations.length >= 20}
          >
            <Plus className="h-4 w-4" /> Add Location ({locations.length}/20)
          </Button>
        </div>

        {/* Add Location Modal / Drawer */}
        {showAddForm && (
          <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
            <h2 className="text-base font-semibold mb-3">Add New Coastal Waypoint</h2>
            {formError && (
              <div className="p-3 mb-3 rounded bg-risk-unsafe-bg text-risk-unsafe text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Location Name"
                placeholder="e.g. Fort Kochi Outer Anchorage"
                error={errors.name?.message}
                {...register("name", { required: "Name is required", maxLength: 60 })}
              />

              <div>
                <label className="text-sm font-medium text-ink block mb-1.5">Category</label>
                <select
                  {...register("kind")}
                  className="w-full h-11 px-3 py-2 text-sm bg-surface-raised border border-border-strong rounded text-ink focus-visible:outline-focus"
                >
                  <option value="harbour">Harbour / Port</option>
                  <option value="fishing_ground">Fishing Ground</option>
                  <option value="coastal_point">Coastal Point</option>
                  <option value="custom">Custom Waypoint</option>
                </select>
              </div>

              <Input
                label="Latitude (°N)"
                type="number"
                step="0.0001"
                placeholder="9.97"
                {...register("lat", { required: true })}
              />

              <Input
                label="Longitude (°E)"
                type="number"
                step="0.0001"
                placeholder="76.24"
                {...register("lon", { required: true })}
              />

              <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Save Waypoint
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-full rounded" />
            <Skeleton className="h-16 w-full rounded" />
            <Skeleton className="h-16 w-full rounded" />
          </div>
        )}

        {/* Locations List */}
        {!isLoading && locations.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-dashed border-border rounded-lg text-ink-muted">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-primary opacity-60" />
            <p className="font-semibold text-sm text-ink">No saved locations</p>
            <p className="text-xs mt-1">Add your regular harbours to receive condition alerts.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="bg-surface border border-border rounded-lg p-4 shadow-card flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-water text-primary flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-ink">{loc.name}</h3>
                    <p className="text-xs font-mono text-ink-muted">
                      {loc.lat.toFixed(4)}°N, {loc.lon.toFixed(4)}°E • Tag: {loc.kind}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteMutation.mutate(loc.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-ink-muted hover:text-risk-unsafe rounded hover:bg-surface-raised transition-colors"
                    aria-label={`Delete location ${loc.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
