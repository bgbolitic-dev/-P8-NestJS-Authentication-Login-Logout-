// lib/auth.ts
import { CONFIG } from "./config";

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);

  if (!token || token === "undefined" || token === "null") {
    return null;
  }
  return token;
};

// JWTs use base64url (- and _, no padding), but atob() only reads standard
// base64, so convert first or some tokens fail to decode.
const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

export const getUserId = (): number | null => {
  const token = getAccessToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  const userId = payload?.sub ?? payload?.id ?? payload?.userId;
  return userId ? Number(userId) : null;
};

export const getUsername = (): string | null => {
  const token = getAccessToken();
  if (!token) return null;
  return decodeJwtPayload(token)?.username ?? null;
};

// Only works if your backend puts `role` in the token.
// Useful later for sending landlords and tenants to different dashboards.
export const getUserRole = (): string | null => {
  const token = getAccessToken();
  if (!token) return null;
  return decodeJwtPayload(token)?.role ?? null;
};

export const setTokens = (accessToken?: string, refreshToken?: string): void => {
  if (typeof window === "undefined") return;

  if (accessToken && accessToken !== "undefined" && accessToken !== "null") {
    localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  } else {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  }

  if (refreshToken && refreshToken !== "undefined" && refreshToken !== "null") {
    localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  } else {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  }
};

export const clearTokens = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};