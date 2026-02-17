import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/why", label: "Why" },
  { path: "/security", label: "Security" },
  { path: "/browse", label: "Browse" },
  { path: "/submit", label: "Submit" },
];

export default function AppNav({ variant = "light" }: { variant?: "light" | "dark" }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDark = variant === "dark";
  const isHome = location.pathname === "/";

  const linkClass = isDark
    ? "text-white/70 hover:text-white transition-colors"
    : "text-gray-600 hover:text-gray-900 transition-colors";

  const activeLinkClass = isDark
    ? "text-white font-medium"
    : "text-gray-900 font-medium";

  return (
    <nav
      className={`relative flex items-center justify-between w-full px-4 py-3 ${
        isDark ? "" : "bg-transparent"
      }`}
    >
      {/* Logo */}
      <Link
        to="/"
        className="flex-shrink-0 flex items-center gap-3"
        aria-label="Constellation Home"
      >
        <img
          src="/src/assets/logo.png"
          alt=""
          className="h-10 w-10 object-contain opacity-90 hover:opacity-100 transition-opacity"
        />
      </Link>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-6">
        {navLinks.map(({ path, label }) => {
          const isActive =
            path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={`text-sm font-medium ${isActive ? activeLinkClass : linkClass}`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Right side: auth / profile */}
      <div className="flex items-center gap-3">
        {isHome ? (
          <>
            <Link
              to="/login"
              className={`hidden sm:inline text-sm font-medium ${linkClass}`}
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              Sign Up
            </Link>
          </>
        ) : (
          <ProfileMenu />
        )}

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden p-2 rounded-lg ${isDark ? "text-white/80 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"}`}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className={`absolute top-full left-0 right-0 mt-1 py-3 px-4 md:hidden z-50 ${
            isDark ? "bg-slate-900/95 border border-white/10" : "bg-white border border-gray-200"
          } shadow-lg rounded-b-xl`}
        >
          <div className="flex flex-col gap-2">
            {navLinks.map(({ path, label }) => {
              const isActive =
                path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium ${isActive ? activeLinkClass : linkClass}`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
