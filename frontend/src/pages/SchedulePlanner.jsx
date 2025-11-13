import { useEffect, useState } from "react";
import "../styles/theme.css";

/* DELETE FOR REAL BACKEND
   TEMPORARY MOCK DATA FLAG — REMOVE WHEN BACKEND READY
  const USE_MOCK_DATA = true;
  END DELETE FOR REAL BACKEND */

function SchedulePlanner({ user }) {
  const [requirements, setRequirements] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loadingRequirements, setLoadingRequirements] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [error, setError] = useState("");

  /* PREFERENCES */
  const [preferredProfessor, setPreferredProfessor] = useState("");
  const [earliest, setEarliest] = useState("");
  const [latest, setLatest] = useState("");

  /* CSV EXPORT */
  function exportScheduleToCSV(schedule) {
    if (!schedule) return;

    const headers = ["Course", "Day", "Start Time", "End Time", "Instructor"];
    const rows = schedule.map((row) =>
      [row.Course, row.Day, row["Start Time"], row["End Time"], row.Instructor].join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `schedule_${selectedIndex + 1}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /* LOAD REMAINING REQUIREMENTS */
  useEffect(() => {
    async function fetchRequirements() {

      /* DELETE FOR REAL BACKEND
         MOCK REQUIREMENTS LOADING 
      if (USE_MOCK_DATA) {
        setTimeout(() => {
          setRequirements(["COEN 146", "COEN 174", "COEN 122"]);
          setLoadingRequirements(false);
        }, 500);
        return;
      }
      END DELETE FOR REAL BACKEND */

      // REAL BACKEND ENDPOINT
      try {
        const res = await fetch("/student/progress", { credentials: "include" });
        const data = await res.json();

        if (data.status !== "SUCCESS") {
          setError("Could not load remaining requirements.");
          setLoadingRequirements(false);
          return;
        }

        setRequirements(data.progress?.missing_requirements || []);
      } catch (err) {
        setError("Failed to connect to server.");
      } finally {
        setLoadingRequirements(false);
      }
    }

    fetchRequirements();
  }, []);

  /* DELETE FOR REAL BACKEND
     MOCK FILTERING HELPERS 
  function mockFilterSchedule(schedule) {
    return schedule.filter((row) => {
      const profMatch =
        preferredProfessor === "" ||
        row.Instructor.toLowerCase().includes(preferredProfessor.toLowerCase());

      const startMatch =
        earliest === "" || convertTime(row["Start Time"]) >= convertTime(earliest);

      const endMatch =
        latest === "" || convertTime(row["End Time"]) <= convertTime(latest);

      return profMatch && startMatch && endMatch;
    });
  }

  function convertTime(t) {
    if (!t) return 0;
    const [time, period] = t.split(" ");
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }
   END DELETE FOR REAL BACKEND */

  /* GENERATE SCHEDULES */
  const handleGenerate = async () => {
    setSelectedIndex(null);
    setSchedules([]);
    setError("");

    if (!requirements || requirements.length === 0) {
      setError("You have no remaining requirements!");
      return;
    }

    setLoadingSchedules(true);

    /* DELETE FOR REAL BACKEND
       MOCK SCHEDULE GENERATION 
    if (USE_MOCK_DATA) {
      setTimeout(() => {
        const baseSchedules = [
          [
            {
              Course: "COEN 146",
              Day: "MW",
              "Start Time": "9:15 AM",
              "End Time": "11:00 AM",
              Instructor: "Prof. Smith",
            },
            {
              Course: "COEN 174",
              Day: "TR",
              "Start Time": "1:00 PM",
              "End Time": "2:15 PM",
              Instructor: "Prof. Lee",
            },
          ],
          [
            {
              Course: "COEN 146",
              Day: "MW",
              "Start Time": "9:15 AM",
              "End Time": "11:00 AM",
              Instructor: "Prof. Smith",
            },
            {
              Course: "COEN 122",
              Day: "F",
              "Start Time": "3:00 PM",
              "End Time": "5:45 PM",
              Instructor: "Prof. Patel",
            },
          ],
        ];

        const filtered = baseSchedules
          .map((sched) => mockFilterSchedule(sched))
          .filter((sched) => sched.length === 2);

        setSchedules(filtered.length ? filtered : baseSchedules);
        setLoadingSchedules(false);
      }, 700);
      return;
    }
     END DELETE FOR REAL BACKEND */

    // REAL BACKEND ENDPOINT
    try {
      const res = await fetch("/planner/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          remaining_requirements: requirements,
          preferred_professor: preferredProfessor,
          earliest,
          latest,
        }),
      });

      const data = await res.json();
      if (data.status !== "SUCCESS") {
        setError(data.message || "Could not generate schedules.");
        return;
      }

      setSchedules(data.schedules || []);
    } catch {
      setError("Failed to connect to schedule planner.");
    } finally {
      setLoadingSchedules(false);
    }
  };

  return (
    <div className="planner-container">
      <h1>Schedule Planner</h1>

      {/* STUDENT INFO */}
      <div className="planner-student-info">
        <p className="planner-welcome">Welcome, {user.full_name}!</p>
        <p className="planner-subinfo">
          Major: <span>{user.major}</span> • Class of <span>{user.grad_year}</span>
        </p>
      </div>

      {/* REQUIREMENTS CARD */}
      <div className="planner-input-card">
        <h2>Your Remaining Requirements</h2>

        {error && <p className="planner-error">{error}</p>}
        {loadingRequirements && <p>Loading remaining requirements…</p>}

        {!loadingRequirements && requirements && requirements.length === 0 && (
          <p>You’re all done! 🎉</p>
        )}

        {!loadingRequirements && requirements && requirements.length > 0 && (
          <>
            <ul className="requirements-list">
              {requirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>

            {/* PREFERENCES */}
            <h3 style={{ marginTop: "1.5rem" }}>Preferences (Optional)</h3>

            <label>
              Preferred Professor:
              <input
                type="text"
                value={preferredProfessor}
                onChange={(e) => setPreferredProfessor(e.target.value)}
                style={{ width: "100%", marginTop: "0.5rem" }}
              />
            </label>

            <label style={{ display: "block", marginTop: "1rem" }}>
              Earliest Start Time:
              <input
                type="text"
                placeholder="e.g., 9:00 AM"
                value={earliest}
                onChange={(e) => setEarliest(e.target.value)}
                style={{ width: "100%", marginTop: "0.5rem" }}
              />
            </label>

            <label style={{ display: "block", marginTop: "1rem" }}>
              Latest End Time:
              <input
                type="text"
                placeholder="e.g., 5:00 PM"
                value={latest}
                onChange={(e) => setLatest(e.target.value)}
                style={{ width: "100%", marginTop: "0.5rem" }}
              />
            </label>

            <button onClick={handleGenerate} disabled={loadingSchedules} style={{ marginTop: "1.5rem" }}>
              {loadingSchedules ? "Building schedules…" : "Generate Schedule"}
            </button>
          </>
        )}
      </div>

      {/* SCHEDULE RESULTS */}
      {schedules.length > 0 && (
        <div className="planner-grid">
          {/* LEFT COLUMN */}
          <div>
            <h2>Generated Schedules</h2>

            <div className="schedule-list-scroll">
              {schedules.map((sched, idx) => (
                <div
                  key={idx}
                  className={
                    "schedule-card " + (selectedIndex === idx ? "schedule-card-selected" : "")
                  }
                  onClick={() => setSelectedIndex(idx)}
                >
                  <strong className="schedule-card-title">
                    Schedule #{idx + 1}
                  </strong>

                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Day</th>
                        <th>Time</th>
                        <th>Instructor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sched.map((row, i) => (
                        <tr key={i}>
                          <td>{row.Course}</td>
                          <td>{row.Day}</td>
                          <td>{row["Start Time"]} – {row["End Time"]}</td>
                          <td>{row.Instructor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — SELECTED SCHEDULE */}
          <div className="details-card">
            <h2>Selected Schedule</h2>

            {selectedIndex != null && (
              <button
                className="export-button"
                onClick={() => exportScheduleToCSV(schedules[selectedIndex])}
              >
                Export to CSV
              </button>
            )}

            {selectedIndex == null ? (
              <p className="details-placeholder">Select a schedule to view its details.</p>
            ) : (
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Instructor</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules[selectedIndex].map((row, i) => (
                    <tr key={i}>
                      <td>{row.Course}</td>
                      <td>{row.Day}</td>
                      <td>{row["Start Time"]} – {row["End Time"]}</td>
                      <td>{row.Instructor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SchedulePlanner;