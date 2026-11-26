"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
// CHANGED: NEW - the shared card
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RegisterPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: false });
  // CHANGED: NEW - which step is showing (1 = account, 2 = about you)
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<"landlord" | "tenant">("landlord");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isChecking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // CHANGED: on step 1, only check the passwords and move to step 2
    if (step === 1) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      // the same two calls as before
      const user = await apiClient<{ id: number }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password, role }),
      });

      if (role === "landlord") {
        await apiClient(CONFIG.ENDPOINTS.LANDLORDS, {
          method: "POST",
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            id: user.id,
          }),
        });
      } else {
        await apiClient(CONFIG.ENDPOINTS.TENANTS, {
          method: "POST",
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            emergency_contact: emergencyContact,
            id: user.id,
          }),
        });
      }

      router.push(CONFIG.ROUTES.LOGIN);
    } catch (err: any) {
      setError(err.message);
      // CHANGED: a taken username belongs to step 1, so go back to it
      if (/username/i.test(err.message)) setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // CHANGED: everything below is the new design
  return (
    <AuthLayout
      active="register"
      heroTitle="Let's get you settled in."
      heroSubtitle="Leases, payments and repairs for landlords and tenants, in one place."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 2
              ? "Tell us a little about yourself."
              : role === "landlord"
              ? "Register to start managing your properties."
              : "Register to view your lease, payments and repair requests."}
          </p>
        </div>

        {/* step indicator */}
        <div className="flex items-center gap-2" aria-label={`Step ${step} of 2`}>
          <span className="h-1.5 flex-1 rounded-full bg-primary" />
          <span
            className={`h-1.5 flex-1 rounded-full ${step === 2 ? "bg-primary" : "bg-secondary"}`}
          />
          <span className="text-xs text-muted-foreground">Step {step} of 2</span>
        </div>

        {error && (
          <Alert variant="destructive" role="alert" className="py-2">
            <CircleAlert className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* STEP 1: account */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>I am a</Label>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
                {(["landlord", "tenant"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    aria-pressed={role === r}
                    className={`flex h-8 items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors ${
                      role === r
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r === "landlord" ? (
                      <Building2 className="size-4" />
                    ) : (
                      <KeyRound className="size-4" />
                    )}
                    {r === "landlord" ? "Landlord" : "Tenant"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-0 size-10 text-muted-foreground hover:bg-transparent"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10"
                required
              />
            </div>
          </div>
        )}

        {/* STEP 2: about you */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="09123456789"
                maxLength={20}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10"
                required
              />
            </div>

            {role === "tenant" && (
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency contact</Label>
                <Input
                  id="emergencyContact"
                  type="text"
                  placeholder="Name and number"
                  maxLength={100}
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="h-10"
                  required
                />
              </div>
            )}
          </div>
        )}

        {/* buttons */}
        {step === 1 ? (
          <Button type="submit" className="h-11 w-full rounded-full">
            Continue
            <ArrowRight className="ml-2 size-4" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full px-5"
              onClick={() => {
                setError("");
                setStep(1);
              }}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
            <Button type="submit" disabled={loading} className="h-11 flex-1 rounded-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </div>
        )}
      </form>
    </AuthLayout>
  );
}