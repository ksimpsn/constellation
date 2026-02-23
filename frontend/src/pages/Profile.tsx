import { useNavigate, Link } from 'react-router-dom';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import FlowNav from '../components/FlowNav';

export default function Profile() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 px-4 sm:px-6 pt-20 sm:pt-24 pb-20 max-w-4xl mx-auto w-full min-h-screen">
        {/* Hero */}
        <header className="text-center mb-12 sm:mb-14">
          <p className="text-sm uppercase tracking-[0.2em] text-white/50 mb-3">Your account</p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-white tracking-tight">My Profile</h1>
          <div className="w-16 h-px bg-gradient-to-r from-violet-400/60 via-white/40 to-emerald-400/60 mx-auto mt-5 rounded-full" />
        </header>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-stretch w-full">
          {/* Left: Avatar + identity card */}
          <div className="lg:w-[280px] shrink-0 flex flex-col">
            <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 flex flex-col items-center text-center">
              <div
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-white/15 to-white/5 border border-white/20 mb-5"
                style={{ boxShadow: '0 0 40px rgba(139,92,246,0.15), 0 8px 32px rgba(0,0,0,0.2)' }}
              >
                <svg viewBox="0 0 24 24" className="w-14 h-14 sm:w-16 sm:h-16 text-white/90" fill="currentColor">
                  <circle cx="12" cy="9" r="4" />
                  <path d="M5 19c0-3.2 3-6 7-6s7 2.8 7 6" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">John Doe</h2>
              <p className="text-white/60 text-sm font-medium">@johndoe</p>
              <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium">
                Volunteer
              </span>
            </div>
            {/* Quick links */}
            <div className="mt-4 flex flex-col gap-2">
              <Link
                to="/dashboard"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/85 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-sm font-medium no-underline"
              >
                Dashboard
                <span className="text-white/50" aria-hidden>→</span>
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/85 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-sm font-medium no-underline"
              >
                Leaderboard
                <span className="text-white/50" aria-hidden>→</span>
              </Link>
            </div>
          </div>

          {/* Right: Details + stats */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { value: '12', label: 'Projects', accent: 'violet' },
                { value: '47', label: 'Sessions', accent: 'emerald' },
                { value: '3', label: 'Publications', accent: 'violet' },
              ].map(({ value, label, accent }) => (
                <div
                  key={label}
                  className={`p-5 rounded-2xl border backdrop-blur-sm text-center transition-all duration-200 hover:border-white/20 ${
                    accent === 'violet'
                      ? 'bg-violet-500/10 border-violet-400/20'
                      : 'bg-emerald-500/10 border-emerald-400/20'
                  }`}
                >
                  <div
                    className={`text-2xl sm:text-3xl font-bold mb-1 ${
                      accent === 'violet' ? 'text-violet-200' : 'text-emerald-200'
                    }`}
                  >
                    {value}
                  </div>
                  <div className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>

            {/* Account information */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-violet-400/80" aria-hidden />
                Account Information
              </h3>
              <dl className="space-y-0">
                {[
                  { term: 'Name', value: 'John Doe' },
                  { term: 'Username', value: '@johndoe' },
                  { term: 'Account type', value: 'Volunteer' },
                  { term: 'Member since', value: 'January 2024' },
                ].map(({ term, value }) => (
                  <div
                    key={term}
                    className="flex justify-between items-center py-4 border-b border-white/10 last:border-0 last:pb-0"
                  >
                    <dt className="text-white/60 text-sm font-medium">{term}</dt>
                    <dd className="text-white/95 font-medium text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-12 flex flex-wrap gap-3 justify-center sm:justify-start">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-white bg-emerald-500/25 border border-emerald-400/40 hover:bg-emerald-500/35 hover:border-emerald-400/50 transition-all"
          >
            Edit Profile
          </button>
          <Link to="/settings" className="no-underline">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-white/95 bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all"
            >
              Account Settings
            </button>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-red-200 bg-red-500/20 border border-red-400/30 hover:bg-red-500/30 hover:border-red-400/50 transition-all"
          >
            Log out
          </button>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
