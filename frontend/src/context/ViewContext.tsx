import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { hasResearcherRole, hasVolunteerRole, VIEW_MODE_STORAGE_KEY } from "../auth/session";

export type ViewMode = "researcher" | "volunteer";

type ViewContextValue = {
  view: ViewMode;
  setView: (next: ViewMode) => void;
  isResearcher: boolean;
  isVolunteer: boolean;
};

const ViewContext = createContext<ViewContextValue | null>(null);

function readStoredView(): ViewMode {
  try {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === "researcher" || stored === "volunteer") return stored;
  } catch {
    // ignore
  }
  return "volunteer";
}

function isResearcherPath(pathname: string): boolean {
  return (
    pathname === "/researcher-profile" ||
    pathname === "/researcher" ||
    pathname.startsWith("/researcher")
  );
}

export function ViewProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setViewState] = useState<ViewMode>(() => readStoredView());

  // Logged-in users: single role forces view; both roles keep saved preference
  useEffect(() => {
    if (!user) return;
    const hasR = hasResearcherRole(user.role);
    const hasV = hasVolunteerRole(user.role);
    let next: ViewMode;
    if (hasR && !hasV) {
      next = "researcher";
    } else if (!hasR && hasV) {
      next = "volunteer";
    } else if (hasR && hasV) {
      next = readStoredView();
    } else {
      next = "volunteer";
    }
    setViewState(next);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, [user?.user_id, user?.role]);

  // Sync view from URL on first load when no stored preference (e.g. direct link to /researcher)
  useEffect(() => {
    if (user) return;
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored) return;
    const fromPath = isResearcherPath(location.pathname) ? "researcher" : "volunteer";
    setViewState((prev) => (fromPath !== prev ? fromPath : prev));
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, fromPath);
    } catch {
      // ignore
    }
  }, [location.pathname, user]);

  const setView = useCallback(
    (next: ViewMode) => {
      setViewState(next);
      try {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      if (next === "researcher") {
        navigate("/researcher");
      } else {
        navigate("/dashboard");
      }
    },
    [navigate]
  );

  const value: ViewContextValue = {
    view,
    setView,
    isResearcher: view === "researcher",
    isVolunteer: view === "volunteer",
  };

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}

export function useView(): ViewContextValue {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useView must be used within ViewProvider");
  return ctx;
}
