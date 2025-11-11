import { useEffect, useState } from "react";
import TranscriptUpload from "../components/TranscriptUpload";
import ProgressBar from "../components/ProgressBar";

function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [completedUnits, setCompletedUnits] = useState(0);
  const [totalUnits, setTotalUnits] = useState(180); // example for SCU 180-unit requirement

  useEffect(() => {
    // Fetch any saved transcript data when the dashboard loads
    fetch("/student/transcript", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "SUCCESS") {
          setCourses(data.courses);
          const sum = data.courses.reduce((acc, c) => acc + (c.Units || 0), 0);
          setCompletedUnits(sum);
        }
      });
  }, []);

  const handleUploadSuccess = (parsedCourses) => {
    setCourses(parsedCourses);
    const sum = parsedCourses.reduce((acc, c) => acc + (c.Units || 0), 0);
    setCompletedUnits(sum);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Student Dashboard</h1>
      <ProgressBar completedUnits={completedUnits} totalUnits={totalUnits} />
      <TranscriptUpload onUploadSuccess={handleUploadSuccess} />

      <h2 style={{ marginTop: "2rem" }}>Transcript Courses</h2>
      {courses.length === 0 ? (
        <p>No transcript data uploaded yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>Code</th>
              <th style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>Name</th>
              <th style={{ borderBottom: "2px solid #ccc" }}>Grade</th>
              <th style={{ borderBottom: "2px solid #ccc" }}>Units</th>
              <th style={{ borderBottom: "2px solid #ccc" }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => (
              <tr key={i}>
                <td>{c["Course Code"]}</td>
                <td>{c["Course Name"]}</td>
                <td style={{ textAlign: "center" }}>{c["Grade"]}</td>
                <td style={{ textAlign: "center" }}>{c["Units"]}</td>
                <td style={{ textAlign: "center" }}>{c["Total Points"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;