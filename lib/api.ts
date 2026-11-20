import { CONFIG } from "./config";
import { clearTokens, getAccessToken } from "./auth";

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requiresAuth = false, headers, ...restOptions } = options;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = getAccessToken();
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  // 1. Network failures (server down, wrong URL, CORS) throw before any
  //    response exists, so give them a readable message.
  let response: Response;
  try {
    response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string> | undefined),
      },
      ...restOptions,
    });
  } catch {
    throw new Error(
      "Unable to reach the server. Check your connection and that the API is running."
    );
  }

  // 2. Expired or invalid session
  if (response.status === 401 && requiresAuth) {
    clearTokens();
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== CONFIG.ROUTES.LOGIN
    ) {
      window.location.href = CONFIG.ROUTES.LOGIN;
    }
    throw new Error("Session expired. Please log in again.");
  }

  // 3. Parse safely: empty bodies (DELETE/204) and non-JSON replies
  //    (HTML error pages, proxy errors) no longer crash JSON.parse.
  const text = await response.text();
  let data: any = {};
  let isJson = true;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      isJson = false;
    }
  }

  if (!response.ok) {
    const apiMessage = isJson
      ? Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || data.error
      : undefined;

    throw new Error(
      apiMessage ||
        `Request failed (${response.status} ${response.statusText || "error"}).`
    );
  }

  if (!isJson) {
    throw new Error("The server returned an unexpected response.");
  }

  return data as T;
}