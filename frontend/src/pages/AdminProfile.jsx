import { useState } from "react";
import "../styles/theme.css";

function AdminProfile({ user, onUserUpdate, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    if (message.text) {
      setMessage({ text: "", type: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    // Validate password change if attempted
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        setMessage({
          text: "Current password is required to change password",
          type: "error"
        });
        setLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({
          text: "New passwords do not match",
          type: "error"
        });
        setLoading(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        setMessage({
          text: "New password must be at least 6 characters long",
          type: "error"
        });
        setLoading(false);
        return;
      }
    }

    try {
      const updateData = {
        full_name: formData.full_name,
        email: formData.email,
      };

      // Add password change if provided
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch("/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          text: "Profile updated successfully!",
          type: "success"
        });
        setIsEditing(false);
        
        // Update user data in parent component
        if (onUserUpdate) {
          onUserUpdate({
            ...user,
            full_name: formData.full_name,
            email: formData.email,
          });
        }
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
      } else {
        setMessage({
          text: result.error || "Failed to update profile",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage({
        text: "Network error. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      full_name: user?.full_name || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setMessage({ text: "", type: "" });
  };

  const handleLogoutClick = async () => {
    try {
      await fetch("/logout", {
        method: "POST",
        credentials: "include",
      });
      // Clear all session data
      localStorage.removeItem('userSession');
      sessionStorage.removeItem('userSession');
      localStorage.removeItem('rememberMe');
      onLogout(); // Clear user state
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.removeItem('userSession');
      sessionStorage.removeItem('userSession');
      localStorage.removeItem('rememberMe');
      onLogout(); // Clear user state anyway
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Admin Profile</h1>
          <p className="auth-subtitle">
            Manage your administrative account information
          </p>
        </div>

        <div className="auth-form">
          {/* Display Message */}
          {message.text && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.375rem",
                marginBottom: "1rem",
                backgroundColor: message.type === "error" ? "#fee2e2" : "#dcfce7",
                border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                color: message.type === "error" ? "#dc2626" : "#166534",
              }}
            >
              {message.text}
            </div>
          )}

          {!isEditing ? (
            // Display Mode
            <div>
              <div className="profile-info">
                <div className="profile-field">
                  <label>Full Name:</label>
                  <span>{user?.full_name || "Not provided"}</span>
                </div>

                <div className="profile-field">
                  <label>Email:</label>
                  <span>{user?.email}</span>
                </div>

                <div className="profile-field">
                  <label>Role:</label>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af'
                  }}>
                    Administrator
                  </span>
                </div>

                <div className="profile-field">
                  <label>User ID:</label>
                  <span>{user?.id}</span>
                </div>
              </div>

              <div className="profile-actions">
                <button
                  className="auth-button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
                <button
                  className="auth-link-button"
                  onClick={handleLogoutClick}
                  style={{ marginLeft: "1rem" }}
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleSubmit}>
              <div className="auth-input-group">
                <label htmlFor="full_name">Full Name</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="auth-input"
                  required
                />
              </div>

              <div className="auth-input-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="auth-input"
                  required
                />
              </div>

              <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "1px solid #e5e7eb" }} />

              <h3 style={{ marginBottom: "1rem" }}>Change Password (Optional)</h3>

              <div className="auth-input-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="auth-input"
                  placeholder="Required to change password"
                />
              </div>

              <div className="auth-input-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="auth-input"
                  placeholder="Leave blank to keep current password"
                  minLength="6"
                />
              </div>

              <div className="auth-input-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="auth-input"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="auth-actions">
                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Profile"}
                </button>
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={handleCancel}
                  disabled={loading}
                  style={{ marginLeft: "1rem" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;