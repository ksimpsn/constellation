/**
 * Backend API base URL. Default 5001 avoids macOS AirPlay on 5000.
 * Override: VITE_API_URL in .env (e.g. http://192.168.1.10:5001)
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

export function getApiUrl(): string {
  return API_BASE_URL;
}

export function getBackendPort(): string {
  try {
    return new URL(API_BASE_URL).port || "5001";
  } catch {
    return "5001";
  }
}
