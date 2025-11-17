import { useEffect, useState } from "react";
import TranscriptUpload from "../components/TranscriptUpload";
import ProgressBar from "../components/ProgressBar";
import ChatbotWidget from "../components/ChatbotWidget";

function Dashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [completedUnits, setCompletedUnits] = useState(0);
  const [totalUnits, setTotalUnits] = useState(180);
  const [major, setMajor] = useState("");

  // Fetch progress from backend
  useEffect(() => {
    fetch("/student/progress", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "SUCCESS" && data.progress) {
          const prog = data.progress;
          setCompletedUnits(prog.completed_units || 0);
          setTotalUnits(prog.total_units || 180);
          setMajor(prog.major || "");
        }
      })
      .catch((err) => console.error("Progress fetch failed:", err));
  }, []);

  // Fetch transcript for table display
  useEffect(() => {
    fetch("/student/transcript", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "SUCCESS") {
          setCourses(data.courses || []);
        }
      })
      .catch((err) => console.error("Transcript fetch failed:", err));
  }, []);

  // Handle successful transcript upload
  const handleUploadSuccess = (parsedCourses) => {
    setCourses(parsedCourses);
    const sum = parsedCourses.reduce((acc, c) => acc + (c.Units || 0), 0);
    setCompletedUnits(sum);
  };

  const percentComplete =
    totalUnits > 0 ? ((completedUnits / totalUnits) * 100).toFixed(1) : 0;

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      {/* Header with logout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Student Dashboard</h1>
        <button onClick={onLogout}>Logout</button>

      </div>

      {/* Major info */}
      {major && <h3 style={{ color: "#444" }}>Major: {major}</h3>}

      {/* Progress bar */}
      <ProgressBar completedUnits={completedUnits} totalUnits={totalUnits} />

      <p style={{ marginTop: "0.5rem" }}>
        {completedUnits} of {totalUnits} units completed ({percentComplete}%)
      </p>

      {/* Transcript upload */}
      <TranscriptUpload onUploadSuccess={handleUploadSuccess} />

      {/* Transcript table */}
      <h2 style={{ marginTop: "2rem" }}>Transcript Courses</h2>
      {courses.length === 0 ? (
        <p>No transcript data uploaded yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "2px solid #ccc", textAlign: "left", padding: "8px" }}>Code</th>
              <th style={{ borderBottom: "2px solid #ccc", textAlign: "left", padding: "8px" }}>Name</th>
              <th style={{ borderBottom: "2px solid #ccc", textAlign: "center", padding: "8px" }}>Grade</th>
              <th style={{ borderBottom: "2px solid #ccc", textAlign: "center", padding: "8px" }}>Units</th>
              <th style={{ borderBottom: "2px solid #ccc", textAlign: "center", padding: "8px" }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => (
              <tr key={i}>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{c["Course Code"]}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{c["Course Name"]}</td>
                <td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #eee" }}>{c["Grade"]}</td>
                <td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #eee" }}>{c["Units"]}</td>
                <td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #eee" }}>{c["Total Points"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Chatbot floating widget */}
      <ChatbotWidget />
    </div>
  );
}

export default Dashboard;