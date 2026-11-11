"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Building2, Eye, EyeOff, Loader2, CircleAlert } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

// Change these to match your brand
const APP_NAME = "BiGiBi";
const HERO_TITLE = "Manage your properties with ease";
const HERO_SUBTITLE =
  "Keep track of units, tenants, and payments in one simple place.";

export default function LoginPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: false });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isChecking) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiClient<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setTokens(data.accessToken, data.refreshToken);
      router.push(CONFIG.ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Left: photo panel (desktop only) */}
      <section className="relative hidden overflow-hidden lg:block">
        <Image
          src="/images/login-bg.jpg"
          alt="Modern apartment building"
          fill
          priority
          sizes="50vw"
          className="object-cover grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />

        <div className="absolute left-10 top-8 z-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-white text-slate-900">
            <Building2 className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            {APP_NAME}
          </span>
        </div>

        <div className="absolute inset-x-10 bottom-12 z-10 max-w-md space-y-3 text-white">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            {HERO_TITLE}
          </h2>
          <p className="text-base text-white/80">{HERO_SUBTITLE}</p>
        </div>
      </section>

      {/* Right: form panel */}
      <section className="flex min-h-screen flex-col bg-slate-100">
        <div className="flex items-center justify-between px-6 py-6 sm:px-10">
          {/* Logo shown on mobile only (the photo panel is hidden there) */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-900 text-white">
              <Building2 className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              {APP_NAME}
            </span>
          </div>

          <Link
            href={CONFIG.ROUTES.REGISTER}
            className="ml-auto inline-flex h-10 items-center rounded-full bg-slate-900 px-6 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Create account
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <Card className="w-full max-w-md rounded-2xl border-slate-200 bg-white py-0 shadow-xl">
            <CardContent className="p-8 sm:p-10">
              <div className="space-y-8">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    Welcome back
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Sign in to your account to continue.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  {error && (
                    <Alert variant="destructive" role="alert">
                      <CircleAlert className="size-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      autoComplete="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-0 top-0 size-11 text-muted-foreground hover:bg-transparent"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full bg-slate-900 text-white hover:bg-slate-800"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link
                    href={CONFIG.ROUTES.REGISTER}
                    className="font-medium text-slate-900 underline-offset-4 hover:underline"
                  >
                    Register
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="pb-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </section>
    </main>
  );
}
