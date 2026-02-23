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
      <div className="relative z-10 px-6 pt-24 pb-16 max-w-5xl mx-auto w-full">
        <h1 className="text-4xl font-bold text-white/90 mb-10 text-center">My Profile</h1>

        <div className="flex flex-col lg:flex-row gap-10 items-start w-full">
          {/* Avatar & name */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div
              className="w-[150px] h-[150px] rounded-full flex items-center justify-center bg-white/10 border border-white/20"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
            >
              <svg viewBox="0 0 24 24" className="w-[70px] h-[70px]" style={{ fill: 'rgba(255,255,255,0.9)' }}>
                <circle cx="12" cy="9" r="4" />
                <path d="M5 19c0-3.2 3-6 7-6s7 2.8 7 6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white/90 m-0">John Doe</h2>
            <p className="text-lg text-white/70 m-0">@johndoe</p>
          </div>

          {/* Details & stats */}
          <div className="flex-1 flex flex-col gap-6 w-full">
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <h3 className="text-xl font-bold text-white/90 m-0 mb-5">Account Information</h3>
              <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                <span className="text-white/70 font-medium">Name</span>
                <span className="text-white/90">John Doe</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                <span className="text-white/70 font-medium">Username</span>
                <span className="text-white/90">@johndoe</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                <span className="text-white/70 font-medium">Account Type</span>
                <span className="text-white/90">Volunteer</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-white/70 font-medium">Member Since</span>
                <span className="text-white/90">January 2024</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
                <div className="text-3xl font-bold text-white/90 mb-1">12</div>
                <div className="text-xs font-semibold text-white/60 uppercase tracking-wide">Projects Contributed</div>
              </div>
              <div className="p-5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
                <div className="text-3xl font-bold text-white/90 mb-1">47</div>
                <div className="text-xs font-semibold text-white/60 uppercase tracking-wide">Sessions Logged</div>
              </div>
              <div className="p-5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
                <div className="text-3xl font-bold text-white/90 mb-1">3</div>
                <div className="text-xs font-semibold text-white/60 uppercase tracking-wide">Publications</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mt-10">
          <button
            type="button"
            className="py-3.5 px-6 rounded-xl font-medium text-white bg-white/20 hover:bg-white/30 border border-white/20 transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
          <Link to="/settings" className="no-underline">
            <button
              type="button"
              className="py-3.5 px-6 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors cursor-pointer"
            >
              Account Settings
            </button>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="py-3.5 px-6 rounded-xl font-medium text-white bg-red-500/80 hover:bg-red-500 border border-red-400/50 transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
