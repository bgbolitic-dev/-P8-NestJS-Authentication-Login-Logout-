"use client";


// CHANGED: added useEffect
import { useEffect, useState } from "react";
// CHANGED: added LayoutDashboard
import { Building2, DoorOpen, FileText, LayoutDashboard, Users, Wallet, Wrench } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
// CHANGED: NEW import (right after the useAuthGuard import)
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { DashboardShell } from "@/components/dashboard-shell";
import { ResourceManager, type ResourceDef } from "@/components/resource-manager";
// CHANGED: NEW import
import { Overview } from "@/components/overview";

// Same name as the login and register pages
const APP_NAME = "BiGiBi";
const APP_TAGLINE = "Apartment Management";

const E = CONFIG.ENDPOINTS;

// CHANGED: NEW - for lists that come with names from the backend JOINs
const tenantName = (r: Record<string, any>) => `${r.tenant_first_name} ${r.tenant_last_name}`;
const unitName = (r: Record<string, any>) => `${r.property_name} · Unit ${r.unit_number}`;
const personName = (r: Record<string, any>) => `${r.first_name} ${r.last_name}`;

/* ------------------------------------------------------------------ */
/* One definition per database table. Field keys = your column names.  */
/* Fields marked required: false have a default in the database.       */
/* ------------------------------------------------------------------ */

const properties: ResourceDef = {
  title: "Properties",
  singular: "property",
  description: "Buildings you own or manage.",
  endpoint: E.PROPERTIES,
  idKey: "property_id",
    fields: [
    { key: "property_name", label: "Property name", placeholder: "e.g. Sunrise Residences" },
    { key: "address", label: "Address", placeholder: "e.g. 123 Main Street", wide: true },
    { key: "city", label: "City" },
    { key: "zip_code", label: "ZIP code" },
  ],
  columns: [
    { key: "property_name", label: "Property name" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "zip_code", label: "ZIP code" },
  ],
};

const units: ResourceDef = {
  title: "Units",
  singular: "unit",
  description: "Individual apartments inside your properties.",
  endpoint: E.UNITS,
  idKey: "unit_id",
  fields: [
    {
      key: "property_id",
      label: "Property",
      type: "relation",
      relation: {
        endpoint: E.PROPERTIES,
        valueKey: "property_id",
        label: (r) => r.property_name,
      },
    },
    { key: "unit_number", label: "Unit number", placeholder: "e.g. 101" },
    { key: "bedrooms", label: "Bedrooms", type: "number", default: "1", required: false },
    { key: "bathrooms", label: "Bathrooms", type: "number", step: "0.5", default: "1", required: false },
    { key: "rent_amount", label: "Rent amount", type: "number", step: "0.01" },
    {
      key: "statusx",
      label: "Status",
      type: "select",
      options: ["Available", "Occupied", "Under Maintenance"],
      default: "Available",
      required: false,
    },
  ],
    columns: [
    // CHANGED: property name instead of its ID, plus the current tenant
    { key: "property_name", label: "Property" },
    { key: "unit_number", label: "Unit" },
    { key: "bedrooms", label: "Beds" },
    { key: "bathrooms", label: "Baths" },
    { key: "rent_amount", label: "Rent", kind: "money" },
    { key: "statusx", label: "Status", kind: "badge" },
    {
      key: "tenant_first_name",
      label: "Tenant",
      format: (r) => (r.tenant_first_name ? tenantName(r) : "-"),
    },
  ],
};

const tenants: ResourceDef = {
  title: "Tenants",
  singular: "tenant",
  description: "People renting your units.",
  endpoint: E.TENANTS,
  idKey: "tenant_id",
    // CHANGED: tenants now sign up through the register page, so no "Add" button here
  canCreate: false,
  fields: [
    { key: "first_name", label: "First name" },
    { key: "last_name", label: "Last name" },
    { key: "email", label: "Email", type: "email", placeholder: "name@example.com" },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "emergency_contact", label: "Emergency contact", wide: true },
  ],
  columns: [
    { key: "first_name", label: "First name" },
    { key: "last_name", label: "Last name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "emergency_contact", label: "Emergency contact" },
  ],
};

const leases: ResourceDef = {
  title: "Leases",
  singular: "lease",
  description: "Rental agreements between tenants and units.",
  endpoint: E.LEASES,
  idKey: "lease_id",
  fields: [
    {
      key: "unit_id",
      label: "Unit",
      type: "relation",
      relation: {
        endpoint: E.UNITS,
        valueKey: "unit_id",
        label: unitName,
      },
    },
    {
      key: "tenant_id",
      label: "Tenant",
      type: "relation",
      relation: { endpoint: E.TENANTS, valueKey: "tenant_id", label: personName },
    },
    { key: "start_date", label: "Start date", type: "date" },
    { key: "end_date", label: "End date", type: "date" },
    { key: "monthly_rent", label: "Monthly rent", type: "number", step: "0.01" },
    { key: "security_deposit", label: "Security deposit", type: "number", step: "0.01", default: "0", required: false },
    {
      key: "statusx",
      label: "Status",
      type: "select",
      options: ["Active", "Expired", "Terminated"],
      default: "Active",
      required: false,
    },
  ],
  // leases
  columns: [
    { key: "unit_number", label: "Unit", format: (r) => `Unit ${r.unit_number}` },
    { key: "tenant_first_name", label: "Tenant", format: tenantName },
    { key: "start_date", label: "Start", kind: "date" },
    { key: "end_date", label: "End", kind: "date" },
    { key: "monthly_rent", label: "Rent", kind: "money" },
    { key: "security_deposit", label: "Deposit", kind: "money" },
    { key: "statusx", label: "Status", kind: "badge" },
  ],
};

const payments: ResourceDef = {
  title: "Payments",
  singular: "payment",
  description: "Rent payments received from tenants.",
  endpoint: E.RENT_PAYMENTS,
  idKey: "payment_id",
  fields: [
    {
      key: "lease_id",
      label: "Lease",
      type: "relation",
      relation: {
        endpoint: E.LEASES,
        valueKey: "lease_id",
        label: (r) => `${unitName(r)} · ${tenantName(r)}`,
      },
    },
    {
      key: "tenant_id",
      label: "Tenant",
      type: "relation",
      relation: { endpoint: E.TENANTS, valueKey: "tenant_id", label: personName },
    },
    { key: "payment_date", label: "Payment date", type: "date" },
    { key: "amount_paid", label: "Amount paid", type: "number", step: "0.01" },
    {
      key: "payment_method",
      label: "Payment method",
      type: "select",
      options: ["Cash", "Bank Transfer", "Credit Card", "E-Wallet"],
    },
    {
      key: "payment_status",
      label: "Status",
      type: "select",
      options: ["Paid", "Pending", "Late"],
      default: "Paid",
      required: false,
    },
  ],
  // payments
  columns: [
    { key: "unit_number", label: "Unit", format: unitName },
    { key: "tenant_first_name", label: "Tenant", format: tenantName },
    { key: "payment_date", label: "Date", kind: "date" },
    { key: "amount_paid", label: "Amount", kind: "money" },
    { key: "payment_method", label: "Method" },
    { key: "payment_status", label: "Status", kind: "badge" },
  ],
};

const maintenance: ResourceDef = {
  title: "Maintenance",
  singular: "request",
  description: "Repair requests reported for your units.",
  endpoint: E.MAINTENANCE_REQUESTS,
  idKey: "request_id",
  fields: [
    {
      key: "unit_id",
      label: "Unit",
      type: "relation",
      relation: {
        endpoint: E.UNITS,
        valueKey: "unit_id",
        label: unitName,
      },
    },
    {
      key: "tenant_id",
      label: "Tenant",
      type: "relation",
      relation: { endpoint: E.TENANTS, valueKey: "tenant_id", label: personName },
    },
    { key: "request_date", label: "Request date", type: "date" },
    {
      key: "priority",
      label: "Priority",
      type: "select",
      options: ["Low", "Medium", "High"],
      default: "Medium",
      required: false,
    },
    {
      key: "descriptionx",
      label: "Description",
      type: "textarea",
      placeholder: "Describe the issue",
      wide: true,
    },
    {
      key: "statusx",
      label: "Status",
      type: "select",
      options: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
      required: false,
    },
  ],
  // maintenance
  columns: [
        { key: "unit_number", label: "Unit", format: (r) => `Unit ${r.unit_number}` },
    { key: "tenant_first_name", label: "Tenant", format: tenantName },
    { key: "request_date", label: "Date", kind: "date" },
    { key: "descriptionx", label: "Issue", truncate: true },
    { key: "priority", label: "Priority", kind: "badge" },
    { key: "statusx", label: "Status", kind: "badge" },
  ],
};

// CHANGED: NEW - the Overview item sits above the table tabs in the sidebar
const OVERVIEW = { value: "overview", label: "Overview", icon: LayoutDashboard };

const TABS = [
  { value: "properties", label: "Properties", icon: Building2, resource: properties },
  { value: "units", label: "Units", icon: DoorOpen, resource: units },
  { value: "tenants", label: "Tenants", icon: Users, resource: tenants },
  { value: "leases", label: "Leases", icon: FileText, resource: leases },
  { value: "payments", label: "Payments", icon: Wallet, resource: payments },
  { value: "maintenance", label: "Maintenance", icon: Wrench, resource: maintenance },
];

export default function DashboardPage() {
  const { isChecking } = useAuthGuard({ requireAuth: true, role: "landlord" });
  // CHANGED: the page now opens on the Overview tab
  const [active, setActive] = useState("overview");
  const [landlordId, setLandlordId] = useState<number | null>(null);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    apiClient<{ landlord_id: number }>(`${E.LANDLORDS}/me`, { requiresAuth: true })
      .then((l) => setLandlordId(l.landlord_id))
      .catch((err: any) =>
        setProfileError(err.message || "Could not load your landlord profile.")
      );
  }, []);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-sm text-neutral-400">Verifying session...</p>
      </div>
    );
  }

  // CHANGED: NEW - Overview is not one of the table tabs, so it is checked first
  const isOverview = active === "overview";
  const current = TABS.find((t) => t.value === active) ?? TABS[0];

  const resource: ResourceDef =
    current.value === "properties"
      ? {
          ...current.resource,
          listQuery: `?landlord_id=${landlordId}`,
          extraPayload: { landlord_id: landlordId },
        }
      : current.value === "units"
      ? { ...current.resource, listQuery: `?landlord_id=${landlordId}` }
      : current.resource;

  let content;
  if (profileError) {
    content = <p className="text-sm text-red-400">{profileError}</p>;
  } else if (landlordId === null) {
    content = <p className="text-sm text-neutral-400">Loading your account...</p>;
  } else if (isOverview) {
        // CHANGED: Overview now needs to know which landlord to load
    content = <Overview landlordId={landlordId} />;
  } else {
    content = <ResourceManager key={current.value} resource={resource} />;
  }

  return (
    <DashboardShell
      appName={APP_NAME}
      tagline={APP_TAGLINE}
      // CHANGED: Overview goes first in the sidebar
      items={[OVERVIEW, ...TABS.map(({ value, label, icon }) => ({ value, label, icon }))]}
      active={isOverview ? OVERVIEW.value : current.value}
      onChange={setActive}
            title={isOverview ? OVERVIEW.label : current.label}
      // CHANGED: NEW - greeting on the Overview, and a short line under every title
      greeting={isOverview}
      subtitle={isOverview ? "Here's what's happening with your properties today." : current.resource.description}
    >
      {content}
    </DashboardShell>
    
  );
}
