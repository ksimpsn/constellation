import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import FlowNav from "../components/FlowNav";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
      const response = await fetch(`${API_BASE_URL}/submit`, {
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
      const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
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
      const response = await fetch(`${API_BASE_URL}/results/${jobId}`);
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
