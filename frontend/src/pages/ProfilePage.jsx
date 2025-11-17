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

function ProfilePage({ user, onUserUpdate, onLogout }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    major: user?.major || "",
    grad_year: user?.grad_year || "",
    pronouns: user?.pronouns || "",
    bio: user?.bio || "",
    email: user?.email || "",
  });

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
      setProfile({
        full_name: user.full_name || "",
        major: user.major || "",
        grad_year: user.grad_year || "",
        pronouns: user.pronouns || "",
        bio: user.bio || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // fetch progress safely
  useEffect(() => {
    setLoadingProgress(true);

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
        setCompletedUnits(data.progress.completed_units || 0);
        setTotalUnits(data.progress.total_units || 0);
      })
      .catch((err) => {
        console.error("Progress fetch error:", err);
      })
      .finally(() => setLoadingProgress(false));
  }, []);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        full_name: profile.full_name,
        major: profile.major,
        grad_year: profile.grad_year,
        pronouns: profile.pronouns,
        bio: profile.bio,
      };

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
      setProfile({
        full_name: user.full_name || "",
        major: user.major || "",
        grad_year: user.grad_year || "",
        pronouns: user.pronouns || "",
        bio: user.bio || "",
        email: user.email || "",
      });
    }
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const progressPercent =
    totalUnits && totalUnits > 0
      ? Math.round((completedUnits / totalUnits) * 100)
      : 0;

  const expectedGradLabel = profile.grad_year
    ? `June ${profile.grad_year}`
    : "—";

  return (
    <div className="page-container profile-page">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <button className="secondary-button" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="profile-layout">
        {/* LEFT: avatar + details */}
        <div className="profile-left-card">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-circle">
              {getInitials(profile.full_name)}
            </div>
          </div>

          <div className="profile-details-card">
            <div className="profile-detail-row">
              <span className="profile-label">Name</span>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                />
              ) : (
                <span className="profile-value">{profile.full_name}</span>
              )}
            </div>

            <div className="profile-detail-row">
              <span className="profile-label">Email</span>
              <span className="profile-value">{profile.email}</span>
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
                <input
                  type="number"
                  value={profile.grad_year || ""}
                  onChange={(e) => handleChange("grad_year", e.target.value)}
                />
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
              onClick={() => navigate("/dashboard")}
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
              onClick={() => navigate("/dashboard")}
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
