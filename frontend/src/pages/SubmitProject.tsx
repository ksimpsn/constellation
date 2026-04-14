import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import FlowNav from "../components/FlowNav";
import PageFooter from "../components/PageFooter";
import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useGoBack } from "../hooks/useGoBack";
import { useAuth } from "../context/AuthContext";
import { hasResearcherRole } from "../auth/session";

import { API_BASE_URL } from "../api/config";
import TagMultiselectDropdown from "../components/TagMultiselectDropdown";
import { PROJECT_TAG_OPTIONS } from "../constants/projectTags";

interface SemgrepFinding {
  rule_id: string;
  message: string;
  path: string;
  start_line: number;
  end_line: number;
  severity: string | null;
  confidence: string | null;
}

interface SemgrepScan {
  status: "completed" | "skipped" | "error";
  findings_count: number;
  has_high_severity: boolean;
  findings: SemgrepFinding[];
  reason?: string;
}

function SemgrepScanPanel({ scan }: { scan: SemgrepScan }) {
  const SEVERITY_STYLES: Record<string, { border: string; bg: string; badge: string; text: string }> = {
    ERROR: {
      border: "border-red-500/40",
      bg: "bg-red-500/10",
      badge: "bg-red-500/20 text-red-300 border-red-400/30",
      text: "text-red-300",
    },
    WARNING: {
      border: "border-amber-400/40",
      bg: "bg-amber-400/10",
      badge: "bg-amber-400/20 text-amber-200 border-amber-300/30",
      text: "text-amber-200",
    },
    INFO: {
      border: "border-sky-400/40",
      bg: "bg-sky-400/10",
      badge: "bg-sky-400/20 text-sky-200 border-sky-300/30",
      text: "text-sky-200",
    },
  };

  const defaultStyle = {
    border: "border-white/20",
    bg: "bg-white/5",
    badge: "bg-white/10 text-white/70 border-white/20",
    text: "text-white/70",
  };

  if (scan.status === "skipped" || scan.status === "error") {
    return (
      <div className="mt-5 p-4 rounded-xl border border-white/10 bg-white/5 text-white/60">
        <p className="m-0 text-sm font-medium text-white/80 mb-1">Security Scan</p>
        <p className="m-0 text-sm">
          {scan.status === "skipped"
            ? "Skipped — Semgrep not installed on the server."
            : "Scan encountered an error."}
          {scan.reason && (
            <span className="ml-1 text-white/40 text-xs">({scan.reason})</span>
          )}
        </p>
      </div>
    );
  }

  const noFindings = scan.findings_count === 0;

  return (
    <div
      className={`mt-5 p-4 rounded-xl border ${
        noFindings
          ? "border-emerald-400/30 bg-emerald-500/10"
          : scan.has_high_severity
          ? "border-red-500/30 bg-red-500/8"
          : "border-amber-400/30 bg-amber-400/8"
      } text-white/90`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base font-semibold">Security Scan</span>
        {noFindings ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            ✓ No issues found
          </span>
        ) : (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
              scan.has_high_severity
                ? "bg-red-500/20 text-red-300 border-red-400/30"
                : "bg-amber-400/20 text-amber-200 border-amber-300/30"
            }`}
          >
            {scan.findings_count} finding{scan.findings_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {noFindings ? (
        <p className="m-0 text-sm text-emerald-200/80">
          Your uploaded code passed all Semgrep security checks.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {scan.findings.map((f, i) => {
            const sev = (f.severity || "").toUpperCase();
            const style = SEVERITY_STYLES[sev] ?? defaultStyle;
            return (
              <div
                key={i}
                className={`rounded-lg border ${style.border} ${style.bg} p-3`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {f.severity && (
                    <span
                      className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${style.badge}`}
                    >
                      {f.severity.toUpperCase()}
                    </span>
                  )}
                  {f.confidence && (
                    <span className="text-[11px] text-white/40 font-mono">
                      confidence: {f.confidence}
                    </span>
                  )}
                  <span className="text-[11px] text-white/40 font-mono ml-auto">
                    {f.path}:{f.start_line}
                  </span>
                </div>
                <p className={`m-0 text-sm ${style.text}`}>{f.message}</p>
                <p className="m-0 text-[11px] text-white/35 font-mono mt-0.5">{f.rule_id}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SubmitProject() {
  const goBack = useGoBack();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPresetTags, setSelectedPresetTags] = useState<Set<string>>(new Set());
  const [extraTags, setExtraTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [whyJoinText, setWhyJoinText] = useState("");
  const [learnMoreRows, setLearnMoreRows] = useState<{ label: string; url: string }[]>([
    { label: "", url: "" },
  ]);
  const [pyFile, setPyFile] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [rowsPerTask, setRowsPerTask] = useState<number>(1000);
  const [replicationFactor, setReplicationFactor] = useState<number>(2);
  const [maxVerificationAttempts, setMaxVerificationAttempts] = useState<number>(1);
  const [message, setMessage] = useState("");

  // Track job ID, run ID, project ID, status, results, and semgrep scan
  const [jobId, setJobId] = useState<number | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobResults, setJobResults] = useState<any | null>(null);
  const [semgrepScan, setSemgrepScan] = useState<SemgrepScan | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  const handleSubmit = async () => {
    if (!user || !hasResearcherRole(user.role)) {
      setMessage("Only accounts with the researcher role can submit projects.");
      return;
    }
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
    if (!Number.isFinite(replicationFactor) || replicationFactor <= 0) {
      setMessage("Replication factor must be a positive number.");
      return;
    }
    if (!Number.isFinite(maxVerificationAttempts) || maxVerificationAttempts <= 0) {
      setMessage("Max verification attempts must be a positive number.");
      return;
    }

    const tags = [
      ...new Set(
        [...selectedPresetTags, ...extraTags]
          .map((t) => t.trim())
          .filter(Boolean)
      ),
    ];
    if (tags.length === 0) {
      setMessage("Select at least one suggested tag and/or add a custom tag.");
      return;
    }
    const whyJoinLines = whyJoinText
      .split("\n")
      .map((ln) => ln.trim())
      .filter(Boolean);
    if (whyJoinLines.length === 0) {
      setMessage("Add at least one “Why join” reason (one per line).");
      return;
    }
    for (let i = 0; i < learnMoreRows.length; i++) {
      const row = learnMoreRows[i];
      if ((row.url || "").trim() && !(row.label || "").trim()) {
        setMessage(`Learn more row ${i + 1}: add a label, or clear the URL.`);
        return;
      }
    }
    const learnMorePayload = learnMoreRows
      .filter((r) => r.label.trim())
      .map((r) => ({ label: r.label.trim(), url: (r.url || "").trim() }));

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("tags", tags.join(","));
    formData.append("why_join", whyJoinText);
    formData.append("learn_more", JSON.stringify(learnMorePayload));
    formData.append("py_file", pyFile);
    formData.append("data_file", dataFile);
    formData.append("chunk_size", String(Math.floor(rowsPerTask)));
    formData.append("replication_factor", String(Math.floor(replicationFactor)));
    formData.append("max_verification_attempts", String(Math.floor(maxVerificationAttempts)));
    formData.append("user_id", user.user_id);

    try {
      const response = await fetch(`${API_BASE_URL}/submit`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.semgrep_scan) {
          setSemgrepScan(result.semgrep_scan);
        }
        setMessage("Error: " + (result.error ?? "Unknown error"));
        return;
      }

      setJobId(result.job_id);
      setRunId(result.run_id ?? null);
      setProjectId(result.project_id ?? null);
      setJobStatus("submitted");
      setJobResults(null);
      setSemgrepScan(result.semgrep_scan ?? null);
      const taskMsg = result.total_tasks != null ? ` (${result.total_tasks} tasks created)` : "";
      setMessage(`Project submitted. Run ID: ${result.run_id ?? result.job_id}${taskMsg}`);
    } catch (err) {
      console.error(err);
      setMessage(
        `Failed to submit project. Please make sure the backend is running at ${API_BASE_URL} and try again.`,
      );
    }
  };

  const checkStatus = async () => {
    if (jobId == null) return;
    try {
      const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
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
    try {
      const response = await fetch(`${API_BASE_URL}/results/${jobId}`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setJobResults({ error: result.error || `Failed to fetch results (${response.status})` });
        return;
      }
      setJobResults(result.results ?? result);
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

  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/submit" }} />;
  }

  if (!hasResearcherRole(user.role)) {
    return <Navigate to="/settings" replace state={{ submitRequiresResearcher: true }} />;
  }

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
      <div className="relative z-10 flex min-h-0 flex-1 flex-col min-h-screen px-6 pt-24 pb-16 max-w-[700px] mx-auto w-full">
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
            <span className="text-white/80 text-sm font-medium block">Tags (required)</span>
            <p className="text-white/60 text-sm mt-1.5 mb-3">
              Choose from suggested tags (multiselect) and optionally add your own. Used for browse filters.
            </p>
            <TagMultiselectDropdown
              options={[...PROJECT_TAG_OPTIONS]}
              selected={selectedPresetTags}
              onChange={setSelectedPresetTags}
              buttonLabel="Suggested tags"
              emptyHint="No suggested tags match your search."
            />
            <div className="mt-4">
              <span className="text-white/70 text-xs font-medium uppercase tracking-wide block mb-2">
                Custom tags (optional)
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g. astrophysics, HPC"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const t = customTagInput.trim();
                      if (!t) return;
                      setExtraTags((prev) =>
                        prev.some((x) => x.toLowerCase() === t.toLowerCase()) ? prev : [...prev, t]
                      );
                      setCustomTagInput("");
                    }
                  }}
                  style={{ ...inputStyle, marginTop: 0 }}
                  className="flex-1 min-w-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    const t = customTagInput.trim();
                    if (!t) return;
                    setExtraTags((prev) =>
                      prev.some((x) => x.toLowerCase() === t.toLowerCase()) ? prev : [...prev, t]
                    );
                    setCustomTagInput("");
                  }}
                  className="py-3 px-4 rounded-lg border border-white/25 text-white/90 text-sm hover:bg-white/10 cursor-pointer shrink-0 bg-transparent font-inherit"
                >
                  Add tag
                </button>
              </div>
              {extraTags.length > 0 && (
                <ul className="flex flex-wrap gap-2 list-none m-0 mt-3 p-0">
                  {extraTags.map((tag) => (
                    <li key={tag}>
                      <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg bg-violet-500/20 border border-violet-400/30 text-violet-100 text-xs">
                        {tag}
                        <button
                          type="button"
                          onClick={() => setExtraTags((prev) => prev.filter((x) => x !== tag))}
                          className="p-0.5 rounded hover:bg-white/15 text-white/80 leading-none border-0 bg-transparent cursor-pointer font-inherit"
                          aria-label={`Remove ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium">Why join (required)</label>
            <p className="text-white/60 text-sm mt-1.5 mb-0">
              One motivating reason per line — shown to volunteers on the project page.
            </p>
            <textarea
              placeholder={"Help cure disease\nLearn how distributed science works"}
              value={whyJoinText}
              onChange={(e) => setWhyJoinText(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium">Learn more (optional)</label>
            <p className="text-white/60 text-sm mt-1.5 mb-0">
              Add links to papers, docs, or repos. Each row needs a <strong className="text-white/80">label</strong>;
              URL can be left blank.
            </p>
            <div className="flex flex-col gap-3 mt-2">
              {learnMoreRows.map((row, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-end">
                  <input
                    type="text"
                    placeholder="Label"
                    value={row.label}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLearnMoreRows((rows) =>
                        rows.map((r, j) => (j === i ? { ...r, label: v } : r))
                      );
                    }}
                    style={{ ...inputStyle, marginTop: 0 }}
                    className="flex-1 min-w-0"
                  />
                  <input
                    type="text"
                    placeholder="https://… (optional)"
                    value={row.url}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLearnMoreRows((rows) =>
                        rows.map((r, j) => (j === i ? { ...r, url: v } : r))
                      );
                    }}
                    style={{ ...inputStyle, marginTop: 0 }}
                    className="flex-[2] min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => setLearnMoreRows((rows) => rows.filter((_, j) => j !== i))}
                    className="py-3 px-4 rounded-lg border border-white/25 text-white/80 text-sm hover:bg-white/10 cursor-pointer shrink-0 bg-transparent font-inherit"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLearnMoreRows((rows) => [...rows, { label: "", url: "" }])}
                className="self-start py-2 px-3 rounded-lg border border-white/20 text-white/85 text-sm hover:bg-white/10 cursor-pointer bg-transparent font-inherit"
              >
                + Add link row
              </button>
            </div>
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

          <div>
            <label className="text-white/80 text-sm font-medium">Replication factor</label>
            <p className="text-white/60 text-sm mt-1.5 mb-0">
              Each task will be run on this many independent workers to enable result verification. Default is{" "}
              <strong className="text-white/80">2</strong>.
            </p>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={replicationFactor}
              onChange={(e) => setReplicationFactor(e.target.value === "" ? 0 : Number(e.target.value))}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium">Max verification attempts</label>
            <p className="text-white/60 text-sm mt-1.5 mb-0">
              If replicas disagree, tasks can be retried up to this many times before being marked as failed. Default is{" "}
              <strong className="text-white/80">1</strong>.
            </p>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={maxVerificationAttempts}
              onChange={(e) => setMaxVerificationAttempts(e.target.value === "" ? 0 : Number(e.target.value))}
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

          {semgrepScan !== null && <SemgrepScanPanel scan={semgrepScan} />}
        </div>

        <div className="mt-10 shrink-0">
          <button
            type="button"
            onClick={goBack}
            className="text-lg text-white/70 hover:text-white transition-colors bg-transparent border-0 cursor-pointer font-inherit p-0"
          >
            ← Back
          </button>
        </div>
        <PageFooter className="w-full" />
      </div>
    </ConstellationStarfieldBackground>
  );
}
