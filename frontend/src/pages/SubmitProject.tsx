import GradientBackground from "../components/GradientBackground";
import { useState } from "react";

export default function SubmitProject() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pyFile, setPyFile] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      setMessage("Please enter a project title.");
      return;
    }
    if (!pyFile || !dataFile) {
      setMessage("Please upload both your .py file and dataset.");
      return;
    }

    console.log("inside handle submit")

    // // TODO: connect to backend submit_project(pyFile, dataFile, metadata)
    // console.log("Submitting project:");
    // console.log("Title:", title);
    // console.log("Description:", description);
    // console.log("Python file:", pyFile);
    // console.log("Dataset:", dataFile);

    // setMessage("Project submitted successfully!");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("py_file", pyFile);
    formData.append("data_file", dataFile);
    console.log(title);
    console.log(description);
    console.log(pyFile.text());
    console.log(dataFile.text())

    try {
      const response = await fetch("http://localhost:5001/submit", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage("Error: " + result.error);
        return;
      }

      setMessage("Project submitted successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to submit project.");
    }
  };

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
      </div>

      <div style={{ marginTop: "40px" }}>
        <a href="/" style={{ fontSize: "18px", color: "black" }}>
          ← Back to Home
        </a>
      </div>
    </GradientBackground>
  );
}
