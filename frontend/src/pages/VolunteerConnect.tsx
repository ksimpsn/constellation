import { useState } from "react";
import GradientBackground from "../components/GradientBackground";
import { getApiUrl } from "../api/config";

export default function VolunteerConnect() {
  const [userId, setUserId] = useState("");
  const [workerName, setWorkerName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const base = getApiUrl();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !workerName.trim()) {
      setMessage("Please enter your user ID and worker name.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(`${base}/api/workers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId.trim(), worker_name: workerName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Registration failed");
        return;
      }
      setStatus("success");
      setMessage(`Connected as worker: ${data.worker_id}`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Request failed. Is the API URL correct?");
    }
  };

  return (
    <GradientBackground>
      <h1 style={{ fontSize: "36px", marginBottom: "12px" }}>
        Connect as Worker
      </h1>
      <p style={{ fontSize: "16px", color: "#555", marginBottom: "24px", maxWidth: "560px" }}>
        Enter your user ID and a name for this machine. You must run the following command on this computer first (replace <code>&lt;head_ip&gt;</code> with the researcher&apos;s head node IP, e.g. <code>127.0.0.1</code> for same machine):
      </p>
      <pre
        style={{
          background: "rgba(0,0,0,0.08)",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          overflow: "auto",
          marginBottom: "8px",
          textAlign: "left",
        }}
      >
        RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1 ray start --address=&lt;head_ip&gt;:6379
      </pre>
      <p style={{ fontSize: "12px", color: "#666", marginBottom: "24px" }}>
        On macOS and Windows the <code>RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1</code> prefix is required; on Linux you can omit it.
      </p>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
        Current API URL: <strong>{base}</strong> (change in Settings if needed)
      </p>

      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px", width: "100%" }}>
        <div>
          <label style={{ display: "block", fontSize: "16px", marginBottom: "6px" }}>User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g. demo-volunteer"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "16px", marginBottom: "6px" }}>Worker name (this machine)</label>
          <input
            type="text"
            value={workerName}
            onChange={(e) => setWorkerName(e.target.value)}
            placeholder="e.g. MyLaptop"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            padding: "14px 28px",
            background: "black",
            color: "white",
            fontSize: "18px",
            border: "none",
            borderRadius: "6px",
            cursor: status === "loading" ? "wait" : "pointer",
          }}
        >
          {status === "loading" ? "Connecting…" : "Connect as worker"}
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: "20px",
            padding: "12px",
            borderRadius: "8px",
            background: status === "error" ? "rgba(200,0,0,0.1)" : "rgba(0,120,0,0.1)",
            color: status === "error" ? "#c00" : "#2e7d32",
          }}
        >
          {message}
        </p>
      )}

      <div style={{ marginTop: "40px" }}>
        <a href="/" style={{ fontSize: "18px", color: "black" }}>
          ← Back to Home
        </a>
      </div>
    </GradientBackground>
  );
}
