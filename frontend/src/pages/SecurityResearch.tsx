import React from "react";
import GradientBackground from "../components/GradientBackground";

export default function SecurityResearch() {
  return (
    <GradientBackground>
      <div style={{ marginTop: "auto", textAlign: "center", alignSelf: "center" }}>
        <a href="/security" style={{ fontSize: "18px", color: "black" }}>
          ← Privacy & Security
        </a>
      </div>
      <h1>Security Research</h1>

      <div style={section}>
        <div style={researchContent}>
          <h2>Advanced Security Measures</h2>
          <p>
            Constellation employs cutting-edge security research to ensure the safety of distributed computing.
            Our security model is built on multiple layers of protection and continuous research into emerging threats.
          </p>

          <h3>Sandboxing Technology</h3>
          <p>
            Every computational task runs in a fully isolated sandbox environment. Research from leading
            universities in container security and process isolation informs our implementation, ensuring
            zero chance of cross-contamination between tasks or system compromise.
          </p>

          <h3>Cryptographic Verification</h3>
          <p>
            All code execution is cryptographically verified before runtime. We use advanced homomorphic
            encryption techniques and zero-knowledge proofs to validate computational integrity without
            compromising performance.
          </p>

          <h3>Continuous Threat Monitoring</h3>
          <p>
            Our security research team maintains 24/7 monitoring of distributed computing threats.
            Machine learning algorithms analyze execution patterns to detect anomalous behavior before
            it can impact the network.
          </p>

          <h3>Privacy-Preserving Computation</h3>
          <p>
            Building on research from institutions like MIT and Stanford, we implement multi-party
            computation protocols that allow collaborative processing without exposing individual data.
          </p>

          <h3>Regular Security Audits</h3>
          <p>
            Independent security firms conduct quarterly audits of our codebase. Our open-source
            security modules are peer-reviewed by the global cybersecurity community.
          </p>

          <div style={researchStats}>
            <div style={statItem}>
              <div style={statNumber}>99.99%</div>
              <div style={statLabel}>Uptime Security</div>
            </div>
            <div style={statItem}>
              <div style={statNumber}>0</div>
              <div style={statLabel}>Security Breaches</div>
            </div>
            <div style={statItem}>
              <div style={statNumber}>24/7</div>
              <div style={statLabel}>Threat Monitoring</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <a href="/signup" style={{
          background: "linear-gradient(45deg, #2196F3, #21CBF3)",
          color: "white",
          padding: "12px 28px",
          borderRadius: "6px",
          textDecoration: "none",
          display: "inline-block"
        }}>
          Join Secure Computing
        </a>
      </div>
    </GradientBackground>
  );
}

const section: React.CSSProperties = {
  height: "500px",
  background: "transparent",
  borderRadius: "8px",
  marginTop: "20px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: "black",
  overflowY: "auto",
  overflowX: "hidden",
};

const researchContent: React.CSSProperties = {
  maxWidth: "800px",
  width: "100%",
  textAlign: "left",
  lineHeight: "1.6",
};

const researchStats: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-around",
  marginTop: "40px",
  padding: "20px",
  background: "rgba(255, 255, 255, 0.1)",
  borderRadius: "10px",
  flexWrap: "wrap",
  gap: "20px",
};

const statItem: React.CSSProperties = {
  textAlign: "center",
  flex: "1 1 150px",
};

const statNumber: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: "bold",
  color: "#2196F3",
  marginBottom: "5px",
};

const statLabel: React.CSSProperties = {
  fontSize: "14px",
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: "1px",
};
