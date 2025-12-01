// src/pages/ProfilePage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";

function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function safeParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON parse error:", e);
    return null;
  }
}

function splitFullName(fullName) {
  if (!fullName) return { first: "", last: "" };
  const parts = fullName.trim().split(" ");
  if (parts.length <= 1) return { first: parts[0] || "", last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function ProfilePage({ user, onUserUpdate, onLogout }) {
  const navigate = useNavigate();
  
  // Initialize first and last name from full name
  const initialName = splitFullName(user?.full_name || "");
  
  const [profile, setProfile] = useState({
    first_name: initialName.first,
    last_name: initialName.last,
    major: user?.major || "",
    grad_year: user?.grad_year || "",
    grad_quarter: user?.grad_quarter || "Spring",
    pronouns: user?.pronouns || "",
    bio: user?.bio || "",
    email: user?.email || "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const [completedUnits, setCompletedUnits] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // keep local profile synced with user
  useEffect(() => {
    if (user) {
      const nameData = splitFullName(user.full_name || "");
      setProfile({
        first_name: nameData.first,
        last_name: nameData.last,
        major: user.major || "",
        grad_year: user.grad_year || "",
        grad_quarter: user.grad_quarter || "Spring",
        pronouns: user.pronouns || "",
        bio: user.bio || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // fetch progress safely
  useEffect(() => {
    setLoadingProgress(true);

    // First try to fetch progress from backend
    fetch("/student/progress", {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error("Progress fetch failed with status", res.status);
          return;
        }
        const text = await res.text();
        const data = safeParseJson(text);
        if (!data || data.status !== "SUCCESS" || !data.progress) {
          return;
        }
        setTotalUnits(data.progress.total_units || 180);
      })
      .catch((err) => {
        console.error("Progress fetch error:", err);
      });

    // Also fetch transcript to calculate completed units
    fetch("/student/transcript", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          console.error("Transcript fetch failed with status", res.status);
          return;
        }
        const text = await res.text();
        const data = safeParseJson(text);
        if (!data || data.status !== "SUCCESS") {
          return;
        }
        
        const fetchedCourses = data.courses || [];
        
        // Calculate completed units from fetched courses
        const sum = fetchedCourses.reduce((acc, c) => {
          const units =
            c["Units"] ??
            c.units ??
            c.Units ??
            0;
          return acc + (Number(units) || 0);
        }, 0);
        
        if (sum > 0) {
          setCompletedUnits(sum);
        }
        
        // If no totalUnits was set from progress, use default
        setTotalUnits(prev => prev > 0 ? prev : 180);
      })
      .catch((err) => {
        console.error("Transcript fetch error:", err);
      })
      .finally(() => setLoadingProgress(false));
  }, []);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Combine first and last name for backend
      const fullName = `${profile.first_name} ${profile.last_name}`.trim();
      
      const payload = {
        full_name: fullName,
        major: profile.major,
        grad_year: profile.grad_year,
        grad_quarter: profile.grad_quarter,
        pronouns: profile.pronouns,
        bio: profile.bio,
      };

      // Handle password change if provided
      if (passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          throw new Error("New passwords do not match.");
        }
        
        if (!validatePassword(passwordData.newPassword)) {
          throw new Error("Password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).");
        }
        
        // First update password
        const passwordRes = await fetch("/user/password/change", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            newPassword: passwordData.newPassword
          }),
        });
        
        const passwordResult = await passwordRes.text();
        const passwordResponseData = passwordResult ? JSON.parse(passwordResult) : {};
        
        if (!passwordRes.ok || passwordResponseData.status !== "SUCCESS") {
          throw new Error(passwordResponseData.message || "Failed to update password.");
        }
      }

      const res = await fetch(
        "/student/profile/update",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const text = await res.text();
      const data = safeParseJson(text);

      if (!res.ok || !data || data.status !== "SUCCESS") {
        throw new Error(
          (data && data.message) || "Failed to update profile."
        );
      }

      if (onUserUpdate && data.student) {
        onUserUpdate(data.student);
      }

      // Reset password fields if password was changed
      if (passwordData.newPassword) {
        setPasswordData({
          newPassword: "",
          confirmPassword: ""
        });
      }

      setSuccess("Profile updated successfully.");
      setIsEditing(false);
    } catch (err) {
      console.error("Profile save error:", err);
      setError(err.message || "Server error while saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      const nameData = splitFullName(user.full_name || "");
      setProfile({
        first_name: nameData.first,
        last_name: nameData.last,
        major: user.major || "",
        grad_year: user.grad_year || "",
        grad_quarter: user.grad_quarter || "Spring",
        pronouns: user.pronouns || "",
        bio: user.bio || "",
        email: user.email || "",
      });
    }
    // Reset password data
    setPasswordData({
      newPassword: "",
      confirmPassword: ""
    });
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setError("Please type DELETE to confirm account deletion.");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const res = await fetch("/student/delete", {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (data.status === "SUCCESS") {
        // Account deleted successfully, log out and redirect to login
        onLogout();
        navigate("/login");
      } else {
        setError(data.message || "Failed to delete account.");
      }
    } catch (err) {
      console.error("Delete account error:", err);
      setError("Server error, please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
    setError("");
  };

  const progressPercent =
    totalUnits && totalUnits > 0
      ? Math.round((completedUnits / totalUnits) * 100)
      : 0;

  const expectedGradLabel = profile.grad_year
    ? `${profile.grad_quarter || "Spring"} ${profile.grad_year}`
    : "—";

  return (
    <div className="page-container profile-page">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <button onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="profile-layout">
        {/* LEFT: avatar + details */}
        <div className="profile-left-card">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-circle">
              {getInitials(`${profile.first_name} ${profile.last_name}`.trim())}
            </div>
          </div>

          <div className="profile-details-card">
            <div className="profile-detail-row">
              <span className="profile-label">Name</span>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <input
                    type="text"
                    placeholder="First name"
                    value={profile.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={profile.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                  />
                </div>
              ) : (
                <span className="profile-value">
                  {`${profile.first_name} ${profile.last_name}`.trim() || "—"}
                </span>
              )}
            </div>

            <div className="profile-detail-row">
              <span className="profile-label">Email</span>
              <span className="profile-value">{profile.email}</span>
            </div>

            <div className="profile-detail-row">
              <span className="profile-label">Password</span>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <div style={{ 
                    padding: '0.6rem 0.85rem',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}>
                    ••••••••••••
                  </div>
                  <input
                    type="password"
                    placeholder="New password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                  />
                  <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.25rem" }}>
                    Enter new password to change it. Must be at least 8 characters with uppercase, lowercase, number, and special character.
                  </div>
                </div>
              ) : (
                <span className="profile-value">••••••••</span>
              )}
            </div>

            <div className="profile-detail-row">
              <span className="profile-label">Major</span>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.major}
                  onChange={(e) => handleChange("major", e.target.value)}
                />
              ) : (
                <span className="profile-value">{profile.major || "—"}</span>
              )}
            </div>

            <div className="profile-detail-row">
              <span className="profile-label">Expected Graduation</span>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <select
                    value={profile.grad_quarter || "Spring"}
                    onChange={(e) => handleChange("grad_quarter", e.target.value)}
                    style={{ 
                      width: '100%',
                      padding: '0.6rem 0.85rem', 
                      borderRadius: '12px', 
                      border: '1px solid #e5e7eb', 
                      fontSize: '1rem', 
                      backgroundColor: '#f9fafb',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease'
                    }}
                  >
                    <option value="Spring">Spring</option>
                    <option value="Fall">Fall</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Year"
                    value={profile.grad_year || ""}
                    onChange={(e) => handleChange("grad_year", e.target.value)}
                  />
                </div>
              ) : (
                <span className="profile-value">{expectedGradLabel}</span>
              )}
            </div>

            <div className="profile-detail-row">
              <span className="profile-label">Pronouns</span>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.pronouns || ""}
                  onChange={(e) => handleChange("pronouns", e.target.value)}
                />
              ) : (
                <span className="profile-value">
                  {profile.pronouns || "—"}
                </span>
              )}
            </div>

            <div className="profile-detail-row profile-detail-row--bio">
              <span className="profile-label">Bio</span>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={profile.bio || ""}
                  onChange={(e) => handleChange("bio", e.target.value)}
                />
              ) : (
                <span className="profile-value">
                  {profile.bio ||
                    "Add a short bio so advisors know more about you."}
                </span>
              )}
            </div>

            {error && (
              <p className="profile-message profile-message--error">
                {error}
              </p>
            )}
            {success && (
              <p className="profile-message profile-message--success">
                {success}
              </p>
            )}

            <div className="profile-actions">
              {isEditing ? (
                <>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      backgroundColor: "#dc3545",
                      borderColor: "#dc3545"
                    }}
                  >
                    Delete Account
                  </button>
                </>
              ) : (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "12px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
            }}>
              <h3 style={{ color: "#dc2626", marginBottom: "1rem" }}>Delete Account</h3>
              <p style={{ marginBottom: "1rem", color: "#666" }}>
                This action cannot be undone. This will permanently delete your account and all associated data.
              </p>
              <p style={{ marginBottom: "1rem", fontWeight: "bold" }}>
                Please type <span style={{ color: "#dc2626" }}>DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  fontSize: "1rem",
                  backgroundColor: "#f9fafb",
                  marginBottom: "1rem"
                }}
              />
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button
                  className="secondary-button"
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== "DELETE"}
                  style={{
                    backgroundColor: deleteConfirmText === "DELETE" ? "#dc3545" : "#9ca3af",
                    color: "white",
                    border: "none",
                    padding: "0.6rem 1.2rem",
                    borderRadius: "999px",
                    cursor: deleteConfirmText === "DELETE" ? "pointer" : "not-allowed",
                    fontSize: "1rem"
                  }}
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT: progress + links */}
        <div className="profile-right-card">
          <h2 className="profile-card-title">Degree Progress</h2>

          {loadingProgress ? (
            <p>Loading progress...</p>
          ) : (
            <>
              <p className="profile-progress-summary">
                Total Units Completed:{" "}
                <strong>
                  {completedUnits}/{totalUnits || "—"}
                </strong>
              </p>

              <ProgressBar
                completedUnits={completedUnits}
                totalUnits={totalUnits || 1}
              />
              <p className="profile-progress-percent">
                {progressPercent}% complete
              </p>
            </>
          )}

          <div className="profile-links">
            <button
              type="button"
              className="link-button"
              onClick={async () => {
                try {
                  // First check if user has transcript data
                  const transcriptResponse = await fetch("/student/transcript", { credentials: "include" });
                  const transcriptData = await transcriptResponse.json();
                  
                  if (transcriptData.status === "SUCCESS" && transcriptData.courses && transcriptData.courses.length > 0) {
                    // User has transcript data, now fetch the PDF
                    const pdfResponse = await fetch("/student/transcript/pdf", { 
                      credentials: "include",
                      method: "GET"
                    });
                    
                    if (pdfResponse.ok) {
                      // Convert response to blob and open in new tab
                      const blob = await pdfResponse.blob();
                      const url = window.URL.createObjectURL(blob);
                      window.open(url, "_blank");
                      // Clean up the blob URL after opening
                      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                    } else if (pdfResponse.status === 404) {
                      alert("Transcript PDF file not found on server. Please re-upload your transcript.");
                    } else {
                      alert(`Error loading PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
                    }
                  } else {
                    alert("No transcript found. Please upload a transcript first on the Dashboard.");
                  }
                } catch (error) {
                  console.error("PDF access error:", error);
                  alert("Error accessing transcript. Please check your connection and try again.");
                }
              }}
            >
              View Unofficial Transcript
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => navigate("/dashboard")}
            >
              View Degree Audit
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => window.open("https://www.ratemyprofessors.com/school/882", "_blank")}
            >
              Rate Professors & Classes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
