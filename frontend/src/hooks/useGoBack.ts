import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Navigate to the previous route in the stack. If the tab has no prior entry
 * (e.g. direct URL open), navigates to `fallbackPath`.
 */
export function useGoBack(fallbackPath = "/") {
  const navigate = useNavigate();
  return useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  }, [navigate, fallbackPath]);
}
