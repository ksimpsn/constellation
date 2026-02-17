import { Link } from 'react-router-dom';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import AppNav from '../components/AppNav';

export default function Why() {
  return (
    <ConstellationStarfieldBackground>
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <AppNav variant="dark" />
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white/90 leading-tight">
              Why Constellation?
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"></div>
          </div>

          {/* Content Sections */}
          <div className="space-y-16">
            {/* What is Distributed Computing */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
              <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-6 group-hover:text-white transition-colors duration-300">
                What is Distributed Computing?
              </h2>
              <p className="text-xl text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                Distributed computing allows thousands of individual devices—laptops, desktops, and phones—to work together on large computational problems.
              </p>
            </div>

            {/* What Works Today */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20">
              <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-6 group-hover:text-white transition-colors duration-300">
                What Works Today
              </h2>
              <p className="text-xl text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                Platforms like BOINC and Folding@home have proven the power of this model, enabling major breakthroughs in areas such as protein folding and disease research.
              </p>
            </div>

            {/* The Limitation */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/20">
              <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-6 group-hover:text-white transition-colors duration-300">
                The Limitation
              </h2>
              <p className="text-xl text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                These systems depend almost entirely on volunteer altruism, making participation difficult to sustain at scale over long periods of time.
              </p>
            </div>

            {/* The Constellation Approach */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20">
              <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-6 group-hover:text-white transition-colors duration-300">
                The Constellation Approach
              </h2>
              <p className="text-xl text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                Constellation builds on the success of volunteer computing by introducing a meaningful incentive structure—unlocking consistent participation and transforming distributed computing into a scalable, dependable network.
              </p>
            </div>
          </div>

          {/* Navigation to next page */}
          <div className="pt-8">
            <Link
              to="/security"
              className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
            >
              <span>Privacy and Security Concerns</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">↓</span>
            </Link>
          </div>


        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
