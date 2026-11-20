export const CONFIG = {
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://appartment-rental-management-system.onrender.com",
  STORAGE_KEYS: {
    ACCESS_TOKEN: "accessToken",
    REFRESH_TOKEN: "refreshToken",
  },
  ROUTES: {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    DASHBOARD: "/dashboard",
  },
  ENDPOINTS: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    // One endpoint per table. Change a path here if your backend names it differently.
    LANDLORDS: "/landlords",
    PROPERTIES: "/properties",
    UNITS: "/units",
    TENANTS: "/tenants",
    LEASES: "/leases",
    RENT_PAYMENTS: "/rent_payments",
    MAINTENANCE_REQUESTS: "/maintenance_requests",
  },
} as const;