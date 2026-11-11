"use client";

import { useRouter } from "next/navigation";
import { Building2, LogOut, ShieldCheck } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { clearTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Keep these the same as the login and register pages
const APP_NAME = "BiGiBi";
const APP_TAGLINE = "Apartment Management";

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur dark:bg-background/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
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

      {/* Content */}
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your account.
          </p>
        </div>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">Welcome back</CardTitle>
              <CardDescription>
                You are signed in and your session is active.
              </CardDescription>
            </div>
          </CardHeader>
          
        </Card>
      </main>
    </div>
  );
}
