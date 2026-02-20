import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Why from "./pages/Why.tsx";
import Security from "./pages/Security.tsx";
import BrowseProjects from "./pages/BrowseProjects.tsx";
import SubmitProject from "./pages/SubmitProject.tsx";
import ResearcherDashboard from "./pages/ResearcherDashboard.tsx";
import VolunteerConnect from "./pages/VolunteerConnect.tsx";
import Signup from "./pages/Signup.tsx";
import ProjectDetails from "./pages/ProjectDetails.tsx";
import Profile from "./pages/Profile.tsx";
import Settings from "./pages/Settings.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/why" element={<Why />} />
        <Route path="/security" element={<Security />} />
        <Route path="/browse" element={<BrowseProjects />} />
        <Route path="/submit" element={<SubmitProject />} />
        <Route path="/researcher" element={<ResearcherDashboard />} />
        <Route path="/volunteer" element={<VolunteerConnect />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/project/:projectName" element={<ProjectDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
