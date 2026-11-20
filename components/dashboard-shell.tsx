"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Building2, LogOut, Menu, X } from "lucide-react";
import { clearTokens, getUserRole, getUsername } from "@/lib/auth";
import { CONFIG } from "@/lib/config";

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
  children: ReactNode;
}

export function DashboardShell({
  appName,
  tagline,
  items,
  active,
  onChange,
  title,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState({ name: "", role: "" });

  // Read the token after mount so server and browser render the same HTML
  useEffect(() => {
    const role = getUserRole() ?? "";
    setProfile({
      name: getUsername() ?? "Account",
      role: role ? role.charAt(0).toUpperCase() + role.slice(1) : "",
    });
  }, []);

  // Black theme: switch shadcn to its dark tokens, including dropdowns
  // and dialogs that render outside this component.
  useEffect(() => {
    const root = document.documentElement;
    const alreadyDark = root.classList.contains("dark");
    root.classList.add("dark");
    return () => {
      if (!alreadyDark) root.classList.remove("dark");
    };
  }, []);

  // Escape closes the mobile menu
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  const select = (value: string) => {
    onChange(value);
    setOpen(false);
  };

  const initial = (profile.name || "A").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-black/90 px-4 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex size-9 items-center justify-center rounded-md text-neutral-300 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          <Menu className="size-5" />
        </button>
        <span className="text-sm font-semibold tracking-tight">{appName}</span>
      </header>

      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-neutral-950 transition-transform motion-reduce:transition-none md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-white text-black">
              <Building2 className="size-4" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">{appName}</p>
              <p className="text-xs text-neutral-500">{tagline}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Profile */}
        <div className="mx-3 mb-4 flex items-center gap-3 rounded-lg border border-white/10 p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
            {initial}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{profile.name || "Account"}</p>
            {profile.role && (
              <p className="truncate text-xs text-neutral-500">{profile.role}</p>
            )}
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {items.map(({ value, label, icon: Icon }) => {
            const isActive = value === active;
            return (
              <button
                key={value}
                type="button"
                onClick={() => select(value)}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-white ${
                  isActive
                    ? "bg-white/10 font-medium text-white"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Log out */}
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
