import GradientBackground from "../components/GradientBackground";
import { useState, useEffect, useRef } from "react";

export default function SubmitProject() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pyFile, setPyFile] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  // Track job ID, status, and results
  const [jobId, setJobId] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobResults, setJobResults] = useState<any | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setMessage("Please enter a project title.");
      return;
    }
    if (!pyFile || !dataFile) {
      setMessage("Please upload both your .py file and dataset.");
      return;
    }

    console.log("inside handle submit");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("py_file", pyFile);
    formData.append("data_file", dataFile);

    try {
      const response = await fetch("http://localhost:5001/submit", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage("Error: " + (result.error ?? "Unknown error"));
        return;
      }

      // Save job ID and reset status/results
      setJobId(result.job_id);
      setJobStatus("submitted");
      setJobResults(null);

      setMessage(`Project submitted successfully! Job ID: ${result.job_id}`);
    } catch (err) {
      console.error(err);
      setMessage("Failed to submit project.");
    }
  };

  // Check status function (used by polling)
  const checkStatus = async () => {
    if (jobId == null) return;

    try {
      const response = await fetch(`http://localhost:5001/status/${jobId}`);
      const result = await response.json();
      setJobStatus(result.status);

      // Auto-fetch results when job completes
      if (result.status === "complete" && jobResults === null) {
        handleGetResults();
      }
    } catch (err) {
      console.error(err);
      setJobStatus("error");
    }
  };

  // Fetch results
  const handleGetResults = async () => {
    if (jobId == null) return;

    try {
      const response = await fetch(`http://localhost:5001/results/${jobId}`);
      const result = await response.json();
      setJobResults(result.results);
    } catch (err) {
      console.error(err);
      setJobResults({ error: "Failed to fetch results" });
    }
  };

  // Poll status automatically when jobId is set
  useEffect(() => {
    if (jobId !== null && jobStatus !== "complete" && jobStatus !== "error") {
      // Poll immediately, then every 2 seconds
      checkStatus();
      pollingIntervalRef.current = setInterval(() => {
        checkStatus();
      }, 2000); // Poll every 2 seconds

      // Cleanup: stop polling when component unmounts or job completes
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    } else {
      // Stop polling if job is complete or error
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [jobId, jobStatus]); // Re-run when jobId or jobStatus changes

  return (
    <GradientBackground>
      <h1 style={{ fontSize: "36px", marginBottom: "20px" }}>
        Submit a Research Project
      </h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "25px",
          width: "80%",
          maxWidth: "700px",
        }}
      >
        {/* Project Title */}
        <div>
          <label style={{ fontSize: "18px" }}>Project Title</label>
          <input
            type="text"
            placeholder="e.g., Protein Folding Monte Carlo Simulation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              marginTop: "10px",
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              borderRadius: "6px",
              background: "white",
              color: "black",
              border: "1px solid #ccc",
              boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            }}
          />
        </div>

        {/* Description / Notes */}
        <div>
          <label style={{ fontSize: "18px" }}>Project Description / Notes</label>
          <textarea
            placeholder="Describe the purpose of the project, required resources, and what volunteers should know..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            style={{
              marginTop: "10px",
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              borderRadius: "6px",
              background: "white",
              color: "black",
              boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
              border: "1px solid #ccc",
              resize: "vertical",
            }}
          />
        </div>

        {/* Python File Upload */}
        <div>
          <label style={{ fontSize: "18px" }}>Upload Python Script (.py)</label>
          <input
            type="file"
            accept=".py"
            onChange={(e) => setPyFile(e.target.files?.[0] || null)}
            style={{ marginTop: "10px" }}
          />

          {pyFile && (
            <p style={{ color: "#444", marginTop: "6px" }}>
              Selected: <strong>{pyFile.name}</strong>
            </p>
          )}
        </div>

        {/* Dataset Upload */}
        <div>
          <label style={{ fontSize: "18px" }}>
            Upload Dataset (.csv or .json)
          </label>
          <input
            type="file"
            accept=".csv,.json"
            onChange={(e) => setDataFile(e.target.files?.[0] || null)}
            style={{ marginTop: "10px" }}
          />

          {dataFile && (
            <p style={{ color: "#444", marginTop: "6px" }}>
              Selected: <strong>{dataFile.name}</strong>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          style={{
            padding: "14px 28px",
            background: "black",
            color: "white",
            fontSize: "18px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            width: "fit-content",
          }}
        >
          Submit Project
        </button>

        {/* Message */}
        {message && (
          <p style={{ color: "#333", marginTop: "10px", fontSize: "16px" }}>
            {message}
          </p>
        )}

        {/* Job status + results */}
        {jobId !== null && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              borderRadius: "8px",
              background: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
              color: "black",
            }}
          >
            <p style={{ margin: 0, marginBottom: "8px" }}>
              <strong>Job ID:</strong> {jobId}
            </p>

            <p style={{ margin: 0, marginBottom: "12px" }}>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  color:
                    jobStatus === "complete"
                      ? "#2ecc71"
                      : jobStatus === "running"
                      ? "#3498db"
                      : jobStatus === "error"
                      ? "#e74c3c"
                      : "#555",
                  fontWeight: "600",
                }}
              >
                {jobStatus ?? "submitted"}
                {jobStatus === "running"}
                {jobStatus === "complete"}
              </span>
            </p>

            {/* Only show manual "Get Results" button if not auto-fetched yet */}
            {jobStatus === "complete" && jobResults === null && (
              <button
                onClick={handleGetResults}
                style={{
                  padding: "10px 20px",
                  background: "black",
                  color: "white",
                  fontSize: "16px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginBottom: "12px",
                }}
              >
                Get Results
              </button>
            )}

            {jobResults !== null && (
              <div
                style={{
                  marginTop: "8px",
                  maxHeight: "200px",
                  overflow: "auto",
                  textAlign: "left",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  background: "#f5f5f5",
                  padding: "10px",
                  borderRadius: "6px",
                }}
              >
                <strong>Results:</strong>
                <pre style={{ marginTop: "6px", whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(jobResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: "40px" }}>
        <a href="/" style={{ fontSize: "18px", color: "black" }}>
          ← Back to Home
        </a>
      </div>
    </GradientBackground>
  );
}
