"use client";

import { useEffect, useState } from "react";
import { Building2, DoorOpen, FileText, Users, Wallet, Wrench } from "lucide-react";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const E = CONFIG.ENDPOINTS;

interface Stats {
  total_units: number;
  occupied: number;
  available: number;
  under_maintenance: number;
  active_leases: number;
  rent_collected: number;
  open_requests: number;
}

interface IncomeRow {
  month: string;
  total: number;
}

interface Payment {
  payment_id: number;
  unit_number: string;
  property_name: string;
  tenant_first_name: string;
  tenant_last_name: string;
  payment_date: string;
  amount_paid: string;
  payment_status: string;
}

interface MaintenanceRequest {
  request_id: number;
  unit_number: string;
  property_name: string;
  tenant_first_name: string;
  tenant_last_name: string;
  descriptionx: string;
  priority: string;
  statusx: string;
}

const formatMoney = (v: number | string) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(v));

const formatDate = (v: string) =>
  new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const badgeVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "Paid" || s === "Resolved") return "default";
  if (s === "In Progress") return "secondary";
  if (s === "Late" || s === "High") return "destructive";
  return "outline";
};

export function Overview({ landlordId }: { landlordId: number }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [income, setIncome] = useState<IncomeRow[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [error, setError] = useState("");

  // loads the four things the Overview needs, all at once
  useEffect(() => {
    const q = `?landlord_id=${landlordId}`;
    Promise.all([
      apiClient<Stats>(`${E.LANDLORDS}/me/stats`, { requiresAuth: true }),
      apiClient<IncomeRow[]>(`${E.LANDLORDS}/me/income`, { requiresAuth: true }),
      apiClient<Payment[]>(`${E.RENT_PAYMENTS}${q}`, { requiresAuth: true }),
      apiClient<MaintenanceRequest[]>(`${E.MAINTENANCE_REQUESTS}${q}`, { requiresAuth: true }),
    ])
      .then(([s, i, p, r]) => {
        setStats(s);
        setIncome(Array.isArray(i) ? i : []);
        setPayments(Array.isArray(p) ? p : []);
        setRequests(Array.isArray(r) ? r : []);
      })
      .catch((err: any) => setError(err.message || "Could not load your numbers."));
  }, [landlordId]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!stats) return <p className="text-sm text-muted-foreground">Loading your numbers...</p>;

  const occupancy = stats.total_units > 0 ? stats.occupied / stats.total_units : 0;
  const occupancyPct = Math.round(occupancy * 100);

  // the last 6 months, with 0 for months that have no payments
  const months = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - idx));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      total: income.find((i) => i.month === key)?.total ?? 0,
      current: idx === 5,
    };
  });
  const maxTotal = Math.max(...months.map((m) => m.total), 1);

  // the occupancy ring is a circle whose outline is only partly drawn
  const RADIUS = 48;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const cards = [
    { label: "Rent collected", value: formatMoney(stats.rent_collected), note: "This month", icon: Wallet, hero: true },
    { label: "Occupied units", value: String(stats.occupied), note: `${occupancyPct}% occupancy`, icon: Users, hero: false },
    { label: "Active leases", value: String(stats.active_leases), note: "Currently running", icon: FileText, hero: false },
    { label: "Total units", value: String(stats.total_units), note: `${stats.under_maintenance} under maintenance`, icon: Building2, hero: false },
    { label: "Available", value: String(stats.available), note: "Ready to rent", icon: DoorOpen, hero: false },
    { label: "Open requests", value: String(stats.open_requests), note: "Not yet resolved", icon: Wrench, hero: false },
  ];

  const openRequests = requests.filter((r) => r.statusx !== "Resolved").slice(0, 5);
  const recentPayments = payments.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Row 1: the six stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, note, icon: Icon, hero }) => (
          <Card
            key={label}
            className={`rounded-2xl ${hero ? "border-transparent bg-primary text-primary-foreground" : ""}`}
          >
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className={`text-sm ${hero ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {label}
                </p>
                <span
                  className={`flex size-9 items-center justify-center rounded-xl ${
                    hero ? "bg-white/20" : "bg-accent text-primary"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="text-3xl font-semibold tracking-tight">{value}</p>
              <p className={`text-xs ${hero ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {note}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: bar chart + occupancy ring */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Rent collected</CardTitle>
            <CardDescription>Paid rent per month, last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-52 items-end gap-3">
              {months.map((m) => (
                <div
                  key={m.key}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  title={`${m.label}: ${formatMoney(m.total)}`}
                >
                  {m.current && m.total > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                      {formatMoney(m.total)}
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t-xl ${m.current ? "bg-primary" : "bg-primary/25"}`}
                    style={{ height: `${Math.max((m.total / maxTotal) * 80, 3)}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Occupancy</CardTitle>
            <CardDescription>How full your units are</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5">
            <div className="relative size-36">
              <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="12" className="stroke-secondary" />
                <circle
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="stroke-primary"
                  strokeDasharray={`${occupancy * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold">{occupancyPct}%</span>
                <span className="text-xs text-muted-foreground">occupied</span>
              </div>
            </div>
            <ul className="w-full space-y-2 text-sm">
              {[
                ["Occupied", stats.occupied, "bg-primary"],
                ["Available", stats.available, "bg-secondary border"],
                ["Under maintenance", stats.under_maintenance, "bg-amber-400"],
              ].map(([label, count, dot]) => (
                <li key={label as string} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className={`size-2.5 rounded-full ${dot}`} />
                    {label}
                  </span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: recent payments + open requests */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Recent payments</CardTitle>
            <CardDescription>The latest rent received</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <ul className="divide-y">
                {recentPayments.map((p) => (
                  <li key={p.payment_id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {p.tenant_first_name} {p.tenant_last_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.property_name} · Unit {p.unit_number} · {formatDate(p.payment_date)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold">{formatMoney(p.amount_paid)}</span>
                      <Badge variant={badgeVariant(p.payment_status)}>{p.payment_status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Open requests</CardTitle>
            <CardDescription>Repairs waiting for you</CardDescription>
          </CardHeader>
          <CardContent>
            {openRequests.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing waiting. All caught up!
              </p>
            ) : (
              <ul className="divide-y">
                {openRequests.map((r) => (
                  <li key={r.request_id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.descriptionx}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.property_name} · Unit {r.unit_number} · {r.tenant_first_name}{" "}
                        {r.tenant_last_name}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={badgeVariant(r.priority)}>{r.priority}</Badge>
                      <Badge variant={badgeVariant(r.statusx)}>{r.statusx}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}