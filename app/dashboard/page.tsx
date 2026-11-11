"use client";

import { useRouter } from "next/navigation";
import {
  Building,
  Building2,
  DoorOpen,
  LogOut,
  Percent,
  Wallet,
} from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { clearTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Keep these the same as the login and register pages
const APP_NAME = "BiGiBi";
const APP_TAGLINE = "Apartment Management";
const CURRENCY = "PHP"; // change to "USD" etc.

/* ------------------------------------------------------------------ */
/* Row types: field names match your database columns                  */
/* ------------------------------------------------------------------ */

interface UnitRow {
  unit_id: number;
  property_name: string; // from properties
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  rent_amount: number;
  statusx: string; // Available | Occupied | Maintenance
}

interface PaymentRow {
  payment_id: number;
  tenant_name: string; // tenants.first_name + last_name
  unit_number: string; // via leases -> units
  payment_date: string;
  amount_paid: number;
  payment_method: string;
  payment_status: string; // Paid | Pending | Late
}

interface MaintenanceRow {
  request_id: number;
  unit_number: string;
  tenant_name: string;
  request_date: string;
  descriptionx: string;
  priority: string; // Low | Medium | High
  statusx: string; // Pending | In Progress | Completed
}

/* ------------------------------------------------------------------ */
/* SAMPLE DATA: replace with real data from your API (see note below)  */
/* ------------------------------------------------------------------ */

const units: UnitRow[] = [
  { unit_id: 1, property_name: "Sunrise Residences", unit_number: "101", bedrooms: 2, bathrooms: 1, rent_amount: 18000, statusx: "Occupied" },
  { unit_id: 2, property_name: "Sunrise Residences", unit_number: "102", bedrooms: 1, bathrooms: 1, rent_amount: 12000, statusx: "Available" },
  { unit_id: 3, property_name: "Sunrise Residences", unit_number: "201", bedrooms: 3, bathrooms: 2, rent_amount: 25000, statusx: "Occupied" },
  { unit_id: 4, property_name: "Maple Court", unit_number: "A1", bedrooms: 1, bathrooms: 1, rent_amount: 11000, statusx: "Maintenance" },
  { unit_id: 5, property_name: "Maple Court", unit_number: "A2", bedrooms: 2, bathrooms: 1.5, rent_amount: 16500, statusx: "Occupied" },
];

const payments: PaymentRow[] = [
  { payment_id: 1, tenant_name: "Maria Santos", unit_number: "101", payment_date: "2026-11-05", amount_paid: 18000, payment_method: "Bank Transfer", payment_status: "Paid" },
  { payment_id: 2, tenant_name: "John Reyes", unit_number: "201", payment_date: "2026-11-03", amount_paid: 25000, payment_method: "Cash", payment_status: "Paid" },
  { payment_id: 3, tenant_name: "Ana Cruz", unit_number: "A2", payment_date: "2026-11-10", amount_paid: 8000, payment_method: "GCash", payment_status: "Pending" },
];

const maintenance: MaintenanceRow[] = [
  { request_id: 1, unit_number: "A1", tenant_name: "Paolo Garcia", request_date: "2026-11-02", descriptionx: "Leaking kitchen faucet", priority: "High", statusx: "In Progress" },
  { request_id: 2, unit_number: "101", tenant_name: "Maria Santos", request_date: "2026-11-08", descriptionx: "Hallway light not working", priority: "Low", statusx: "Pending" },
  { request_id: 3, unit_number: "201", tenant_name: "John Reyes", request_date: "2026-10-28", descriptionx: "Air conditioner not cooling", priority: "Medium", statusx: "Completed" },
];

/*
  To use real data, fetch it inside the page with your apiClient, e.g.:

    const [units, setUnits] = useState<UnitRow[]>([]);
    useEffect(() => {
      apiClient<UnitRow[]>("/units").then(setUnits);
    }, []);

  and do the same for payments and maintenance. Remove the sample arrays above.
*/

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "Available":
    case "Paid":
    case "Completed":
      return "default";
    case "Occupied":
    case "In Progress":
      return "secondary";
    case "Late":
    case "High":
      return "destructive";
    default: // Pending, Maintenance, Low, Medium ...
      return "outline";
  }
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  // Stats are calculated from the data above
  const totalProperties = new Set(units.map((u) => u.property_name)).size;
  const occupied = units.filter((u) => u.statusx === "Occupied");
  const available = units.filter((u) => u.statusx === "Available");
  const occupancy = units.length
    ? Math.round((occupied.length / units.length) * 100)
    : 0;
  const monthlyRent = occupied.reduce((sum, u) => sum + u.rent_amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur dark:bg-background/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Building2 className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">{APP_TAGLINE}</p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 size-4" />
            Log out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your properties, units, payments, and requests.
          </p>
        </div>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Properties"
            value={String(totalProperties)}
            hint="Total buildings"
            icon={Building}
          />
          <StatCard
            title="Units"
            value={String(units.length)}
            hint={`${available.length} available`}
            icon={DoorOpen}
          />
          <StatCard
            title="Occupancy"
            value={`${occupancy}%`}
            hint={`${occupied.length} of ${units.length} units occupied`}
            icon={Percent}
          />
          <StatCard
            title="Monthly rent"
            value={formatMoney(monthlyRent)}
            hint="From occupied units"
            icon={Wallet}
          />
        </section>

        {/* Tables */}
        <Tabs defaultValue="units" className="space-y-4">
          <TabsList>
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="units">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-base">Units</CardTitle>
                <CardDescription>
                  All units and their current status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Bed / Bath</TableHead>
                      <TableHead className="text-right">Rent</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((u) => (
                      <TableRow key={u.unit_id}>
                        <TableCell className="font-medium">
                          {u.property_name}
                        </TableCell>
                        <TableCell>{u.unit_number}</TableCell>
                        <TableCell>
                          {u.bedrooms} bd / {u.bathrooms} ba
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(u.rent_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(u.statusx)}>
                            {u.statusx}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-base">Recent payments</CardTitle>
                <CardDescription>Latest rent payments received.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.payment_id}>
                        <TableCell className="font-medium">
                          {p.tenant_name}
                        </TableCell>
                        <TableCell>{p.unit_number}</TableCell>
                        <TableCell>{formatDate(p.payment_date)}</TableCell>
                        <TableCell>{p.payment_method}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(p.amount_paid)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(p.payment_status)}>
                            {p.payment_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-base">Maintenance requests</CardTitle>
                <CardDescription>
                  Issues reported by tenants.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenance.map((m) => (
                      <TableRow key={m.request_id}>
                        <TableCell className="font-medium">
                          {m.unit_number}
                        </TableCell>
                        <TableCell>{m.tenant_name}</TableCell>
                        <TableCell className="max-w-[240px] truncate">
                          {m.descriptionx}
                        </TableCell>
                        <TableCell>{formatDate(m.request_date)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(m.priority)}>
                            {m.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(m.statusx)}>
                            {m.statusx}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
