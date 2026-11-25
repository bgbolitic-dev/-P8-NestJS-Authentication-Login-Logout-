"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUserRole } from "@/lib/auth";
import { CONFIG } from "@/lib/config";

interface AuthGuardOptions {
  requireAuth?: boolean;
  // CHANGED: NEW - which kind of user the page is for
  role?: "landlord" | "tenant";
}

// CHANGED: role added to the options
export function useAuthGuard({ requireAuth = true, role }: AuthGuardOptions = {}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const userIsAuth = isAuthenticated();

    // CHANGED: NEW - work out who is logged in and whether this is the wrong page for them
    // (anyone who is not a tenant counts as a landlord, so older accounts still work)
    const isTenant = getUserRole() === "tenant";
    const wrongPage =
      role === "tenant" ? !isTenant : role === "landlord" ? isTenant : false;

    if (requireAuth && !userIsAuth) {
      router.replace(CONFIG.ROUTES.LOGIN);
    } else if (requireAuth && userIsAuth && wrongPage) {
      // CHANGED: NEW - send them to the page that matches their role
      router.replace(
        isTenant ? CONFIG.ROUTES.TENANT_DASHBOARD : CONFIG.ROUTES.DASHBOARD
      );
    } else if (!requireAuth && userIsAuth) {
      router.replace(
        isTenant ? CONFIG.ROUTES.TENANT_DASHBOARD : CONFIG.ROUTES.DASHBOARD
      );
    } else {
      setIsChecking(false);
    }
  }, [requireAuth, role, router]);

  return { isChecking };
}