import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY = "constellation_view";

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
    const stored = localStorage.getItem(STORAGE_KEY);
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
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setViewState] = useState<ViewMode>(() => readStoredView());

  // Sync view from URL on first load when no stored preference (e.g. direct link to /researcher)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return;
    const fromPath = isResearcherPath(location.pathname) ? "researcher" : "volunteer";
    setViewState((prev) => (fromPath !== prev ? fromPath : prev));
    try {
      localStorage.setItem(STORAGE_KEY, fromPath);
    } catch {
      // ignore
    }
  }, [location.pathname]);

  const setView = useCallback(
    (next: ViewMode) => {
      setViewState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
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
