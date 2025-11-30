// src/pages/AdminPage.jsx

export default function AdminPage() {
    return (
      <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
          Admin Dashboard
        </h1>
  
        <p style={{ fontSize: "16px", color: "#666", marginBottom: "30px" }}>
          Welcome, Admin! This is your control center to manage students and view system activity.
        </p>
  
        {/* Section 1 - Summary Cards */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "40px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: "1",
              minWidth: "200px",
              background: "#f3f4f6",
              padding: "20px",
              borderRadius: "10px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "20px" }}>Total Students</h2>
            <p style={{ fontSize: "28px", marginTop: "10px" }}>–</p>
          </div>
  
          <div
            style={{
              flex: "1",
              minWidth: "200px",
              background: "#f3f4f6",
              padding: "20px",
              borderRadius: "10px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "20px" }}>Courses</h2>
            <p style={{ fontSize: "28px", marginTop: "10px" }}>–</p>
          </div>
  
          <div
            style={{
              flex: "1",
              minWidth: "200px",
              background: "#f3f4f6",
              padding: "20px",
              borderRadius: "10px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "20px" }}>Pending Tasks</h2>
            <p style={{ fontSize: "28px", marginTop: "10px" }}>–</p>
          </div>
        </div>
  
        {/* Section 2 - Management Actions */}
        <div
          style={{
            background: "#ffffff",
            padding: "25px",
            borderRadius: "10px",
            border: "1px solid #eee",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Manage Students</h2>
          <p style={{ marginBottom: "20px", color: "#666" }}>
            This is a prototype view where you’ll later add tools to create, edit,
            or remove student accounts.
          </p>
  
          <button
            disabled
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#cbd5e1",
              cursor: "not-allowed",
            }}
          >
            Add New Student (coming soon)
          </button>
        </div>
      </div>
    );
  }
  