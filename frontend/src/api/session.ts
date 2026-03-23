import { getApiUrl } from "./config";

/** Fetch with session cookie (Flask server-side session). */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = getApiUrl().replace(/\/$/, "");
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  return fetch(url, {
    ...init,
    credentials: "include",
  });
}
