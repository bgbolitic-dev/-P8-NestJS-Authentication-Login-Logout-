"use client";

import { useEffect, useState } from "react";
import { Building2, DoorOpen, FileText, Users, Wallet, Wrench } from "lucide-react";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/card";

// NEW FILE: the landlord's stat cards, loaded from GET /landlords/me/stats

interface Stats {
  total_units: number;
  occupied: number;
  available: number;
  under_maintenance: number;
  active_leases: number;
  rent_collected: number;
  open_requests: number;
}

const formatMoney = (v: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(v);

export function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient<Stats>(`${CONFIG.ENDPOINTS.LANDLORDS}/me/stats`, { requiresAuth: true })
      .then(setStats)
      .catch((err: any) => setError(err.message || "Could not load your numbers."));
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!stats) return <p className="text-sm text-neutral-400">Loading your numbers...</p>;

  const occupancy =
    stats.total_units > 0
      ? `${Math.round((stats.occupied / stats.total_units) * 100)}% occupancy`
      : "No units yet";

  const cards = [
    { label: "Total units", value: String(stats.total_units), note: `${stats.under_maintenance} under maintenance`, icon: Building2 },
    { label: "Occupied", value: String(stats.occupied), note: occupancy, icon: Users },
    { label: "Available", value: String(stats.available), note: "Ready to rent", icon: DoorOpen },
    { label: "Active leases", value: String(stats.active_leases), note: "Currently running", icon: FileText },
    { label: "Rent collected", value: formatMoney(stats.rent_collected), note: "This month", icon: Wallet },
    { label: "Open requests", value: String(stats.open_requests), note: "Not yet resolved", icon: Wrench },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ label, value, note, icon: Icon }) => (
        <Card key={label} className="rounded-xl">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}