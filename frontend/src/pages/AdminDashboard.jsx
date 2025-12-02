import { useState, useEffect } from "react";
import { loadUsersFromCSV, sampleUsers } from "../utils/csvLoader";
import "../styles/theme.css";

function AdminDashboard({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAdmins: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the CSV loader utility that handles multiple fallbacks
      const userData = await loadUsersFromCSV();
      
      if (userData.length > 0) {
        setUsers(userData);
        
        // Calculate stats
        const totalUsers = userData.length;
        const totalStudents = userData.filter(u => u.role === 'student').length;
        const totalAdmins = userData.filter(u => u.role === 'admin').length;
        
        setStats({ totalUsers, totalStudents, totalAdmins });
      } else {
        // Final fallback to sample data
        setUsers(sampleUsers);
        const totalUsers = sampleUsers.length;
        const totalStudents = sampleUsers.filter(u => u.role === 'student').length;
        const totalAdmins = sampleUsers.filter(u => u.role === 'admin').length;
        setStats({ totalUsers, totalStudents, totalAdmins });
        setError('Using sample data - database connection may be unavailable');
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      // Final fallback to sample data
      setUsers(sampleUsers);
      const totalUsers = sampleUsers.length;
      const totalStudents = sampleUsers.filter(u => u.role === 'student').length;
      const totalAdmins = sampleUsers.filter(u => u.role === 'admin').length;
      setStats({ totalUsers, totalStudents, totalAdmins });
      setError('Failed to load data - showing sample data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Loading Dashboard...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "1200px", width: "90%" }}>
        <div className="auth-header">
          <h1 className="auth-title">Admin Dashboard</h1>
          <p className="auth-subtitle">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Admin'}! Here's your system overview.
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

        <div className="auth-form">
          {/* Stats Overview */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem', 
            marginBottom: '2rem' 
          }}>
            <div className="stats-card">
              <h3>Total Users</h3>
              <div className="stats-number">{stats.totalUsers}</div>
            </div>
            <div className="stats-card">
              <h3>Students</h3>
              <div className="stats-number">{stats.totalStudents}</div>
            </div>
            <div className="stats-card">
              <h3>Admins</h3>
              <div className="stats-number">{stats.totalAdmins}</div>
            </div>
          </div>

          {/* Recent Users */}
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Recent Users</h3>
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
                gridTemplateColumns: '2fr 2fr 1fr 1fr',
                gap: '1rem',
                fontWeight: 'bold'
              }}>
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Major</div>
              </div>
              {users.slice(0, 10).map((user, index) => (
                <div key={user.id} style={{
                  padding: '0.75rem',
                  borderBottom: index < users.slice(0, 10).length - 1 ? '1px solid #f3f4f6' : 'none',
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>{user.full_name || 'N/A'}</div>
                  <div>{user.email}</div>
                  <div>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      backgroundColor: user.role === 'admin' ? '#dbeafe' : '#dcfce7',
                      color: user.role === 'admin' ? '#1e40af' : '#166534'
                    }}>
                      {user.role}
                    </span>
                  </div>
                  <div>{user.major || 'N/A'}</div>
                </div>
              ))}
            </div>
          </div>

          {users.length > 10 && (
            <p style={{ 
              textAlign: 'center', 
              marginTop: '1rem', 
              color: '#6b7280' 
            }}>
              Showing 10 of {users.length} users. 
              <a href="/admin/users" style={{ color: 'var(--primary-color)' }}>
                View all users
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;