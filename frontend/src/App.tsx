import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Why from "./pages/Why.tsx";
import Security from "./pages/Security.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/why" element={<Why />} />
        <Route path="/security" element={<Security />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
