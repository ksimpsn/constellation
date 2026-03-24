export const AUTH_STORAGE_KEY = "constellation_user";

export type AuthUser = {
  user_id: string;
  email: string;
  name: string;
  role: string;
};

export function hasResearcherRole(role: string): boolean {
  return role
    .split(",")
    .map((r) => r.trim())
    .includes("researcher");
}

export function hasVolunteerRole(role: string): boolean {
  return role
    .split(",")
    .map((r) => r.trim())
    .includes("volunteer");
}

export function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<AuthUser>;
    if (
      typeof data.user_id === "string" &&
      typeof data.email === "string" &&
      typeof data.name === "string" &&
      typeof data.role === "string"
    ) {
      return data as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: AuthUser): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearStoredUser(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}
