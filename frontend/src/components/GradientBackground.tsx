import React from "react";
import "./GradientBackground.css";

export default function GradientBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="gradient-wrapper">
      <div className="gradient-inner">{children}</div>
    </div>
  );
}
