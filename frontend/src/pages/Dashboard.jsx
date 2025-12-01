import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TranscriptUpload from "../components/TranscriptUpload";
import ProgressBar from "../components/ProgressBar";
import ChatbotWidget from "../components/ChatbotWidget";

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [completedUnits, setCompletedUnits] = useState(0);
  const [totalUnits, setTotalUnits] = useState(180);
  const [major, setMajor] = useState("");

  // Fetch progress and transcript data
  useEffect(() => {
    let transcriptUnits = 0;
    let progressTotal = 180;
    let progressMajor = "";

    // Fetch progress from backend for total units and major
    const fetchProgress = fetch("/student/progress", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "SUCCESS" && data.progress) {
          const prog = data.progress;
          progressTotal = prog.total_units || 180;
          progressMajor = prog.major || "";
        }
      })
      .catch((err) => console.error("Progress fetch failed:", err));

    // Fetch transcript for courses and calculate completed units
    const fetchTranscript = fetch("/student/transcript", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "SUCCESS") {
          const fetchedCourses = data.courses || [];
          setCourses(fetchedCourses);
          
          // Calculate completed units from fetched courses
          transcriptUnits = fetchedCourses.reduce((acc, c) => {
            const units =
              c["Units"] ??
              c.units ??
              c.Units ??
              0;
            return acc + (Number(units) || 0);
          }, 0);
        }
      })
      .catch((err) => console.error("Transcript fetch failed:", err));

    // Wait for both to complete, then set state
    Promise.all([fetchProgress, fetchTranscript]).then(() => {
      setTotalUnits(progressTotal);
      setMajor(progressMajor);
      // Always use transcript-calculated units if available
      setCompletedUnits(transcriptUnits);
    });
  }, []);

  // Handle successful transcript upload
  const handleUploadSuccess = (parsedCourses) => {
    setCourses(parsedCourses);

    // support "Units", units, or Units property
    const sum = parsedCourses.reduce((acc, c) => {
      const units =
        c["Units"] ??
        c.units ??
        c.Units ??
        0;
      return acc + (Number(units) || 0);
    }, 0);

    setCompletedUnits(sum);
  };

  // Handle clearing transcript data
  const handleClearTranscript = async () => {
    if (!window.confirm("Are you sure you want to clear all transcript data? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch("/student/transcript/clear", {
        method: "DELETE",
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (data.status === "SUCCESS") {
        // Clear local state
        setCourses([]);
        setCompletedUnits(0);
        alert("Transcript data cleared successfully.");
      } else {
        alert(data.message || "Failed to clear transcript data.");
      }
    } catch (error) {
      console.error("Clear transcript error:", error);
      alert("Error clearing transcript data. Please try again.");
    }
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

      {/* Transcript upload and clear */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "300px" }}>
          <TranscriptUpload onUploadSuccess={handleUploadSuccess} />
        </div>
        <button 
          onClick={handleClearTranscript}
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
        >
          Clear Transcript
        </button>
      </div>

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
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                  {c["Course Code"] || c.course_code}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                  {c["Course Name"] || c.course_name}
                </td>
                <td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #eee" }}>
                  {c["Grade"] || c.grade}
                </td>
                <td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #eee" }}>
                  {c["Units"] ?? c.units}
                </td>
                <td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #eee" }}>
                  {c["Total Points"] ?? c.total_points}
                </td>
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