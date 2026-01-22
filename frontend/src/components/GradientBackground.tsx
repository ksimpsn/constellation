import React from "react";
import "./GradientBackground.css";
import ProfileMenu from "./ProfileMenu";
import { useNavigate, useLocation } from "react-router-dom";

export default function GradientBackground({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

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

          {isHomePage ? (
            <button
              onClick={() => navigate("/signup")}
              style={{
                padding: "10px 20px",
                background: "black",
                color: "white",
                fontSize: "16px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              Sign In
            </button>
          ) : (
            <ProfileMenu />
          )}
        </div>
        {children}</div>
    </div>
  );
}
