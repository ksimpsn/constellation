import React from "react";
import "./GradientBackground.css";
import FlowNav from "./FlowNav";

export default function GradientBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="gradient-wrapper">
      <div className="gradient-inner">
        <FlowNav />
        {children}
      </div>
    </div>
  );
}
