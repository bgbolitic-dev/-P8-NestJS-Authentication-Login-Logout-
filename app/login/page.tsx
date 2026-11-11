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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

// Change these to match your brand
const APP_NAME = "BiGiBi";
const APP_TAGLINE = "Apartment Management";

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
    <main className="min-h-screen">
      {/* Full-screen hero with the building photo */}
      <div className="relative flex min-h-screen overflow-hidden">
        <Image
          src="/images/login-bg1.jpg"
          alt="Modern apartment building"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right grayscale"
        />
        {/* Soft wash so the card and logo stay legible on any photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/10 to-transparent" />

        {/* Brand: frosted pill so it stays readable on any photo */}
        <div className="absolute left-5 top-5 z-10 sm:left-10 sm:top-8">
          <div className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/70 py-2 pl-2 pr-4 shadow-sm backdrop-blur-md">
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Building2 className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-tight text-slate-900">
                {APP_NAME}
              </p>
              <p className="text-xs text-slate-600">{APP_TAGLINE}</p>
            </div>
          </div>
        </div>

        {/* Login card: centered on mobile, pinned left on desktop */}
        <div className="relative z-10 flex w-full items-center justify-center px-4 pb-8 pt-24 lg:justify-start lg:pl-28 xl:pl-40 2xl:pl-56">
          <Card className="w-full max-w-md rounded-2xl border-white/60 bg-white/85 py-2 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-1.5 px-8 pt-8 text-center">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Sign in
              </CardTitle>
              <CardDescription>
                Please enter your details to continue.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="space-y-5 px-8">
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
                    className="h-11 bg-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 bg-white pr-10"
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
                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 border-0 bg-transparent px-8 pb-8">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-slate-800 text-white hover:bg-slate-900"
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

                <p className="text-center text-sm text-muted-foreground">
                  New here?{" "}
                  <Link
                    href={CONFIG.ROUTES.REGISTER}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Create an account
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Footer */}
        <p className="absolute bottom-4 left-0 right-0 z-10 text-center text-xs text-slate-700">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>
    </main>
  );
}
