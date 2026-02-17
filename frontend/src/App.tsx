import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Why from "./pages/Why.tsx";
import Security from "./pages/Security.tsx";
import BrowseProjects from "./pages/BrowseProjects.tsx";
import SubmitProject from "./pages/SubmitProject.tsx";
import ResearcherDashboard from "./pages/ResearcherDashboard.tsx";
import Signup from "./pages/Signup.tsx";
import Login from "./pages/Login.tsx";
import ProjectDetails from "./pages/ProjectDetails.tsx";
import Profile from "./pages/Profile.tsx";
import ResearcherProfile from "./pages/ResearcherProfile.tsx";
import Settings from "./pages/Settings.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import BigDipperDemo from "./components/BigDipperDemo.tsx";
import SecurityResearch from "./pages/SecurityResearch.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/why" element={<Why />} />
        <Route path="/security" element={<Security />} />
        <Route path="/security-research" element={<SecurityResearch />} />
        <Route path="/browse" element={<BrowseProjects />} />
        <Route path="/submit" element={<SubmitProject />} />
        <Route path="/researcher" element={<ResearcherDashboard />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/researcher-profile" element={<ResearcherProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/big-dipper" element={<BigDipperDemo />} />
        <Route path="/project/:projectName" element={<ProjectDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
