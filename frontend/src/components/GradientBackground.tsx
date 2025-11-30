import React from "react";
import "./GradientBackground.css";
import ProfileMenu from "./ProfileMenu";
import { useNavigate } from "react-router-dom";

export default function GradientBackground({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="gradient-wrapper">
      <div className="gradient-inner">
      <div className="top-bar">
          <img
            src="/src/assets/logo.png"
            alt="Home"
            className="home-icon"
            onClick={() => navigate("/")}
          />

          <ProfileMenu />
        </div>
        {children}</div>
    </div>
  );
}
