"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  Eye,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { getUserId } from "@/lib/auth";
import { apiClient } from "@/lib/api";
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
import { Input } from "@/components/ui/input";
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

const CURRENCY = "PHP"; // change to "USD" etc.

/* ------------------------------------------------------------------ */
/* Types: describe one database table so one component can manage it   */
/* ------------------------------------------------------------------ */

export type Row = Record<string, any>;

export interface FieldDef {
  key: string; // database column name
  label: string;
  type?:
    | "text"
    | "email"
    | "tel"
    | "number"
    | "date"
    | "textarea"
    | "select"
    | "relation";
  placeholder?: string;
  /** Default true. Set false for columns that have a database default. */
  required?: boolean;
  step?: string; // for number inputs
  wide?: boolean; // span both columns
  default?: string; // starting value when creating
  options?: string[]; // for type "select"
  /** For type "relation": a dropdown filled from another table. */
  relation?: {
    endpoint: string;
    valueKey: string; // e.g. "property_id"
    label: (row: Row) => string;
  };
}

export interface ColumnDef {
  key: string;
  label: string;
  kind?: "text" | "number" | "money" | "date" | "badge";
  truncate?: boolean;
  // CHANGED: NEW - optional function that builds the cell text from the whole row
  format?: (row: Row) => string;
}

export interface ResourceDef {
  title: string; // "Properties"
  singular: string; // "property"
  description: string;
  endpoint: string;
  idKey: string; // primary key column, e.g. "property_id"
  fields: FieldDef[];
  columns: ColumnDef[];
  /** Send the logged-in user's id as `id` (like the landlords table). */
  withUserId?: boolean;
    // CHANGED: NEW - extra text added only to the list request, e.g. "?landlord_id=4"
  listQuery?: string;
  // CHANGED: NEW - values always sent on save, e.g. { landlord_id: 4 }
  extraPayload?: Record<string, any>;
  // CHANGED: NEW - set to false to hide the "Add" button (default: true)
  canCreate?: boolean;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatMoney = (value: number) =>
  Number.isNaN(value)
    ? "-"
    : new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: CURRENCY,
        maximumFractionDigits: 2,
      }).format(value);

const formatDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "Available":
    case "Active":
    case "Paid":
    case "Resolved":
      return "default";
    case "Occupied":
    case "In Progress":
      return "secondary";
    case "Late":
    case "High":
    case "Expired":
    case "Terminated":
      return "destructive";
    default: // Pending, Under Maintenance, Low, Medium ...
      return "outline";
  }
}

function renderCell(row: Row, col: ColumnDef) {
  if (col.format) return col.format(row);
  const v = row[col.key];
  if (v === null || v === undefined || v === "") return "-";
  switch (col.kind) {
    case "money":
      return formatMoney(Number(v));
    case "date":
      return formatDate(String(v));
    case "badge":
      return <Badge variant={statusVariant(String(v))}>{String(v)}</Badge>;
    default:
      return String(v);
  }
}

const toFormValue = (f: FieldDef, v: unknown) => {
  if (v === null || v === undefined) return "";
  if (f.type === "date") return String(v).slice(0, 10);
  return String(v);
};

/* ------------------------------------------------------------------ */
/* One form input, chosen by field type                                */
/* ------------------------------------------------------------------ */

interface Option {
  value: string;
  label: string;
}

function FieldInput({
  field,
  value,
  onChange,
  invalid,
  options,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
  options?: Option[];
}) {
  const aria = invalid || undefined;

  if (field.type === "textarea") {
    return (
      <Textarea
        id={field.key}
        rows={3}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={aria}
      />
    );
  }

  const selectOptions: Option[] | undefined =
    field.type === "select"
      ? (field.options ?? []).map((o) => ({ value: o, label: o }))
      : field.type === "relation" && options && options.length > 0
      ? options
      : undefined;

  if (selectOptions) {
    return (
      <Select value={value || null} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger id={field.key} aria-invalid={aria} className="h-11 w-full">
          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`}>
            {selectOptions.find((o) => o.value === value)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {selectOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Plain input. A relation whose list could not be loaded falls back to
  // typing the ID by hand.
  const inputType =
    field.type === "relation" || field.type === "number"
      ? "number"
      : field.type ?? "text";

  return (
    <Input
      id={field.key}
      type={inputType}
      step={field.step}
      placeholder={
        field.placeholder ??
        (field.type === "relation" ? `Enter ${field.label} (ID)` : undefined)
      }
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={aria}
      className="h-11"
    />
  );
}

/* ------------------------------------------------------------------ */
/* The manager                                                         */
/* ------------------------------------------------------------------ */

export function ResourceManager({ resource }: { resource: ResourceDef }) {
  const {
    title,
    singular,
    description,
    endpoint,
    idKey,
    fields,
    columns,
    withUserId,
    listQuery,
    extraPayload,
    canCreate = true,
  } = resource;

  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [relationOptions, setRelationOptions] = useState<
    Record<string, Option[]>
  >({});

  // READ (all)
  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient<Row[]>(`${endpoint}${listQuery ?? ""}`, {
        method: "GET",
        requiresAuth: true,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || `Failed to fetch ${title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
    }, [endpoint, listQuery, title]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Success messages fade away on their own
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 4500);
    return () => clearTimeout(t);
  }, [success]);

  // Fill the dropdowns that point at other tables
  const loadRelations = useCallback(async () => {
    const relFields = fields.filter((f) => f.type === "relation" && f.relation);
    const entries = await Promise.all(
      relFields.map(async (f) => {
        const rel = f.relation!;
        try {
          const data = await apiClient<Row[]>(rel.endpoint, {
            method: "GET",
            requiresAuth: true,
          });
          const list = Array.isArray(data) ? data : [];
          return [
            f.key,
            list.map((r) => ({
              value: String(r[rel.valueKey]),
              label: rel.label(r),
            })),
          ] as const;
        } catch {
          return [f.key, [] as Option[]] as const;
        }
      })
    );
    setRelationOptions(Object.fromEntries(entries));
  }, [fields]);

  // READ (single)
  const handleView = async (id: number) => {
    setError("");
    setSuccess("");
    try {
      const data = await apiClient<Row>(`${endpoint}/${id}`, {
        method: "GET",
        requiresAuth: true,
      });
      setSelected(data);
    } catch (err: any) {
      setError(err.message || `Failed to load ${singular} details.`);
    }
  };

  const openCreateForm = () => {
    const initial: Record<string, string> = {};
    fields.forEach((f) => (initial[f.key] = f.default ?? ""));
    setEditingId(null);
    setForm(initial);
    setInvalid({});
    setSelected(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
    loadRelations();
  };

  const openEditForm = (row: Row) => {
    const initial: Record<string, string> = {};
    fields.forEach((f) => (initial[f.key] = toFormValue(f, row[f.key])));
    setEditingId(row[idKey]);
    setForm(initial);
    setInvalid({});
    setSelected(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
    loadRelations();
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({});
    setInvalid({});
  };

  const handleChange = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setInvalid((v) => ({ ...v, [key]: false }));
  };

  // CREATE & UPDATE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const missing = fields.filter(
      (f) => f.required !== false && !(form[f.key] ?? "").trim()
    );
    if (missing.length > 0) {
      setInvalid(Object.fromEntries(missing.map((f) => [f.key, true])));
      setError(
        `Please fill in: ${missing.map((f) => f.label).join(", ")}.`
      );
      return;
    }

    // Empty optional fields are left out so the database default applies
    const payload: Row = {};
    for (const f of fields) {
      const raw = (form[f.key] ?? "").trim();
      if (raw === "") continue;
      payload[f.key] =
        f.type === "number" || f.type === "relation" ? Number(raw) : raw;
    }

    if (withUserId) {
      const userId = getUserId();
      if (!userId) {
        setError("Unable to determine user ID from token. Please log in again.");
        return;
      }
      payload.id = userId;
    }

        // CHANGED: always include the extra values (e.g. the logged-in landlord's id)
    if (extraPayload) Object.assign(payload, extraPayload);

    setSubmitting(true);
    try {
      if (editingId !== null) {
        await apiClient(`${endpoint}/${editingId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify(payload),
        });
        setSuccess(`${cap(singular)} #${editingId} updated successfully.`);
      } else {
        await apiClient(endpoint, {
          method: "POST",
          requiresAuth: true,
          body: JSON.stringify(payload),
        });
        setSuccess(`New ${singular} created successfully.`);
      }

      closeForm();
      await fetchRows();
    } catch (err: any) {
      setError(err.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${singular} #${id}?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await apiClient(`${endpoint}/${id}`, {
        method: "DELETE",
        requiresAuth: true,
      });
      if (selected && selected[idKey] === id) setSelected(null);
      setSuccess(`${cap(singular)} #${id} deleted successfully.`);
      await fetchRows();
    } catch (err: any) {
      setError(err.message || `Failed to delete ${singular}.`);
    }
  };

  const colSpan = columns.length + 2; // ID + columns + actions

  return (
    <div className="space-y-6">
      {/* Status notifications */}
      {error && (
        <Alert variant="destructive" role="alert" className="pr-12">
          <CircleAlert className="size-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setError("")}
            aria-label="Dismiss message"
            className="absolute right-2 top-2 size-7"
          >
            <X className="size-4" />
          </Button>
        </Alert>
      )}
      {success && (
        <Alert
          role="status"
          className="border-emerald-200 bg-emerald-50 pr-12 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <CircleCheck className="size-4" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-300">
            {success}
          </AlertDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSuccess("")}
            aria-label="Dismiss message"
            className="absolute right-2 top-2 size-7 hover:bg-emerald-100"
          >
            <X className="size-4" />
          </Button>
        </Alert>
      )}

      {/* CREATE / UPDATE form */}
      {isFormOpen && (
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {editingId !== null
                  ? `Update ${cap(singular)} #${editingId}`
                  : `Add New ${cap(singular)}`}
              </CardTitle>
              <CardDescription>
                {editingId !== null
                  ? `Modify the ${singular} details below.`
                  : `Fill in the details to add a new ${singular}.`}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeForm}
              aria-label="Close form"
            >
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {fields.map((f) => (
                  <div
                    key={f.key}
                    className={f.wide ? "space-y-2 md:col-span-2" : "space-y-2"}
                  >
                    <Label htmlFor={f.key}>
                      {f.label}
                      {f.required === false && (
                        <span className="text-xs font-normal text-muted-foreground">
                          (optional)
                        </span>
                      )}
                    </Label>
                    <FieldInput
                      field={f}
                      value={form[f.key] ?? ""}
                      onChange={(v) => handleChange(f.key, v)}
                      invalid={!!invalid[f.key]}
                      options={relationOptions[f.key]}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingId !== null ? (
                    "Save changes"
                  ) : (
                    `Create ${singular}`
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* READ single item */}
      {selected && (
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {cap(singular)} details (#{selected[idKey]})
              </CardTitle>
              <CardDescription>
                Fetched directly from GET {endpoint}/{selected[idKey]}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSelected(null)}
              aria-label="Close details"
            >
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-slate-50 p-4 dark:bg-muted/30">
                <dt className="text-xs text-muted-foreground">ID</dt>
                <dd className="mt-1 text-sm font-semibold">{selected[idKey]}</dd>
              </div>
              {columns.map((c) => (
                <div
                  key={c.key}
                  className="rounded-lg border bg-slate-50 p-4 dark:bg-muted/30"
                >
                  <dt className="text-xs text-muted-foreground">{c.label}</dt>
                  <dd className="mt-1 break-words text-sm font-semibold">
                    {renderCell(selected, c)}
                  </dd>
                </div>
              ))}
              <div className="rounded-lg border bg-slate-50 p-4 dark:bg-muted/30">
                <dt className="text-xs text-muted-foreground">Created at</dt>
                <dd className="mt-1 text-sm font-semibold">
                  {selected.created_at ? formatDate(selected.created_at) : "N/A"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="rounded-xl">
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-3 text-lg">
              All {title.toLowerCase()}
              {!loading && <Badge variant="secondary">{rows.length}</Badge>}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchRows} disabled={loading}>
              <RefreshCw
                className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {/* CHANGED: the Add button can now be hidden */}
            {canCreate && (
              <Button
                onClick={openCreateForm}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="mr-2 size-4" />
                Add {singular}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }, (_, i) => (
                  <TableRow
                    key={i}
                    className="animate-pulse motion-reduce:animate-none"
                  >
                    {Array.from({ length: colSpan }, (_, j) => (
                      <TableCell key={j}>
                        <div className="h-5 w-full max-w-[7rem] rounded bg-slate-100 dark:bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="py-12 text-center">
                    <Inbox className="mx-auto size-10 text-muted-foreground/50" />
                    <p className="mt-3 text-sm font-medium">
                      No {title.toLowerCase()} found
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Click &quot;Add {singular}&quot; to create one.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const id = row[idKey];
                  const active = selected?.[idKey] === id || editingId === id;
                  return (
                    <TableRow
                      key={id}
                      className={active ? "bg-slate-50 dark:bg-muted/40" : ""}
                    >
                      <TableCell>
                        <Badge variant="secondary" className="tabular-nums">
                          {id}
                        </Badge>
                      </TableCell>
                      {columns.map((c, i) => (
                        <TableCell
                          key={c.key}
                          className={`${i === 0 ? "font-medium" : ""} ${
                            c.truncate ? "max-w-[14rem] truncate" : ""
                          }`}
                        >
                          {renderCell(row, c)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(id)}
                          >
                            <Eye className="mr-1.5 size-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openEditForm(row)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Pencil className="mr-1.5 size-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(id)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="mr-1.5 size-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}