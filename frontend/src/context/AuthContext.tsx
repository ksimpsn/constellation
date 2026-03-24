import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type AuthUser,
  loadStoredUser,
  saveStoredUser,
  clearStoredUser,
  hasResearcherRole,
} from "../auth/session";

type AuthContextValue = {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isResearcher: boolean;
  isVolunteer: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());

  const login = useCallback((next: AuthUser) => {
    saveStoredUser(next);
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    clearStoredUser();
    setUser(null);
  }, []);

  const isResearcher = user ? hasResearcherRole(user.role) : false;
  const isVolunteer = user
    ? user.role.split(",").map((r) => r.trim()).includes("volunteer")
    : false;

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isResearcher,
      isVolunteer,
    }),
    [user, login, logout, isResearcher, isVolunteer]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
