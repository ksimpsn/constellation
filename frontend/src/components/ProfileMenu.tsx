import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import "./ProfileMenu.css";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we're on researcher profile or volunteer profile
  // Check for researcher routes (profile, dashboard, or any researcher-specific page)
  const isResearcherProfile = location.pathname === '/researcher-profile' ||
                               location.pathname === '/researcher' ||
                               location.pathname.startsWith('/researcher');

  // Check if we're on home page (don't show switch buttons on home)
  const isHomePage = location.pathname === '/';

  // Calculate dropdown position when opening
  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // 4px gap below button
        right: window.innerWidth - rect.right, // Distance from right edge
      });
    }
  }, [open]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // Check if click is on button or dropdown
      if (ref.current?.contains(target)) {
        return; // Click is on button, don't close
      }
      // Check if click is on dropdown (which is in portal)
      if (target.closest('.profile-dropdown')) {
        return; // Click is on dropdown, don't close
      }
      // Click is outside both, close dropdown
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="profile-container" ref={ref} style={{ zIndex: 10000, position: 'relative' }}>
      {/* Profile button */}
      <button className="profile-btn" onClick={() => setOpen(!open)}>
      <div className="profile-avatar">
          {/* small gray user icon */}
          <svg
            className="profile-user-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="12" cy="9" r="4" />
            <path d="M5 19c0-3.2 3-6 7-6s7 2.8 7 6" />
          </svg>
        </div>
        <span className="profile-arrow">{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown - rendered in portal to escape z-index constraints */}
      {open && createPortal(
        <div
          className="profile-dropdown"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            zIndex: 99999,
          }}
        >
          <div
            className="dropdown-item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              navigate(isResearcherProfile ? "/researcher-profile" : "/profile");
            }}
          >
            My Profile
          </div>
          <div
            className="dropdown-item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              navigate(isResearcherProfile ? "/researcher" : "/dashboard");
            }}
          >
            My Dashboard
          </div>
          <div
            className="dropdown-item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              navigate("/leaderboard");
            }}
          >
            Leaderboard
          </div>
          <div
            className="dropdown-item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              navigate("/settings");
            }}
          >
            Settings
          </div>

          {/* Switch buttons - only show if not on home page */}
          {!isHomePage && (
            <>
              <div className="dropdown-divider"></div>
              {isResearcherProfile ? (
                <div
                  className="dropdown-item switch-profile"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(false);
                    navigate("/profile");
                  }}
                >
                  Switch to Volunteer
                </div>
              ) : (
                <div
                  className="dropdown-item switch-profile"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(false);
                    navigate("/researcher-profile");
                  }}
                >
                  Switch to Researcher
                </div>
              )}
            </>
          )}

          <div className="dropdown-divider"></div>

          <div className="dropdown-item logout">Log Out</div>
        </div>,
        document.body
      )}
    </div>
  );
}
