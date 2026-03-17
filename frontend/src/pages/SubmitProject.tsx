import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import FlowNav from "../components/FlowNav";
import { useState, useEffect, useRef } from "react";
<<<<<<< HEAD
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
=======
import { getApiUrl } from "../api/config";
>>>>>>> annabella/result-verification

export default function SubmitProject() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pyFile, setPyFile] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
<<<<<<< HEAD
  const [rowsPerTask, setRowsPerTask] = useState<number>(1000);
=======
  const [chunkSize, setChunkSize] = useState(1000);
  const [replicationFactor, setReplicationFactor] = useState(2);
  const [maxVerificationAttempts, setMaxVerificationAttempts] = useState(2);
>>>>>>> annabella/result-verification
  const [message, setMessage] = useState("");

  // Track job ID, run ID, project ID, status, and results
  const [jobId, setJobId] = useState<number | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
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
    if (!Number.isFinite(rowsPerTask) || rowsPerTask <= 0) {
      setMessage("Rows per task must be a positive number.");
      return;
    }

    const base = getApiUrl();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("py_file", pyFile);
    formData.append("data_file", dataFile);
<<<<<<< HEAD
    formData.append("chunk_size", String(Math.floor(rowsPerTask)));

    try {
      const response = await fetch(`${API_BASE_URL}/submit`, {
=======
    formData.append("chunk_size", String(chunkSize));
    formData.append("replication_factor", String(replicationFactor));
    formData.append("max_verification_attempts", String(maxVerificationAttempts));

    try {
      const response = await fetch(`${base}/submit`, {
>>>>>>> annabella/result-verification
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage("Error: " + (result.error ?? "Unknown error"));
        return;
      }

      setJobId(result.job_id);
      setRunId(result.run_id ?? null);
      setProjectId(result.project_id ?? null);
      setJobStatus("submitted");
      setJobResults(null);
      const taskMsg = result.total_tasks != null ? ` (${result.total_tasks} tasks created)` : "";
      setMessage(`Project submitted. Run ID: ${result.run_id ?? result.job_id}${taskMsg}`);
    } catch (err) {
      console.error(err);
      setMessage("Failed to submit project.");
    }
  };

  const checkStatus = async () => {
    if (jobId == null) return;
    const base = getApiUrl();
    try {
<<<<<<< HEAD
      const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
=======
      const response = await fetch(`${base}/status/${jobId}`);
>>>>>>> annabella/result-verification
      const result = await response.json();
      setJobStatus(result.status);
      if (result.status === "complete" && jobResults === null) {
        handleGetResults();
      }
    } catch (err) {
      console.error(err);
      setJobStatus("error");
    }
  };

  const handleGetResults = async () => {
    if (jobId == null) return;
    const base = getApiUrl();
    try {
<<<<<<< HEAD
      const response = await fetch(`${API_BASE_URL}/results/${jobId}`);
=======
      const response = await fetch(`${base}/results/${jobId}`);
>>>>>>> annabella/result-verification
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

  const inputStyle = {
    marginTop: "8px",
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.1)",
    color: "white",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  } as const;

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 px-6 pt-24 pb-16 max-w-[700px] mx-auto w-full">
        <h1 className="text-4xl font-bold text-white/90 mb-8">
          Submit a Research Project
        </h1>

        <div className="flex flex-col gap-6 w-full p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div>
            <label className="text-white/80 text-sm font-medium">Project Title</label>
            <input
              type="text"
              placeholder="e.g., Protein Folding Monte Carlo Simulation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium">Project Description / Notes</label>
            <textarea
              placeholder="Describe the purpose of the project, required resources, and what volunteers should know..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

<<<<<<< HEAD
          <div>
            <label className="text-white/80 text-sm font-medium">Upload Python Script (.py)</label>
            <input
              type="file"
              accept=".py"
              onChange={(e) => setPyFile(e.target.files?.[0] || null)}
              className="mt-2 block text-white/70 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white/20 file:text-white"
            />
            {pyFile && (
              <p className="text-white/60 text-sm mt-1.5">
                Selected: <strong className="text-white/80">{pyFile.name}</strong>
              </p>
=======
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

        {/* Chunk size: rows per task (more tasks = more parallelism) */}
        <div>
          <label style={{ fontSize: "18px" }}>Rows per task (chunk size)</label>
          <p style={{ fontSize: "14px", color: "#555", marginTop: "4px" }}>
            Tasks are created from dataset <strong>rows</strong> (CSV records), not file lines. Smaller value = more tasks and better parallelism.
          </p>
          <input
            type="number"
            min={1}
            value={chunkSize}
            onChange={(e) => setChunkSize(Math.max(1, parseInt(e.target.value, 10) || 1000))}
            style={{
              marginTop: "8px",
              width: "120px",
              padding: "8px 12px",
              fontSize: "16px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* Verification settings */}
        <div>
          <label style={{ fontSize: "18px" }}>Result verification (redundant runs)</label>
          <p style={{ fontSize: "14px", color: "#555", marginTop: "4px" }}>
            Each task is run multiple times and compared. Higher values increase trust but use more compute.
          </p>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginTop: "8px" }}>
            <div>
              <label style={{ fontSize: "16px" }}>Replication factor</label>
              <input
                type="number"
                min={2}
                value={replicationFactor}
                onChange={(e) =>
                  setReplicationFactor(Math.max(2, parseInt(e.target.value, 10) || 2))
                }
                style={{
                  marginTop: "6px",
                  width: "100px",
                  padding: "8px 12px",
                  fontSize: "16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "16px" }}>Max verification attempts</label>
              <input
                type="number"
                min={1}
                value={maxVerificationAttempts}
                onChange={(e) =>
                  setMaxVerificationAttempts(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                style={{
                  marginTop: "6px",
                  width: "100px",
                  padding: "8px 12px",
                  fontSize: "16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
          </div>
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
              {runId != null && (
                <> · <strong>Run ID:</strong> {runId}</>
              )}
              {projectId != null && (
                <> · <strong>Project ID:</strong> {projectId}</>
              )}
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
>>>>>>> annabella/result-verification
            )}
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium">Upload Dataset (.csv or .json)</label>
            <input
              type="file"
              accept=".csv,.json"
              onChange={(e) => setDataFile(e.target.files?.[0] || null)}
              className="mt-2 block text-white/70 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white/20 file:text-white"
            />
            {dataFile && (
              <p className="text-white/60 text-sm mt-1.5">
                Selected: <strong className="text-white/80">{dataFile.name}</strong>
              </p>
            )}
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium">Rows per task (chunk size)</label>
            <p className="text-white/60 text-sm mt-1.5 mb-0">
              Tasks are created from <strong className="text-white/80">CSV rows (records)</strong>. Smaller values create more tasks and improve parallelism.
            </p>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={rowsPerTask}
              onChange={(e) => setRowsPerTask(e.target.value === "" ? 0 : Number(e.target.value))}
              style={inputStyle}
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-fit py-3.5 px-6 rounded-xl font-medium text-white bg-white/20 hover:bg-white/30 border border-white/20 transition-colors cursor-pointer"
          >
            Submit Project
          </button>

          {message && (
            <p className="text-white/80 text-base">{message}</p>
          )}

          {jobId !== null && (
            <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10 text-white/90">
              <p className="m-0 mb-2">
                <strong>Job ID:</strong> {jobId}
              </p>
              <p className="m-0 mb-3">
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    color:
                      jobStatus === "complete"
                        ? "#86efac"
                        : jobStatus === "running"
                        ? "#93c5fd"
                        : jobStatus === "error"
                        ? "#fca5a5"
                        : "rgba(255,255,255,0.8)",
                    fontWeight: 600,
                  }}
                >
                  {jobStatus ?? "submitted"}
                </span>
              </p>

              {jobStatus === "complete" && jobResults === null && (
                <button
                  onClick={handleGetResults}
                  className="py-2.5 px-5 bg-white/20 text-white text-base rounded-lg border border-white/20 cursor-pointer mb-3"
                >
                  Get Results
                </button>
              )}

              {jobResults !== null && (
                <div
                  className="mt-2 max-h-[200px] overflow-auto text-left font-mono text-[13px] rounded-lg p-2.5"
                  style={{ background: "rgba(0,0,0,0.2)" }}
                >
                  <strong>Results:</strong>
                  <pre className="mt-1.5 whitespace-pre-wrap text-white/90">
                    {JSON.stringify(jobResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-10">
          <Link to="/" className="text-lg text-white/70 hover:text-white transition-colors no-underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
