"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Loader2,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { clearTokens, getUserId, getUserRole, getUsername } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface NavItem {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface DashboardShellProps {
  appName: string;
  tagline: string;
  items: NavItem[];
  active: string;
  onChange: (value: string) => void;
  title: string;
  // CHANGED: NEW - show "Welcome back, {first name}" instead of the title
  greeting?: boolean;
  // CHANGED: NEW - small line under the heading
  subtitle?: string;
  children: ReactNode;
}

// CHANGED: NEW - what /landlords/me and /tenants/me send back
interface Profile {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  emergency_contact?: string;
}

/* ------------------------------------------------------------------ */
/* CHANGED: NEW - the popup for "My profile" and "Settings"            */
/* ------------------------------------------------------------------ */
function AccountModal({
  view,
  onViewChange,
  onClose,
  profile,
  username,
  roleLabel,
}: {
  view: "profile" | "settings";
  onViewChange: (v: "profile" | "settings") => void;
  onClose: () => void;
  profile: Profile;
  username: string;
  roleLabel: string;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Escape closes the popup
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const id = getUserId();
    if (!id) {
      setError("Please log in again.");
      return;
    }
    setSaving(true);
    try {
      // uses the existing PUT /users/:id, which already hashes the password
      await apiClient(`/users/${id}`, {
        method: "PUT",
        requiresAuth: true,
        body: JSON.stringify({ password }),
      });
      setSuccess("Password updated.");
      setPassword("");
      setConfirm("");
    } catch (err: any) {
      setError(err.message || "Could not update your password.");
    } finally {
      setSaving(false);
    }
  };

  const rows: [string, string | undefined][] = [
    ["Full name", [profile.first_name, profile.last_name].filter(Boolean).join(" ")],
    ["Username", username],
    ["Role", roleLabel],
    ["Email", profile.email],
    ["Phone", profile.phone],
  ];
  if (roleLabel === "Tenant") rows.push(["Emergency contact", profile.emergency_contact]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        className="relative w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl bg-card p-6 shadow-2xl duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
        >
          <X className="size-4" />
        </button>

        {/* two tabs */}
        <div className="mb-5 mr-10 flex rounded-full bg-secondary p-1">
          {(
            [
              ["profile", "My profile"],
              ["settings", "Settings"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onViewChange(key)}
              className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
                view === key
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "profile" ? (
          <dl className="space-y-3">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-xl border px-4 py-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-sm font-medium">{value || "-"}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Change password</h2>
              <p className="text-sm text-muted-foreground">Choose a new password for your account.</p>
            </div>
            {error && (
              <Alert variant="destructive" role="alert" className="py-2">
                <CircleAlert className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert role="status" className="border-emerald-200 bg-emerald-50 py-2 text-emerald-800">
                <CircleCheck className="size-4" />
                <AlertDescription className="text-emerald-800">{success}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm new password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-10"
              />
            </div>
            <Button type="submit" disabled={saving} className="h-10 w-full rounded-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The shell                                                           */
/* ------------------------------------------------------------------ */
export function DashboardShell({
  appName,
  tagline,
  items,
  active,
  onChange,
  title,
  greeting = false,
  subtitle,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  // CHANGED: NEW - sidebar collapse (desktop), profile dropdown, account popup
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [account, setAccount] = useState<null | "profile" | "settings">(null);
  const [profile, setProfile] = useState<Profile>({});
  const [identity, setIdentity] = useState({ name: "", role: "" });
  const [today, setToday] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // CHANGED: after mount, read the token, today's date and the person's profile
  useEffect(() => {
    const role = getUserRole() ?? "";
    setIdentity({
      name: getUsername() ?? "Account",
      role: role ? role.charAt(0).toUpperCase() + role.slice(1) : "",
    });
    setToday(
      new Date().toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    );
    const endpoint = role === "tenant" ? CONFIG.ENDPOINTS.TENANTS : CONFIG.ENDPOINTS.LANDLORDS;
    apiClient<Profile>(`${endpoint}/me`, { requiresAuth: true })
      .then(setProfile)
      .catch(() => {});
  }, []);

  // CHANGED: NEW - the profile dropdown closes on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Escape closes the mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // CHANGED: the old effect that forced the dark theme is gone

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  const select = (value: string) => {
    onChange(value);
    setMobileOpen(false);
  };

  const openAccount = (view: "profile" | "settings") => {
    setMenuOpen(false);
    setMobileOpen(false);
    setAccount(view);
  };

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  const displayName = fullName || identity.name || "Account";
  const initial = (profile.first_name || identity.name || "A").charAt(0).toUpperCase();
  const heading = greeting
    ? `Welcome back${profile.first_name ? `, ${profile.first_name}` : ""}`
    : title;

  // labels and spacing change when the sidebar is collapsed (desktop only)
  const hideWhenCollapsed = collapsed ? "md:hidden" : "";
  const centerWhenCollapsed = collapsed ? "md:justify-center md:px-0" : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Backdrop (mobile) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar transition-[transform,width] duration-200 motion-reduce:transition-none md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-[4.5rem]" : "md:w-64"}`}
        aria-label="Main navigation"
      >
        {/* CHANGED: NEW - collapse button on the sidebar's edge (desktop only) */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-5 hidden size-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm hover:text-foreground md:flex"
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>

        {/* Brand */}
        <div className={`flex h-16 items-center justify-between px-5 ${centerWhenCollapsed}`}>
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="size-4" />
            </div>
            <div className={`leading-tight ${hideWhenCollapsed}`}>
              <p className="text-sm font-semibold tracking-tight">{appName}</p>
              <p className="text-xs text-muted-foreground">{tagline}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-2">
          <p
            className={`px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground ${hideWhenCollapsed}`}
          >
            Main menu
          </p>
          {items.map(({ value, label, icon: Icon }) => {
            const isActive = value === active;
            return (
              <button
                key={value}
                type="button"
                onClick={() => select(value)}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring ${centerWhenCollapsed} ${
                  isActive
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                <span className={hideWhenCollapsed}>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* CHANGED: NEW - General section with Settings and the exit button */}
        <div className="space-y-1 border-t px-3 py-3">
          <p
            className={`px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground ${hideWhenCollapsed}`}
          >
            General
          </p>
          <button
            type="button"
            onClick={() => openAccount("settings")}
            title={collapsed ? "Settings" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${centerWhenCollapsed}`}
          >
            <Settings className="size-4 shrink-0" />
            <span className={hideWhenCollapsed}>Settings</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Log out" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive ${centerWhenCollapsed}`}
          >
            <LogOut className="size-4 shrink-0" />
            <span className={hideWhenCollapsed}>Log out</span>
          </button>
        </div>
      </aside>

      {/* Content (shifts with the sidebar width) */}
      <div
        className={`transition-[padding] duration-200 motion-reduce:transition-none ${
          collapsed ? "md:pl-[4.5rem]" : "md:pl-64"
        }`}
      >
        {/* CHANGED: NEW - top bar with the profile at the upper right */}
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 md:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary md:hidden"
            >
              <Menu className="size-5" />
            </button>

            <div className="relative ml-auto" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-3 rounded-full border bg-card py-1.5 pl-1.5 pr-3 transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {initial}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-sm font-medium">{displayName}</span>
                  {identity.role && (
                    <span className="block text-xs text-muted-foreground">{identity.role}</span>
                  )}
                </span>
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 animate-in fade-in slide-in-from-top-1 overflow-hidden rounded-2xl border bg-card shadow-xl duration-150"
                >
                  <div className="border-b px-4 py-3">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {profile.email || identity.role}
                    </p>
                  </div>
                  <div className="p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openAccount("profile")}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-secondary"
                    >
                      <User className="size-4 text-muted-foreground" />
                      My profile
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openAccount("settings")}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-secondary"
                    >
                      <Settings className="size-4 text-muted-foreground" />
                      Settings
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="size-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main>
          <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 md:px-8">
            {/* CHANGED: heading on the left, today's date on the right */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="font-display text-3xl font-semibold tracking-tight">{heading}</h1>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
              {today && (
                <div className="hidden items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm sm:inline-flex">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  {today}
                </div>
              )}
            </div>
            {children}
          </div>
        </main>
      </div>

      {account && (
        <AccountModal
          view={account}
          onViewChange={setAccount}
          onClose={() => setAccount(null)}
          profile={profile}
          username={identity.name}
          roleLabel={identity.role}
        />
      )}
    </div>
  );
}