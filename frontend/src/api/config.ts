/**
 * API base URL for Constellation backend (head node).
 * Default: VITE_API_URL env or http://localhost:5001
 * Volunteers set this to the researcher's machine (e.g. http://192.168.1.50:5001)
 */
const STORAGE_KEY = "constellation_api_url";
const DEFAULT_URL =
  // @ts-expect-error Vite injects import.meta.env
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL)
    : "http://localhost:5001";

export function getApiUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
  } catch {
    /* ignore */
  }
  return DEFAULT_URL;
}

export function setApiUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url.trim());
}

export function getStoredRole(): "researcher" | "volunteer" | null {
  try {
    const r = localStorage.getItem("constellation_role");
    if (r === "researcher" || r === "volunteer") return r;
  } catch {
    /* ignore */
  }
  return null;
}

export function setStoredRole(role: "researcher" | "volunteer"): void {
  localStorage.setItem("constellation_role", role);
}
