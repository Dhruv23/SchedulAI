import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/theme.css";

/* DELETE FOR REAL BACKEND
   TEMPORARY MOCK DATA FLAG — REMOVE WHEN BACKEND READY
  const USE_MOCK_DATA = true;
  END DELETE FOR REAL BACKEND */

function SchedulePlanner({ user }) {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]); // Courses selected for this quarter
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
        // ✅ use detailed major-only progress endpoint
        const res = await fetch("/student/progress/detailed", {
          credentials: "include",
        });
        
        if (!res.ok) {
          console.log("Response not OK. Status:", res.status, "StatusText:", res.statusText);
          if (res.status === 401) {
            setError("Please log in to view your requirements.");
          } else {
            setError("Could not load remaining requirements.");
          }
          setLoadingRequirements(false);
          return;
        }
        
        const data = await res.json();
        console.log("Backend response:", data);

        if (data.status !== "SUCCESS") {
          console.log("Backend status not SUCCESS:", data.status);
          setError("Could not load remaining requirements.");
          setLoadingRequirements(false);
          return;
        }

        // ✅ map major_missing -> list of requirement strings (e.g., "COEN 146")
        const missing = Array.isArray(data.major_missing)
          ? data.major_missing.map((item) => item.requirement)
          : [];

        setRequirements(missing);
      } catch (err) {
        console.error("Requirements fetch error:", err);
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

  /* COURSE SELECTION FOR CURRENT QUARTER */
  function toggleCourseSelection(courseCode) {
    setSelectedCourses(prev => {
      if (prev.includes(courseCode)) {
        return prev.filter(c => c !== courseCode);
      } else {
        return [...prev, courseCode];
      }
    });
  }

  function selectAllCourses() {
    setSelectedCourses([...requirements]);
  }

  function clearAllCourses() {
    setSelectedCourses([]);
  }

  /* GENERATE SCHEDULES */
  const handleGenerate = async () => {
    setSelectedIndex(null);
    setSchedules([]);
    setError("");

    if (!selectedCourses || selectedCourses.length === 0) {
      setError("Please select some courses to schedule for this quarter.");
      return;
    }

    if (selectedCourses.length > 6) {
      setError("Please select 6 or fewer courses for a realistic schedule.");
      return;
    }

    setLoadingSchedules(true);

    // DYNAMIC SCHEDULING FOR CSEN COURSES
    const csenCourses = selectedCourses.filter(course => course.includes('CSEN'));
    
    if (csenCourses.length > 0) {
      setTimeout(() => {
        // Real course data from CSV - expanded to include more CSEN courses
        const courseData = {
          'CSEN 177': [
            { section: '1', instructor: 'Salem Al Agtash', days: 'MWF', start: '8:00 AM', end: '9:05 AM' },
            { section: '2', instructor: 'Yan Cui', days: 'MWF', start: '10:30 AM', end: '11:35 AM' }
          ],
          'CSEN 179': [
            { section: '1', instructor: 'Nicholas Tran', days: 'MWF', start: '2:15 PM', end: '3:20 PM' },
            { section: '2', instructor: 'Hien Vu', days: 'MWF', start: '10:30 AM', end: '11:35 AM' },
            { section: '3', instructor: 'Byron Walden', days: 'MWF', start: '9:15 AM', end: '10:20 AM' }
          ],
          'CSEN 174': [
            { section: '1', instructor: 'Maya Ackerman', days: 'MWF', start: '9:15 AM', end: '10:20 AM' },
            { section: '2', instructor: 'Maya Ackerman', days: 'MWF', start: '1:00 PM', end: '2:05 PM' }
          ],
          'CSEN 176': [
            { section: '1', instructor: 'Silvia Figueira', days: 'TTh', start: '2:00 PM', end: '3:40 PM' },
            { section: '2', instructor: 'Silvia Figueira', days: 'TTh', start: '5:30 PM', end: '7:10 PM' }
          ],
          'CSEN 175': [
            { section: '1', instructor: 'Behnam Dezfouli', days: 'MWF', start: '11:45 AM', end: '12:50 PM' }
          ],
          'CSEN 171': [
            { section: '1', instructor: 'David Anastasiu', days: 'TTh', start: '10:20 AM', end: '12:00 PM' }
          ],
          'CSEN 169': [
            { section: '1', instructor: 'Darren Atkinson', days: 'MWF', start: '1:00 PM', end: '2:05 PM' }
          ],
          'CSEN 168': [
            { section: '1', instructor: 'Darren Atkinson', days: 'TTh', start: '8:30 AM', end: '10:10 AM' }
          ],
          'CSEN 166': [
            { section: '1', instructor: 'Silvia Figueira', days: 'MWF', start: '2:15 PM', end: '3:20 PM' }
          ],
          'CSEN 165': [
            { section: '1', instructor: 'Ying Liu', days: 'TTh', start: '12:10 PM', end: '1:50 PM' }
          ],
          'CSEN 164': [
            { section: '1', instructor: 'Ahmed Amer', days: 'MWF', start: '11:45 AM', end: '12:50 PM' },
            { section: '2', instructor: 'Nam Ling', days: 'TTh', start: '2:00 PM', end: '3:40 PM' }
          ],
          'CSEN 163': [
            { section: '1', instructor: 'Xin Chen', days: 'TTh', start: '3:50 PM', end: '5:30 PM' }
          ],
          'CSEN 161': [
            { section: '1', instructor: 'Ahmed Amer', days: 'MWF', start: '8:00 AM', end: '9:05 AM' }
          ],
          'CSEN 160': [
            { section: '1', instructor: 'Ahmed Amer', days: 'TTh', start: '2:00 PM', end: '3:40 PM' },
            { section: '2', instructor: 'Behnam Dezfouli', days: 'TTh', start: '5:30 PM', end: '7:10 PM' }
          ],
          'CSEN 152': [
            { section: '1', instructor: 'Yuhong Liu', days: 'MWF', start: '9:15 AM', end: '10:20 AM' },
            { section: '2', instructor: 'Sean Buckley', days: 'TTh', start: '10:20 AM', end: '12:00 PM' }
          ],
          'CSEN 146': [
            { section: '1', instructor: 'Behnam Dezfouli', days: 'MW', start: '5:30 PM', end: '7:10 PM' }
          ],
          'CSEN 145': [
            { section: '1', instructor: 'Yuhong Liu', days: 'TTh', start: '10:20 AM', end: '12:00 PM' }
          ],
          'CSEN 144': [
            { section: '1', instructor: 'Yuhong Liu', days: 'MWF', start: '10:30 AM', end: '11:35 AM' }
          ]
        };

        // Function to convert time string to minutes for comparison
        const timeToMinutes = (timeStr) => {
          if (!timeStr) return 0;
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let totalMinutes = hours * 60 + minutes;
          if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
          if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
          return totalMinutes;
        };

        // Function to check if time meets preferences
        const meetsTimePreferences = (course) => {
          const startMinutes = timeToMinutes(course.start);
          const endMinutes = timeToMinutes(course.end);
          
          // Check earliest preference
          if (earliest) {
            const earliestMinutes = timeToMinutes(earliest);
            if (startMinutes < earliestMinutes) return false;
          }
          
          // Check latest preference
          if (latest) {
            const latestMinutes = timeToMinutes(latest);
            if (endMinutes > latestMinutes) return false;
          }
          
          return true;
        };

        // Function to check if instructor meets preferences
        const meetsInstructorPreference = (instructor) => {
          if (!preferredProfessor) return true;
          return instructor.toLowerCase().includes(preferredProfessor.toLowerCase());
        };

        // Function to check time conflicts
        const hasTimeConflict = (course1, course2) => {
          if (!course1.days || !course2.days) return false;
          
          // Check if they share any common days
          const days1 = course1.days.split('');
          const days2 = course2.days.split('');
          const commonDays = days1.some(day => days2.includes(day));
          
          if (!commonDays) return false;
          
          const start1 = timeToMinutes(course1.start);
          const end1 = timeToMinutes(course1.end);
          const start2 = timeToMinutes(course2.start);
          const end2 = timeToMinutes(course2.end);
          
          return (start1 < end2 && end1 > start2);
        };

        // Generate schedule combinations
        const generateSchedules = () => {
          const allSchedules = [];
          
          // Get all possible combinations for each selected course
          const courseCombinations = [];
          
          for (const selectedCourse of csenCourses) {
            const courseNum = selectedCourse.split(' ').slice(0, 2).join(' '); // Get "CSEN XXX"
            const availableSections = courseData[courseNum] || [];
            
            if (availableSections.length === 0) {
              // If course not in our data, create a generic entry
              courseCombinations.push([{
                course: selectedCourse,
                courseNum,
                section: '1',
                instructor: 'TBA',
                days: 'MWF',
                start: '10:30 AM',
                end: '11:35 AM'
              }]);
            } else {
              courseCombinations.push(
                availableSections.map(section => ({
                  course: selectedCourse,
                  courseNum,
                  ...section
                }))
              );
            }
          }
          
          // Function to calculate preference score (0-100, higher is better)
          const calculatePreferenceScore = (schedule) => {
            let score = 100;
            let issues = [];
            let timeViolations = 0;
            
            for (const course of schedule) {
              const courseStart = course["Start Time"];
              const courseEnd = course["End Time"];
              
              // Only track time preference violations, not successes
              if (earliest && courseStart && timeToMinutes(courseStart) < timeToMinutes(earliest)) {
                const violationMinutes = timeToMinutes(earliest) - timeToMinutes(courseStart);
                score -= Math.min(30, violationMinutes / 15); // Up to 30 point penalty
                timeViolations++;
                issues.push(`${course.Course.split('-')[0]} starts at ${courseStart} (before ${earliest})`);
              }
              
              if (latest && courseEnd && timeToMinutes(courseEnd) > timeToMinutes(latest)) {
                const violationMinutes = timeToMinutes(courseEnd) - timeToMinutes(latest);
                score -= Math.min(30, violationMinutes / 15); // Up to 30 point penalty
                timeViolations++;
                issues.push(`${course.Course.split('-')[0]} ends at ${courseEnd} (after ${latest})`);
              }
              
              // Instructor preference bonus (only positive feedback)
              if (preferredProfessor) {
                if (course.Instructor.toLowerCase().includes(preferredProfessor.toLowerCase())) {
                  score += 15;
                  issues.push(`${course.Course.split('-')[0]} with preferred instructor ${course.Instructor}`);
                } else {
                  score -= 5;
                }
              }
            }
            
            // Extra penalty for multiple time violations
            if (timeViolations > 1) {
              score -= 20;
              issues.push(`Multiple time preference violations (${timeViolations})`);
            }
            
            return { score: Math.max(0, score), issues, timeViolations };
          };
          
          // Generate all possible combinations (not just conflict-free ones)
          const generateCombination = (index, currentSchedule) => {
            if (index >= courseCombinations.length) {
              if (currentSchedule.length > 0) {
                const formattedSchedule = currentSchedule.map(section => ({
                  Course: `${section.courseNum}-${section.section} ${section.course.split(' - ')[1] || section.course.split(' ').slice(2).join(' ')}`,
                  Day: section.days,
                  "Start Time": section.start,
                  "End Time": section.end,
                  Instructor: section.instructor
                }));
                
                // Check for time conflicts
                const conflicts = [];
                for (let i = 0; i < formattedSchedule.length; i++) {
                  for (let j = i + 1; j < formattedSchedule.length; j++) {
                    const course1 = formattedSchedule[i];
                    const course2 = formattedSchedule[j];
                    
                    // Check if they share any common days
                    const days1 = course1.Day.split('');
                    const days2 = course2.Day.split('');
                    const commonDays = days1.some(day => days2.includes(day));
                    
                    if (commonDays && course1["Start Time"] && course1["End Time"] && course2["Start Time"] && course2["End Time"]) {
                      const start1 = timeToMinutes(course1["Start Time"]);
                      const end1 = timeToMinutes(course1["End Time"]);
                      const start2 = timeToMinutes(course2["Start Time"]);
                      const end2 = timeToMinutes(course2["End Time"]);
                      
                      if (start1 < end2 && end1 > start2) {
                        const course1Name = course1.Course.split('-')[0];
                        const course2Name = course2.Course.split('-')[0];
                        const overlapDetails = `${course1Name} (${course1["Start Time"]} - ${course1["End Time"]}) overlaps with ${course2Name} (${course2["Start Time"]} - ${course2["End Time"]})`;
                        conflicts.push(overlapDetails);
                      }
                    }
                  }
                }
                
                const preferenceData = calculatePreferenceScore(formattedSchedule);
                
                allSchedules.push({
                  schedule: formattedSchedule,
                  hasConflicts: conflicts.length > 0,
                  conflicts: conflicts,
                  preferenceScore: preferenceData.score,
                  preferenceIssues: preferenceData.issues,
                  timeViolations: preferenceData.timeViolations || 0
                });
              }
              return;
            }
            
            const currentCourseSections = courseCombinations[index];
            
            for (const section of currentCourseSections) {
              currentSchedule.push(section);
              generateCombination(index + 1, currentSchedule);
              currentSchedule.pop();
            }
          };
          
          generateCombination(0, []);
          
          // Sort by preference score (highest first), then by conflict status
          allSchedules.sort((a, b) => {
            // First: Non-conflicting schedules come first
            if (a.hasConflicts !== b.hasConflicts) {
              return a.hasConflicts ? 1 : -1;
            }
            
            // Second: Schedules with fewer time violations come first
            if (a.timeViolations !== b.timeViolations) {
              return a.timeViolations - b.timeViolations;
            }
            
            // Third: Higher preference score comes first
            return b.preferenceScore - a.preferenceScore;
          });
          
          // Return up to 6 schedules with variety
          const selectedSchedules = [];
          const conflictFreeSchedules = allSchedules.filter(s => !s.hasConflicts);
          const conflictingSchedules = allSchedules.filter(s => s.hasConflicts);
          
          // Add up to 4 conflict-free schedules
          selectedSchedules.push(...conflictFreeSchedules.slice(0, 4));
          
          // Add up to 2 conflicting schedules if we need more options
          if (selectedSchedules.length < 3) {
            selectedSchedules.push(...conflictingSchedules.slice(0, 6 - selectedSchedules.length));
          }
          
          return selectedSchedules.slice(0, 6).map(item => {
            const scheduleWithMetadata = [...item.schedule];
            scheduleWithMetadata._metadata = {
              hasConflicts: item.hasConflicts,
              conflicts: item.conflicts,
              preferenceScore: item.preferenceScore,
              preferenceIssues: item.preferenceIssues,
              timeViolations: item.timeViolations || 0
            };
            return scheduleWithMetadata;
          });
        };
        
        const generatedSchedules = generateSchedules();
        setSchedules(generatedSchedules);
        setLoadingSchedules(false);
      }, 1000);
      return;
    }

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
      console.log("=== DEBUG: Generating schedules ===");
      console.log("Selected courses:", selectedCourses);
      console.log("Professor:", preferredProfessor);
      console.log("Earliest:", earliest);
      console.log("Latest:", latest);

      const requestBody = {
        remaining_requirements: selectedCourses,
        preferred_professor: preferredProfessor,
        earliest,
        latest,
      };
      
      console.log("Request body:", requestBody);

      const res = await fetch("/planner/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", res.status);
      console.log("Response OK:", res.ok);

      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in to generate schedules.");
        } else {
          setError("Could not generate schedules.");
        }
        return;
      }

      const data = await res.json();
      console.log("Response data:", data);
      
      if (data.status !== "SUCCESS") {
        setError(data.message || "Could not generate schedules.");
        return;
      }

      setSchedules(data.schedules || []);
    } catch (err) {
      console.error("Schedule generation error:", err);
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
        <p className="planner-welcome">Welcome, {user.full_name ? user.full_name.split(' ')[0] : 'Student'}!</p>
        <p className="planner-subinfo">
          Major: <span>{user.major}</span> • Class of <span>{user.grad_year}</span>
        </p>
      </div>

      {/* REQUIREMENTS CARD */}
      <div className="planner-input-card">
        <h2>Select Courses for This Quarter</h2>

        {error && <p className="planner-error">{error}</p>}
        {loadingRequirements && <p>Loading remaining requirements…</p>}

        {!loadingRequirements && requirements && requirements.length === 0 && (
          <p>You're all done! 🎉</p>
        )}

        {!loadingRequirements && requirements && requirements.length > 0 && (
          <>
            <p style={{ marginBottom: "1rem", color: "#666" }}>
              Select 3-6 courses from your remaining requirements to schedule for this quarter:
            </p>
            
            <div style={{ marginBottom: "1rem" }}>
              <button 
                onClick={selectAllCourses}
                style={{ marginRight: "0.5rem", padding: "0.3rem 0.6rem", fontSize: "0.9rem" }}
              >
                Select All
              </button>
              <button 
                onClick={clearAllCourses}
                style={{ padding: "0.3rem 0.6rem", fontSize: "0.9rem" }}
              >
                Clear All
              </button>
              <span style={{ marginLeft: "1rem", color: "#666" }}>
                Selected: {selectedCourses.length} courses
              </span>
            </div>

            <div className="course-selection-grid" style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", 
              gap: "0.5rem",
              marginBottom: "1.5rem",
              maxHeight: "300px",
              overflowY: "auto",
              border: "1px solid #ddd",
              padding: "1rem",
              borderRadius: "4px"
            }}>
              {requirements.map((req, i) => (
                <label 
                  key={i} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    cursor: "pointer",
                    padding: "0.3rem",
                    borderRadius: "4px",
                    backgroundColor: selectedCourses.includes(req) ? "#e3f2fd" : "transparent"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(req)}
                    onChange={() => toggleCourseSelection(req)}
                    style={{ marginRight: "0.5rem" }}
                  />
                  <span style={{ fontSize: "0.9rem" }}>{req}</span>
                </label>
              ))}
            </div>

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
              {schedules.map((sched, idx) => {
                const metadata = sched._metadata || {};
                const hasConflicts = metadata.hasConflicts || false;
                const preferenceScore = metadata.preferenceScore || 100;
                const conflicts = metadata.conflicts || [];
                const timeViolations = metadata.timeViolations || 0;
                const preferenceIssues = metadata.preferenceIssues || [];
                
                // Determine status based on time violations and conflicts
                const getScheduleStatus = () => {
                  if (hasConflicts) return { color: "#d32f2f", text: "Time Conflicts", bgColor: "#ffebee" };
                  if (timeViolations > 0) return { color: "#f57c00", text: `Preference Issues (${timeViolations})`, bgColor: "#fff8e1" };
                  // Only blue for schedules with no issues
                  return { color: "#1976d2", text: "Good Match", bgColor: "#e3f2fd" };
                };
                
                const status = getScheduleStatus();
                
                // Get time preference violations and instructor preferences separately
                const timePreferenceIssues = preferenceIssues.filter(issue => 
                  issue.includes('before') || issue.includes('after')
                );
                const instructorMatches = preferenceIssues.filter(issue => 
                  issue.includes('instructor')
                );
                
                return (
                  <div
                    key={idx}
                    className={
                      "schedule-card " + (selectedIndex === idx ? "schedule-card-selected" : "")
                    }
                    onClick={() => setSelectedIndex(idx)}
                    style={{
                      borderLeft: `4px solid ${status.color}`,
                      backgroundColor: selectedIndex === idx ? status.bgColor : "white"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong className="schedule-card-title">
                        Schedule #{idx + 1}
                      </strong>
                      <div style={{ fontSize: "0.8rem", color: status.color, fontWeight: "bold" }}>
                        {status.text}
                      </div>
                    </div>

                    {/* Time preference violations - only show actual issues */}
                    {timePreferenceIssues.length > 0 && (
                      <div style={{ 
                        background: "#fff8e1", 
                        padding: "0.5rem", 
                        margin: "0.5rem 0", 
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        color: "#e65100",
                        border: "1px solid #ffcc02"
                      }}>
                        <strong>Time Preference Issues:</strong>
                        <ul style={{ margin: "0.25rem 0 0 0", paddingLeft: "1rem" }}>
                          {timePreferenceIssues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Time conflicts - more serious, use red */}
                    {conflicts.length > 0 && (
                      <div style={{ 
                        background: "#ffebee", 
                        padding: "0.5rem", 
                        margin: "0.5rem 0", 
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        color: "#c62828",
                        border: "1px solid #f44336"
                      }}>
                        <strong>Schedule Conflicts:</strong>
                        <ul style={{ margin: "0.25rem 0 0 0", paddingLeft: "1rem" }}>
                          {conflicts.map((conflict, i) => (
                            <li key={i}>{conflict}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Positive instructor feedback - only show if no major issues */}
                    {instructorMatches.length > 0 && timeViolations === 0 && !hasConflicts && (
                      <div style={{ 
                        background: "#e8f5e8", 
                        padding: "0.5rem", 
                        margin: "0.5rem 0", 
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        color: "#2e7d32",
                        border: "1px solid #4caf50"
                      }}>
                        <strong>Meets Preferences:</strong>
                        <ul style={{ margin: "0.25rem 0 0 0", paddingLeft: "1rem" }}>
                          {instructorMatches.map((match, i) => (
                            <li key={i}>{match}</li>
                          ))}
                        </ul>
                      </div>
                    )}

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
                        {sched.filter(row => row && row.Course).map((row, i) => {
                          // Check if this course has conflicts by looking for its course code in conflict messages
                          const courseCode = row.Course.split('-')[0];
                          const hasConflict = conflicts.some(conflict => conflict.includes(courseCode));
                          
                          return (
                            <tr 
                              key={i}
                              style={{
                                backgroundColor: hasConflict ? "#ffebee" : "transparent",
                                color: hasConflict ? "#c62828" : "inherit",
                                border: hasConflict ? "1px solid #f44336" : "none"
                              }}
                            >
                              <td style={{ 
                                fontWeight: hasConflict ? "bold" : "normal",
                                padding: "0.5rem"
                              }}>
                                {row.Course}
                              </td>
                              <td style={{ padding: "0.5rem" }}>{row.Day}</td>
                              <td style={{ 
                                padding: "0.5rem",
                                fontWeight: hasConflict ? "bold" : "normal"
                              }}>
                                {row["Start Time"]} – {row["End Time"]}
                              </td>
                              <td style={{ padding: "0.5rem" }}>{row.Instructor}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
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