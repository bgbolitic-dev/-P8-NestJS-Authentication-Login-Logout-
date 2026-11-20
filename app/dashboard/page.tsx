"use client";

import { useState } from "react";
import { Building2, DoorOpen, FileText, Users, Wallet, Wrench } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { CONFIG } from "@/lib/config";
import { DashboardShell } from "@/components/dashboard-shell";
import { ResourceManager, type ResourceDef } from "@/components/resource-manager";

// Same name as the login and register pages
const APP_NAME = "BiGiBi";
const APP_TAGLINE = "Apartment Management";

const E = CONFIG.ENDPOINTS;

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
    {
      key: "landlord_id",
      label: "Landlord",
      type: "relation",
      relation: { endpoint: E.LANDLORDS, valueKey: "landlord_id", label: personName },
    },
  ],
  columns: [
    { key: "property_name", label: "Property name" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "zip_code", label: "ZIP code" },
    { key: "landlord_id", label: "Landlord ID" },
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
    { key: "property_id", label: "Property ID" },
    { key: "unit_number", label: "Unit" },
    { key: "bedrooms", label: "Beds" },
    { key: "bathrooms", label: "Baths" },
    { key: "rent_amount", label: "Rent", kind: "money" },
    { key: "statusx", label: "Status", kind: "badge" },
  ],
};

const tenants: ResourceDef = {
  title: "Tenants",
  singular: "tenant",
  description: "People renting your units.",
  endpoint: E.TENANTS,
  idKey: "tenant_id",
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
        label: (r) => `Unit ${r.unit_number} (#${r.unit_id})`,
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
  columns: [
    { key: "unit_id", label: "Unit ID" },
    { key: "tenant_id", label: "Tenant ID" },
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
        label: (r) => `Lease #${r.lease_id}`,
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
  columns: [
    { key: "lease_id", label: "Lease ID" },
    { key: "tenant_id", label: "Tenant ID" },
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
        label: (r) => `Unit ${r.unit_number} (#${r.unit_id})`,
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
  columns: [
    { key: "unit_id", label: "Unit ID" },
    { key: "tenant_id", label: "Tenant ID" },
    { key: "request_date", label: "Date", kind: "date" },
    { key: "descriptionx", label: "Issue", truncate: true },
    { key: "priority", label: "Priority", kind: "badge" },
    { key: "statusx", label: "Status", kind: "badge" },
  ],
};

const TABS = [
  { value: "properties", label: "Properties", icon: Building2, resource: properties },
  { value: "units", label: "Units", icon: DoorOpen, resource: units },
  { value: "tenants", label: "Tenants", icon: Users, resource: tenants },
  { value: "leases", label: "Leases", icon: FileText, resource: leases },
  { value: "payments", label: "Payments", icon: Wallet, resource: payments },
  { value: "maintenance", label: "Maintenance", icon: Wrench, resource: maintenance },
];

export default function DashboardPage() {
  const { isChecking } = useAuthGuard({ requireAuth: true });
  const [active, setActive] = useState("properties");

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-sm text-neutral-400">Verifying session...</p>
      </div>
    );
  }

  const current = TABS.find((t) => t.value === active) ?? TABS[0];

  return (
    <DashboardShell
      appName={APP_NAME}
      tagline={APP_TAGLINE}
      items={TABS.map(({ value, label, icon }) => ({ value, label, icon }))}
      active={current.value}
      onChange={setActive}
      title={current.label}
    >
      <ResourceManager key={current.value} resource={current.resource} />
    </DashboardShell>
  );
}
