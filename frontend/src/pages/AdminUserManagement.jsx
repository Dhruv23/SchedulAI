import { useState, useEffect } from "react";
import "../styles/theme.css";

function AdminUserManagement({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'student',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/admin/users', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/admin/user/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'create',
          ...formData
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccess('User created successfully!');
        setFormData({ email: '', full_name: '', role: 'student', password: '' });
        setIsCreating(false);
        fetchUsers(); // Refresh the list
      } else {
        setError(result.error || 'Failed to create user');
      }
    } catch (err) {
      console.error('Create user error:', err);
      setError('Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/admin/user/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'update',
          user_id: editingUser.id,
          ...formData
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccess('User updated successfully!');
        setEditingUser(null);
        setFormData({ email: '', full_name: '', role: 'student', password: '' });
        fetchUsers(); // Refresh the list
      } else {
        setError(result.error || 'Failed to update user');
      }
    } catch (err) {
      console.error('Update user error:', err);
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user: ${userEmail}?`)) {
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/admin/user/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'delete',
          user_id: userId
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccess('User deleted successfully!');
        fetchUsers(); // Refresh the list
      } else {
        setError(result.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      setError('Failed to delete user');
    }
  };

  const startEditing = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      email: userToEdit.email,
      full_name: userToEdit.full_name || '',
      role: userToEdit.role,
      password: '' // Don't populate password
    });
    setIsCreating(false);
  };

  const startCreating = () => {
    setIsCreating(true);
    setEditingUser(null);
    setFormData({ email: '', full_name: '', role: 'student', password: '' });
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingUser(null);
    setFormData({ email: '', full_name: '', role: 'student', password: '' });
    setError(null);
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Loading Users...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "1400px", width: "95%" }}>
        <div className="auth-header">
          <h1 className="auth-title">User Management</h1>
          <p className="auth-subtitle">
            Manage student and admin accounts in the system.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            margin: '1rem 0'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            margin: '1rem 0'
          }}>
            {success}
          </div>
        )}

        <div className="auth-form">
          {/* Create/Edit Form */}
          {(isCreating || editingUser) && (
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              backgroundColor: '#f9fafb'
            }}>
              <h3>{isCreating ? 'Create New User' : `Edit User: ${editingUser.email}`}</h3>
              <form onSubmit={isCreating ? handleCreateUser : handleUpdateUser}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email:</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="auth-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Full Name:</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="auth-input"
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Role:</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="auth-input"
                    >
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Password:</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required={isCreating}
                      placeholder={editingUser ? "Leave blank to keep current password" : ""}
                      className="auth-input"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="auth-button">
                    {isCreating ? 'Create User' : 'Update User'}
                  </button>
                  <button type="button" onClick={cancelForm} className="auth-link-button">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Action Buttons */}
          {!isCreating && !editingUser && (
            <div style={{ marginBottom: '1.5rem' }}>
              <button onClick={startCreating} className="auth-button">
                Create New User
              </button>
            </div>
          )}

          {/* Users List */}
          <div>
            <h3 style={{ marginBottom: '1rem' }}>All Users ({users.length})</h3>
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '0.75rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'grid',
                gridTemplateColumns: '0.5fr 2fr 2fr 1fr 1.5fr 2fr',
                gap: '1rem',
                fontWeight: 'bold'
              }}>
                <div>ID</div>
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Major</div>
                <div>Actions</div>
              </div>
              {users.map((userData, index) => (
                <div key={userData.id} style={{
                  padding: '0.75rem',
                  borderBottom: index < users.length - 1 ? '1px solid #f3f4f6' : 'none',
                  display: 'grid',
                  gridTemplateColumns: '0.5fr 2fr 2fr 1fr 1.5fr 2fr',
                  gap: '1rem',
                  alignItems: 'center'
                }}>
                  <div>{userData.id}</div>
                  <div>{userData.full_name || 'N/A'}</div>
                  <div>{userData.email}</div>
                  <div>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      backgroundColor: userData.role === 'admin' ? '#dbeafe' : '#dcfce7',
                      color: userData.role === 'admin' ? '#1e40af' : '#166534'
                    }}>
                      {userData.role}
                    </span>
                  </div>
                  <div>{userData.major || 'N/A'}</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => startEditing(userData)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    {userData.id !== user?.id && ( // Don't allow deleting self
                      <button
                        onClick={() => handleDeleteUser(userData.id, userData.email)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.875rem',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUserManagement;