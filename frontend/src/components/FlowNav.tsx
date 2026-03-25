import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ConstellationLogo from "./ConstellationLogo";
import { useView } from "../context/ViewContext";
import { useAuth } from "../context/AuthContext";
import { hasResearcherRole } from "../auth/session";

// Security uses same page as home "Privacy & Security" link (/security), not /security-research
const discoverLinks = [
  { path: "/", label: "Home" },
  { path: "/why", label: "Why Constellation" },
  { path: "/security", label: "Privacy & Security" },
];

/** Public links for guests (no login required). Submit requires sign-in + researcher role. */
const guestContributeLinks = [
  { path: "/browse", label: "Browse projects" },
  { path: "/leaderboard", label: "Leaderboard" },
];

export default function FlowNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isResearcher: viewIsResearcher } = useView();
  const { user, logout, isResearcher: accountIsResearcher, isVolunteer: accountIsVolunteer } = useAuth();
  const hasBothRoles = Boolean(user) && accountIsResearcher && accountIsVolunteer;

  /** Logged-in: everyone sees browse + leaderboard; submit only if account includes researcher (researcher-only or dual-role). */
  const contributeLinks = user
    ? [
        { path: "/browse", label: "Browse projects" },
        ...(hasResearcherRole(user.role)
          ? [{ path: "/submit", label: "Submit a project" }]
          : []),
        { path: "/leaderboard", label: "Leaderboard" },
      ]
    : guestContributeLinks;

  useEffect(() => setOpen(false), [location.pathname]);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      {/* Floating logo - top left */}
      <Link
        to="/"
        className="fixed top-5 left-5 z-30 flex items-center justify-center rounded-xl bg-white/5 backdrop-blur-md border border-white/10 h-12 px-5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
        aria-label="Constellation Home"
      >
        <ConstellationLogo height={32} className="opacity-95 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* Menu trigger - top right */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-5 right-5 z-30 flex items-center justify-center w-11 h-11 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        aria-label="Open menu"
      >
        <svg
          className="w-5 h-5 text-white/80"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay + slide panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-overlay-fade"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <aside
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col min-h-0 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl animate-slide-in-right"
            role="dialog"
            aria-label="Navigation menu"
          >
            <div className="shrink-0 pt-14 px-6 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-white/90">Menu</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-6 pb-8 touch-pan-y">
              <nav className="flex flex-col gap-6 pb-2">
                <div className="menu-stagger-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/50 mb-2">Discover</p>
                  <ul className="space-y-0.5">
                    {discoverLinks.map(({ path, label }) => {
                      const active =
                        path === "/"
                          ? location.pathname === "/"
                          : path === "/security"
                            ? location.pathname === "/security"
                            : location.pathname.startsWith(path);
                      return (
                        <li key={path}>
                          <button
                            type="button"
                            onClick={() => go(path)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-[15px] transition-colors ${
                              active ? "bg-white/15 text-white font-medium" : "text-white/80 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="menu-stagger-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/50 mb-2">
                    Contribute
                  </p>
                  <ul className="space-y-0.5">
                    {contributeLinks.map(({ path, label }) => {
                      const active =
                        path === "/leaderboard"
                          ? location.pathname === "/leaderboard"
                          : location.pathname.startsWith(path);
                      return (
                        <li key={`${path}-${label}`}>
                          <button
                            type="button"
                            onClick={() => go(path)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-[15px] transition-colors ${
                              active ? "bg-white/15 text-white font-medium" : "text-white/80 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {user ? (
                  <div className="menu-stagger-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-white/50 mb-2">
                      You {hasBothRoles ? "(Researcher & volunteer)" : viewIsResearcher ? "(Researcher)" : "(Volunteer)"}
                    </p>
                    <ul className="space-y-0.5">
                      {hasBothRoles ? (
                        <>
                          <li>
                            <button
                              type="button"
                              onClick={() => go("/researcher-profile")}
                              className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              Researcher profile
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => go("/profile")}
                              className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              Volunteer profile
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => go("/researcher")}
                              className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              Researcher dashboard
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => go("/dashboard")}
                              className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              Volunteer dashboard
                            </button>
                          </li>
                        </>
                      ) : (
                        <>
                          <li>
                            <button
                              type="button"
                              onClick={() => go(viewIsResearcher ? "/researcher-profile" : "/profile")}
                              className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              My profile
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => go(viewIsResearcher ? "/researcher" : "/dashboard")}
                              className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              My dashboard
                            </button>
                          </li>
                        </>
                      )}
                      <li>
                        <button
                          type="button"
                          onClick={() => go("/settings")}
                          className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          Settings
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            logout();
                            navigate("/");
                          }}
                          className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-colors"
                        >
                          Log out
                        </button>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div className="menu-stagger-3">
                    <ul className="space-y-0.5 pt-2 border-t border-white/10">
                      <li>
                        <button
                          type="button"
                          onClick={() => go("/login")}
                          className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          Sign in
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => go("/signup")}
                          className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium text-white bg-white/20 hover:bg-white/25 border border-white/20 transition-colors"
                        >
                          Sign up
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </nav>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
