import { useState } from "react";

function TranscriptUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please select a PDF file first.");

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/student/transcript/upload", {
        method: "POST",
        body: formData,
        credentials: "include", // needed for session cookies
      });
      const data = await res.json();

      if (data.status === "SUCCESS") {
        onUploadSuccess(data.courses);
      } else {
        setError(data.message || "Upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h3>Upload Transcript</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit" disabled={loading} style={{ marginLeft: "1rem" }}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default TranscriptUpload;