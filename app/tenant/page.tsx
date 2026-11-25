"use client";

// CHANGED: NEW - useCallback added
import { useCallback, useEffect, useState } from "react";
// CHANGED: NEW - more icons
import { CircleAlert, CircleCheck, FileText, Loader2, Wallet, Wrench } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { DashboardShell } from "@/components/dashboard-shell";
// CHANGED: NEW - extra components for the form and tables
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const APP_NAME = "BiGiBi";
const APP_TAGLINE = "Apartment Management";
const E = CONFIG.ENDPOINTS;

interface Tenant {
  tenant_id: number;
  first_name: string;
  last_name: string;
}

interface Lease {
  lease_id: number;
  unit_id: number; // CHANGED: NEW - needed to file a request for the right unit
  unit_number: string;
  property_name: string;
  address: string;
  start_date: string;
  end_date: string;
  monthly_rent: string;
  security_deposit: string;
  statusx: string;
}

// CHANGED: NEW - one payment row
interface Payment {
  payment_id: number;
  unit_number: string;
  property_name: string;
  payment_date: string;
  amount_paid: string;
  payment_method: string;
  payment_status: string;
}

// CHANGED: NEW - one maintenance request row
interface MaintenanceRequest {
  request_id: number;
  unit_number: string;
  property_name: string;
  request_date: string;
  descriptionx: string;
  priority: string;
  statusx: string;
}

const formatMoney = (v: string | number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(v));

const formatDate = (v: string) =>
  new Date(v).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// CHANGED: NEW - badge colors for statuses
const badgeVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "Paid" || s === "Active" || s === "Resolved") return "default";
  if (s === "In Progress") return "secondary";
  if (s === "Late" || s === "High") return "destructive";
  return "outline";
};

export default function TenantPage() {
  const { isChecking } = useAuthGuard({ requireAuth: true, role: "tenant" });
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [leases, setLeases] = useState<Lease[]>([]);
  // CHANGED: NEW - payments, requests, and which sidebar item is open
  const [payments, setPayments] = useState<Payment[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [active, setActive] = useState("lease");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // CHANGED: NEW - state for the "file a request" form
  const [unitId, setUnitId] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  // CHANGED: loads the tenant first, then their leases, payments and requests together
  const loadAll = useCallback(async () => {
    try {
      const t = await apiClient<Tenant>(`${E.TENANTS}/me`, { requiresAuth: true });
      setTenant(t);
      const q = `?tenant_id=${t.tenant_id}`;
      const [l, p, r] = await Promise.all([
        apiClient<Lease[]>(`${E.LEASES}${q}`, { requiresAuth: true }),
        apiClient<Payment[]>(`${E.RENT_PAYMENTS}${q}`, { requiresAuth: true }),
        apiClient<MaintenanceRequest[]>(`${E.MAINTENANCE_REQUESTS}${q}`, {
          requiresAuth: true,
        }),
      ]);
      setLeases(Array.isArray(l) ? l : []);
      setPayments(Array.isArray(p) ? p : []);
      setRequests(Array.isArray(r) ? r : []);
    } catch (err: any) {
      setError(err.message || "Could not load your account.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Success messages fade away on their own
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 4500);
    return () => clearTimeout(t);
  }, [success]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-sm text-neutral-400">Verifying session...</p>
      </div>
    );
  }

  // CHANGED: NEW - the units a request can be filed for (units with an active lease, no repeats)
  const unitOptions = Array.from(
    new Map<number, Lease>(
      leases
        .filter((l) => l.statusx === "Active")
        .map((l) => [l.unit_id, l] as [number, Lease])
    ).values()
  );
  const selectedUnit = unitOptions.find((l) => String(l.unit_id) === unitId);

  // CHANGED: NEW - send a new maintenance request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    if (!tenant) return;
    if (!unitId || !description.trim()) {
      setFormError("Please choose your unit and describe the issue.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient(E.MAINTENANCE_REQUESTS, {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({
          unit_id: Number(unitId),
          tenant_id: tenant.tenant_id,
          request_date: new Date().toLocaleDateString("en-CA"), // today, as YYYY-MM-DD
          descriptionx: description.trim(),
          priority,
        }),
      });
      setSuccess("Your request was sent to the landlord.");
      setDescription("");
      setPriority("Medium");
      await loadAll();
    } catch (err: any) {
      setFormError(err.message || "Could not send your request.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- the three views ----------

  const leaseView =
    leases.length === 0 ? (
      <p className="text-sm text-neutral-400">
        You have no lease yet. Your landlord will add one for you.
      </p>
    ) : (
      <div className="space-y-6">
        {leases.map((l) => (
          <Card key={l.lease_id} className="rounded-xl">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  {l.property_name} · Unit {l.unit_number}
                </CardTitle>
                <CardDescription>{l.address}</CardDescription>
              </div>
              <Badge variant={badgeVariant(l.statusx)}>{l.statusx}</Badge>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ["Monthly rent", formatMoney(l.monthly_rent)],
                  ["Security deposit", formatMoney(l.security_deposit)],
                  ["Lease start", formatDate(l.start_date)],
                  ["Lease end", formatDate(l.end_date)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border p-4">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    );

  // CHANGED: NEW - payment history (read-only)
  const paymentsView = (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-lg">Payment history</CardTitle>
        <CardDescription>Rent payments recorded for you.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No payments recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.payment_id}>
                  <TableCell>{formatDate(p.payment_date)}</TableCell>
                  <TableCell>
                    {p.property_name} · Unit {p.unit_number}
                  </TableCell>
                  <TableCell>{formatMoney(p.amount_paid)}</TableCell>
                  <TableCell>{p.payment_method}</TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(p.payment_status)}>{p.payment_status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // CHANGED: NEW - the request form and the list of the tenant's requests
  const maintenanceView = (
    <div className="space-y-6">
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Report a problem</CardTitle>
          <CardDescription>Tell your landlord what needs fixing.</CardDescription>
        </CardHeader>
        <CardContent>
          {unitOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You need an active lease before you can file a request.
            </p>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {formError && (
                <Alert variant="destructive" role="alert">
                  <CircleAlert className="size-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert
                  role="status"
                  className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <CircleCheck className="size-4" />
                  <AlertDescription className="text-emerald-800 dark:text-emerald-300">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={unitId || null} onValueChange={(v) => setUnitId(v ?? "")}>
                    <SelectTrigger id="unit" className="h-11 w-full">
                      <SelectValue placeholder="Select your unit">
                        {selectedUnit &&
                          `${selectedUnit.property_name} · Unit ${selectedUnit.unit_number}`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((l) => (
                        <SelectItem key={l.unit_id} value={String(l.unit_id)}>
                          {l.property_name} · Unit {l.unit_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v ?? "Medium")}>
                    <SelectTrigger id="priority" className="h-11 w-full">
                      <SelectValue placeholder="Select priority">{priority}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {["Low", "Medium", "High"].map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">What is the problem?</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="e.g. The kitchen faucet is leaking"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send request"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Your requests</CardTitle>
          <CardDescription>Track the status of what you reported.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    You haven&apos;t filed any requests.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((r) => (
                  <TableRow key={r.request_id}>
                    <TableCell>{formatDate(r.request_date)}</TableCell>
                    <TableCell>
                      {r.property_name} · Unit {r.unit_number}
                    </TableCell>
                    <TableCell className="max-w-[14rem] truncate">{r.descriptionx}</TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(r.priority)}>{r.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(r.statusx)}>{r.statusx}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // CHANGED: picks what to show for the open sidebar item
  let content;
  if (error) {
    content = <p className="text-sm text-red-400">{error}</p>;
  } else if (loading) {
    content = <p className="text-sm text-neutral-400">Loading your account...</p>;
  } else if (active === "payments") {
    content = paymentsView;
  } else if (active === "maintenance") {
    content = maintenanceView;
  } else {
    content = leaseView;
  }

  // CHANGED: NEW - the three sidebar items
  const items = [
    { value: "lease", label: "My Lease", icon: FileText },
    { value: "payments", label: "Payments", icon: Wallet },
    { value: "maintenance", label: "Maintenance", icon: Wrench },
  ];
  const current = items.find((i) => i.value === active) ?? items[0];

  return (
    <DashboardShell
      appName={APP_NAME}
      tagline={APP_TAGLINE}
      items={items}
      active={current.value}
      onChange={setActive}
      title={active === "lease" && tenant ? `Welcome, ${tenant.first_name}` : current.label}
    >
      {content}
    </DashboardShell>
  );
}