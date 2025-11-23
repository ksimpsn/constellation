import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileMenu.css";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="profile-container" ref={ref}>
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

      {/* Dropdown */}
      {open && (
        <div className="profile-dropdown">
          <div className="dropdown-item">My Profile</div>
          <div
            className="dropdown-item"
            onClick={() => {
              setOpen(false);
              navigate("/dashboard");   // route that renders Dashboard.tsx
            }}
          >
            My Dashboard
          </div>
          <div className="dropdown-item">Settings</div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-item logout">Log Out</div>
        </div>
      )}
    </div>
  );
}
