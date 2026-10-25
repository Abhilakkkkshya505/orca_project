import React, { useState } from "react";
import {
  Mail,
  MapPin,
  Radio,
  Send,
  MessageSquare,
  LifeBuoy,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export const ContactPage: React.FC = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    vesselOrPort: "",
    category: "telemetry",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Dispatch received! Our coastal operations team will respond shortly.");
    }, 800);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 text-left space-y-12">
      {/* Title Header */}
      <div className="space-y-3 pb-6 border-b border-border">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono uppercase tracking-wider">
          <MessageSquare className="h-4 w-4" />
          <span>Coastal Operations Dispatch</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-bold tracking-tight text-ink">
          Contact the Ocean Team
        </h1>
        <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-2xl">
          Whether you are a harbor master, artisanal cooperative captain, or marine researcher, our engineering and oceanography team is here to assist.
        </p>
      </div>

      {/* Emergency Warning Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 text-xs text-amber-900 dark:text-amber-200">
        <Radio className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <p className="font-bold uppercase tracking-wider font-mono">
            Active Distress Notice — Do Not Use This Form for Sea Emergencies
          </p>
          <p className="leading-relaxed">
            If a vessel is in imminent distress, capsize hazard, or medical emergency, immediately transmit mayday on <strong>VHF Channel 16 (156.800 MHz)</strong> or contact the <strong>Indian Coast Guard MRCC Emergency Toll-Free Hotline: 1554</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Contact Form (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-card card-hover space-y-6">
          <div className="space-y-1 pb-4 border-b border-border">
            <h2 className="text-xl font-heading font-bold text-ink">Send an Operational Inquiry</h2>
            <p className="text-xs text-ink-muted">Inquiries are logged directly into our engineering triage queue.</p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center space-y-3 animate-in fade-in zoom-in-95">
              <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-emerald-900 dark:text-emerald-100">
                Message Dispatched to Ocean Operations
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-sm mx-auto leading-relaxed">
                Thank you, Captain {formData.name || "Mariner"}. Our oceanography team monitors dispatches 24/7 and will reply to <span className="font-mono font-semibold">{formData.email}</span>.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink">Your Full Name / Rank</label>
                  <input
                    type="text"
                    required
                    placeholder="Capt. Vikram Menon"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-xs text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="captain@sagar.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-xs text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink">Vessel Name or Port Sector</label>
                  <input
                    type="text"
                    placeholder="e.g. Kochi Harbour / FRP Skiff"
                    value={formData.vesselOrPort}
                    onChange={(e) => setFormData({ ...formData, vesselOrPort: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-xs text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink">Inquiry Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="telemetry">Live Wave / Telemetry Inquiry</option>
                    <option value="port">Port Sensor Integration</option>
                    <option value="api">Enterprise API &amp; Vessel Fleet Access</option>
                    <option value="research">Academic / SDG 14 Partnership</option>
                    <option value="bug">Bug Report / Technical Issue</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Operational Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail your inquiry, coastal location, or platform feedback..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-xs text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 font-bold shadow-md flex items-center justify-center gap-2"
                isLoading={loading}
              >
                <Send className="h-4 w-4" />
                <span>Transmit Inquiry to ORCA Bridge</span>
              </Button>
            </form>
          )}
        </div>

        {/* Operating Stations & Information (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Operations Hubs */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="font-heading font-bold text-base text-ink flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Coastal Operational Stations
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-1">
                <span className="font-bold text-ink">Kochi Marine Station (Arabian Sea Sector)</span>
                <p className="text-ink-muted font-mono text-[11px]">Cochin Fisheries Harbour, Thoppumpady, Kerala 682005</p>
                <p className="text-[11px] text-primary font-semibold">Coordinates: 9.9312°N, 76.2673°E</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-1">
                <span className="font-bold text-ink">Academic Research Headquarters</span>
                <p className="text-ink-muted font-mono text-[11px]">Bennett University, Times of India Group, Greater Noida, UP 201310</p>
                <p className="text-[11px] text-primary font-semibold">Sustainability Engineering Laboratory (SDG 14)</p>
              </div>
            </div>
          </div>

          {/* Direct Electronic Dispatch */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="font-heading font-bold text-base text-ink flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-primary" />
              Direct Electronic Dispatch
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-ink-muted font-semibold block">Email Dispatch</span>
                  <a href="mailto:orca.marine.sdg14@gmail.com" className="font-semibold text-ink hover:text-primary transition-colors font-mono">
                    orca.marine.sdg14@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-ink-muted font-semibold block">Response Time SLA</span>
                  <span className="font-semibold text-ink">&lt; 4 Hours for Coastal Safety Queries</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
