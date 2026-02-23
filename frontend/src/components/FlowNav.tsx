import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ConstellationLogo from "./ConstellationLogo";
import { useView } from "../context/ViewContext";

const discoverLinks = [
  { path: "/", label: "Home" },
  { path: "/why", label: "Why Constellation" },
  { path: "/security", label: "Security" },
];

const contributeVolunteer = [
  { path: "/browse", label: "Browse projects" },
  { path: "/submit", label: "Submit a project" },
];

const contributeResearcher = [
  { path: "/submit", label: "Submit a project" },
  { path: "/browse", label: "Browse projects" },
];

export default function FlowNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { view, isResearcher, setView } = useView();
  const isHome = location.pathname === "/";
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  const showAuthInMenu = isHome || isAuthPage;
  const contributeLinks = isResearcher ? contributeResearcher : contributeVolunteer;

  useEffect(() => setOpen(false), [location.pathname]);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleSwitchView = () => {
    setOpen(false);
    setView(isResearcher ? "volunteer" : "researcher");
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
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl animate-slide-in-right"
            role="dialog"
            aria-label="Navigation menu"
          >
            <div className="p-6 pt-14">
              <div className="flex items-center justify-between mb-8">
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

              <nav className="flex flex-col gap-6">
                <div className="menu-stagger-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/50 mb-2">Discover</p>
                  <ul className="space-y-0.5">
                    {discoverLinks.map(({ path, label }) => {
                      const active = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
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
                    {isResearcher ? "Research" : "Contribute"}
                  </p>
                  <ul className="space-y-0.5">
                    {contributeLinks.map(({ path, label }) => {
                      const active = location.pathname.startsWith(path);
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

                <div className="menu-stagger-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/50 mb-2">
                    You {isResearcher ? "(Researcher)" : "(Volunteer)"}
                  </p>
                  <ul className="space-y-0.5">
                    {showAuthInMenu ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <li>
                          <button
                            type="button"
                            onClick={() => go(isResearcher ? "/researcher-profile" : "/profile")}
                            className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                          >
                            My profile
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => go(isResearcher ? "/researcher" : "/dashboard")}
                            className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                          >
                            My dashboard
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => go("/leaderboard")}
                            className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                          >
                            Leaderboard
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => go("/settings")}
                            className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                          >
                            Settings
                          </button>
                        </li>
                        <li className="pt-2 border-t border-white/10">
                          <button
                            type="button"
                            onClick={handleSwitchView}
                            className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-indigo-300 hover:bg-white/10 transition-colors"
                          >
                            Switch to {isResearcher ? "Volunteer" : "Researcher"}
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-red-300/90 hover:bg-red-500/10 transition-colors"
                          >
                            Log out
                          </button>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </nav>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
