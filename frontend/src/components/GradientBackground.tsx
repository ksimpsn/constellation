import React from "react";
import "./GradientBackground.css";
import AppNav from "./AppNav";

export default function GradientBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="gradient-wrapper">
      <div className="gradient-inner">
        <div className="top-bar">
          <AppNav variant="light" />
        </div>
        {children}
      </div>
    </div>
  );
}
