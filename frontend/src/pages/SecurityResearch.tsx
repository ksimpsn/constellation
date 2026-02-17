import React from "react";
import { Link } from "react-router-dom";
import GradientBackground from "../components/GradientBackground";

export default function SecurityResearch() {
  return (
    <GradientBackground>
      <div style={{ marginTop: "auto", textAlign: "center", alignSelf: "center" }}>
        <Link to="/security" style={{ fontSize: "18px", color: "black", textDecoration: "none" }}>
          ← Privacy & Security
        </Link>
      </div>
      <h1>Security Research</h1>

      <div style={simpleBox}>
        <h2 style={boxTitle}>Security Overview</h2>

        <div style={contentSection}>
          <h3>Zero-Access Principle</h3>
          <p>Constellation only uses CPU time. We never access:</p>
          <ul>
            <li>Files on your computer</li>
            <li>Browser data or history</li>
            <li>Webcam or microphone</li>
            <li>Environment variables</li>
            <li>Personal information</li>
          </ul>
        </div>

        <div style={contentSection}>
          <h3>Multi-Layer Security</h3>
          <ol>
            <li><strong>Code Validation:</strong> Only safe workloads (math, ML, encoding)</li>
            <li><strong>Sandbox Inspection:</strong> Isolated environment, no system access</li>
            <li><strong>Result Verification:</strong> Redundant execution across multiple machines</li>
          </ol>
        </div>

        <div style={contentSection}>
          <h3>Container Isolation</h3>
          <p>Tasks run in Docker-like containers with industry-standard security:</p>
          <div style={permissionsTable}>
            <div style={permissionColumn}>
              <strong>Allowed:</strong>
              <ul>
                <li>Numeric computation</li>
                <li>Temporary storage</li>
                <li>Self-termination</li>
              </ul>
            </div>
            <div style={permissionColumn}>
              <strong>Blocked:</strong>
              <ul>
                <li>File system access</li>
                <li>Network connections</li>
                <li>Process spawning</li>
                <li>Privilege escalation</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={contentSection}>
          <h3>Consensus Verification</h3>
          <p>Results are cross-checked across multiple volunteers. Mismatches are automatically rejected, making tampering mathematically improbable.</p>
        </div>

        <div style={contentSection}>
          <h3>Data Collection</h3>
          <div style={dataGrid}>
            <div style={dataColumn}>
              <strong>We Collect:</strong>
              <ul>
                <li>CPU time contributed</li>
                <li>Task completion status</li>
              </ul>
            </div>
            <div style={dataColumn}>
              <strong>We Never Collect:</strong>
              <ul>
                <li>Personal data</li>
                <li>System information</li>
                <li>Network activity</li>
                <li>Location data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <Link to="/signup" style={{
          background: "linear-gradient(45deg, #2196F3, #21CBF3)",
          color: "white",
          padding: "12px 28px",
          borderRadius: "6px",
          textDecoration: "none",
          display: "inline-block"
        }}>
          Join Secure Computing
        </Link>
      </div>
    </GradientBackground>
  );
}

const section: React.CSSProperties = {
  background: "transparent",
  borderRadius: "8px",
  marginTop: "20px",
  display: "flex",
  justifyContent: "center",
  color: "black",
  padding: "20px 0",
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

const securityIcon: React.CSSProperties = {
  fontSize: "48px",
  textAlign: "center",
  margin: "20px 0",
};

const introText: React.CSSProperties = {
  fontSize: "18px",
  textAlign: "center",
  margin: "20px 0",
  lineHeight: "1.6",
};

const accessGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "15px",
  margin: "20px 0",
};

const accessItem: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "15px",
  background: "rgba(255, 255, 255, 0.1)",
  borderRadius: "8px",
  textAlign: "center",
};

const accessIcon: React.CSSProperties = {
  fontSize: "24px",
  marginBottom: "8px",
};

const explanation: React.CSSProperties = {
  fontStyle: "italic",
  color: "#666",
  margin: "15px 0",
  textAlign: "center",
};

const verificationSteps: React.CSSProperties = {
  margin: "30px 0",
};

const step: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  margin: "20px 0",
  padding: "15px",
  background: "rgba(255, 255, 255, 0.05)",
  borderRadius: "8px",
};

const stepNumber: React.CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "50%",
  background: "#2196F3",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  marginRight: "15px",
  flexShrink: 0,
};

const stepContent: React.CSSProperties = {
  flex: 1,
};

const sandboxComparison: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "30px",
  margin: "30px 0",
};

const sandboxInfo: React.CSSProperties = {
  padding: "20px",
  background: "rgba(255, 255, 255, 0.05)",
  borderRadius: "8px",
};

const comparison: React.CSSProperties = {
  fontSize: "14px",
  color: "#666",
  marginTop: "15px",
  fontStyle: "italic",
};

const sandboxCapabilities: React.CSSProperties = {
  padding: "20px",
  background: "rgba(255, 255, 255, 0.05)",
  borderRadius: "8px",
};

const consensusDiagram: React.CSSProperties = {
  margin: "30px 0",
  padding: "20px",
  background: "rgba(255, 255, 255, 0.05)",
  borderRadius: "8px",
};

const consensusSteps: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "15px",
  margin: "20px 0",
};

const consensusStep: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const consensusIcon: React.CSSProperties = {
  fontSize: "20px",
};

const consensusNote: React.CSSProperties = {
  marginTop: "15px",
  fontSize: "14px",
  color: "#666",
  fontStyle: "italic",
  textAlign: "center",
};

const privacyGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  margin: "30px 0",
};

const privacyCard: React.CSSProperties = {
  padding: "20px",
  background: "rgba(255, 255, 255, 0.05)",
  borderRadius: "8px",
  textAlign: "center",
};

const heroSection: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "50px",
  padding: "40px 20px",
  background: "rgba(255, 255, 255, 0.02)",
  borderRadius: "12px",
};

const securityBadge: React.CSSProperties = {
  display: "inline-block",
  background: "linear-gradient(45deg, #2196F3, #21CBF3)",
  color: "white",
  padding: "6px 16px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold",
  letterSpacing: "1px",
  textTransform: "uppercase",
  marginBottom: "20px",
};

const heroTitle: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: "300",
  color: "#333",
  margin: "20px 0",
  lineHeight: "1.2",
};

const heroText: React.CSSProperties = {
  fontSize: "18px",
  color: "#666",
  lineHeight: "1.6",
  maxWidth: "600px",
  margin: "0 auto",
};

const principlesGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "30px",
  marginBottom: "50px",
};

const principle: React.CSSProperties = {
  padding: "30px",
  background: "rgba(255, 255, 255, 0.8)",
  borderRadius: "12px",
  border: "1px solid rgba(0, 0, 0, 0.05)",
  textAlign: "center",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
};

const principleIcon: React.CSSProperties = {
  fontSize: "32px",
  marginBottom: "15px",
};

const technicalSection: React.CSSProperties = {
  marginBottom: "50px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#333",
  marginBottom: "20px",
  borderBottom: "2px solid #2196F3",
  paddingBottom: "10px",
};

const detailGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "30px",
  marginTop: "30px",
};

const detailCard: React.CSSProperties = {
  padding: "25px",
  background: "rgba(255, 255, 255, 0.8)",
  borderRadius: "10px",
  border: "1px solid rgba(0, 0, 0, 0.05)",
};

const pipeline: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "20px",
};

const pipelineStep: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
};

const stepBadge: React.CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "#2196F3",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  fontSize: "14px",
};

const pipelineArrow: React.CSSProperties = {
  fontSize: "18px",
  color: "#666",
  fontWeight: "bold",
};

const permissionsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginTop: "20px",
};

const permissionColumn: React.CSSProperties = {
  textAlign: "center",
};

const permissionList: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  textAlign: "left",
};

const policySection: React.CSSProperties = {
  marginBottom: "50px",
};

const policyCards: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "30px",
  marginTop: "30px",
};

const policyCard: React.CSSProperties = {
  padding: "25px",
  background: "rgba(255, 255, 255, 0.8)",
  borderRadius: "10px",
  border: "1px solid rgba(0, 0, 0, 0.05)",
};

const policyHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "15px",
};

const policyIcon: React.CSSProperties = {
  fontSize: "20px",
};

const policyList: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  fontSize: "14px",
  color: "#666",
};

const statsSection: React.CSSProperties = {
  marginBottom: "40px",
};

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "20px",
  marginTop: "30px",
};

const statCard: React.CSSProperties = {
  padding: "25px",
  background: "rgba(255, 255, 255, 0.8)",
  borderRadius: "10px",
  border: "1px solid rgba(0, 0, 0, 0.05)",
  textAlign: "center",
};

const statValue: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#2196F3",
  marginBottom: "8px",
};

const statDescription: React.CSSProperties = {
  fontSize: "12px",
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: "1px",
  fontWeight: "600",
};

const simpleBox: React.CSSProperties = {
  maxWidth: "800px",
  margin: "20px auto",
  background: "white",
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "30px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
};

const boxTitle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "600",
  color: "#333",
  marginBottom: "30px",
  textAlign: "center",
  borderBottom: "2px solid #2196F3",
  paddingBottom: "15px",
};

const contentSection: React.CSSProperties = {
  marginBottom: "25px",
};

const permissionsTable: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginTop: "15px",
};

const dataGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginTop: "15px",
};

const dataColumn: React.CSSProperties = {
  padding: "15px",
  background: "#f8f9fa",
  borderRadius: "6px",
};
